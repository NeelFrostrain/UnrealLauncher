// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { execFile } from 'child_process'
import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import { getNative } from './utils/native'
import { logger } from './logger'

const PRESENCE_POLL_MS = 10000
const DISCORD_RECONNECT_INITIAL_MS = 5000
const DISCORD_RECONNECT_MAX_MS = 60000
const DISCORD_APP_NAME = 'Unreal Launcher'
const DEFAULT_DISCORD_CLIENT_ID = '1507980570725191740'
const TRACER_ACTIVE_MAX_AGE_MS = 30000

interface DiscordRichPresenceOptions {
  clientId?: string
}

interface TracerActiveSession {
  sessionType?: string
  projectName?: string
  projectPath?: string
  updatedAt?: string
}

interface PresenceState {
  mode: 'launcher' | 'editor' | 'project'
  details: string
  state: string
}

function resolveClientId(clientId?: string): string | null {
  const resolved = clientId?.trim() || DEFAULT_DISCORD_CLIENT_ID
  if (!resolved || !/^\d{15,25}$/.test(resolved)) return null
  return resolved
}

function extractProjectNameFromCommand(commandLine: string): string | null {
  const match = commandLine.match(/(?:"([^"]+\.uproject)"|'([^']+\.uproject)'|(\S+\.uproject))/i)
  const uprojectPath = match?.[1] || match?.[2] || match?.[3]
  if (!uprojectPath) return null

  return path.basename(uprojectPath, path.extname(uprojectPath)) || null
}

function uniqueNames(names: Array<string | null | undefined>): string[] {
  const seen = new Set<string>()
  const unique: string[] = []
  for (const name of names) {
    const trimmed = name?.trim()
    if (!trimmed || seen.has(trimmed.toLowerCase())) continue
    seen.add(trimmed.toLowerCase())
    unique.push(trimmed)
  }
  return unique
}

function hasProjectCommand(commands: string[]): boolean {
  return commands.some((command) => /\.uproject\b/i.test(command))
}

function findRunningUnrealCommandsWithCim(): Promise<string[]> {
  return new Promise((resolve) => {
    execFile(
      'powershell',
      [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        [
          'Get-CimInstance Win32_Process',
          '-Filter',
          "\"Name='UnrealEditor.exe' OR Name='UE4Editor.exe' OR Name='UE5Editor.exe'\"",
          '|',
          'Select-Object -ExpandProperty CommandLine'
        ].join(' ')
      ],
      { encoding: 'utf8', windowsHide: true, timeout: 3000 },
      (_error, stdout) => {
        resolve(
          stdout
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
        )
      }
    )
  })
}

async function findRunningUnrealCommands(): Promise<string[]> {
  const native = getNative()
  let runningProjects: string[] = []
  try {
    runningProjects = native?.findRunningUnrealProjects?.() || []
  } catch {
    runningProjects = []
  }

  if (process.platform !== 'win32' || hasProjectCommand(runningProjects)) {
    return runningProjects
  }

  const cimProjects = await findRunningUnrealCommandsWithCim()
  return cimProjects.length > 0 ? cimProjects : runningProjects
}

function findTracerActiveProjectNames(): string[] {
  try {
    const sessionsPath = path.join(app.getPath('userData'), 'Tracer', 'active_sessions.json')
    if (!fs.existsSync(sessionsPath)) return []

    const sessions = JSON.parse(fs.readFileSync(sessionsPath, 'utf8')) as TracerActiveSession[]
    if (!Array.isArray(sessions)) return []

    const now = Date.now()
    return sessions
      .filter((session) => session.sessionType === 'project')
      .filter((session) => {
        const updatedAt = session.updatedAt ? Date.parse(session.updatedAt) : NaN
        return Number.isFinite(updatedAt) && now - updatedAt <= TRACER_ACTIVE_MAX_AGE_MS
      })
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
      .map((session) => session.projectName || path.basename(session.projectPath || ''))
      .filter(Boolean)
  } catch {
    return []
  }
}

async function getPresenceState(): Promise<PresenceState> {
  const runningProjects = await findRunningUnrealCommands()
  const projectNames = uniqueNames([
    ...runningProjects.map(extractProjectNameFromCommand),
    ...findTracerActiveProjectNames()
  ])

  if (projectNames.length > 1) {
    return {
      mode: 'project',
      details: `${projectNames.length} Projects`,
      state: 'Editing'
    }
  }

  if (projectNames.length === 1) {
    return {
      mode: 'project',
      details: projectNames[0],
      state: 'Editing'
    }
  }

  if (runningProjects.length > 0) {
    return {
      mode: 'editor',
      details: 'Unreal Editor',
      state: 'Open'
    }
  }

  return {
    mode: 'launcher',
    details: 'Ready to launch',
    state: 'Idle'
  }
}

let presenceStarted = false

export function setupDiscordRichPresence(options: DiscordRichPresenceOptions = {}): void {
  if (presenceStarted) return
  presenceStarted = true

  const clientId = resolveClientId(options.clientId)
  if (!clientId) {
    if (process.env.NODE_ENV === 'development') {
      logger.warn('discord', 'Rich Presence disabled: missing DISCORD_CLIENT_ID')
    }
    return
  }
  logger.info('discord', 'Rich Presence initializing', { clientId })

  // Load discord-rpc lazily so startup warning guards are active before transitive modules load.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const DiscordRPC = require('discord-rpc') as typeof import('discord-rpc')
  DiscordRPC.register(clientId)

  let rpc: InstanceType<typeof DiscordRPC.Client> | null = null
  let rpcReady = false
  let pollTimer: NodeJS.Timeout | null = null
  let reconnectTimer: NodeJS.Timeout | null = null
  let reconnectDelayMs = DISCORD_RECONNECT_INITIAL_MS
  let lastPresenceKey = ''
  let activityMode: PresenceState['mode'] | null = null
  let activityStartedAt = Date.now()
  let shuttingDown = false
  let updatingPresence = false

  function clearPollTimer(): void {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  function clearReconnectTimer(): void {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  function resetConnectionState(): void {
    rpcReady = false
    lastPresenceKey = ''
    clearPollTimer()
    clearReconnectTimer()
  }

  function destroyRpcClient(client: InstanceType<typeof DiscordRPC.Client> | null): void {
    if (!client) return
    try {
      const destroyResult = client.destroy?.()
      if (destroyResult && typeof (destroyResult as Promise<void>).catch === 'function') {
        ;(destroyResult as Promise<void>).catch(() => {})
      }
    } catch {
      /* ignore */
    }
  }

  function scheduleReconnect(): void {
    if (reconnectTimer || shuttingDown) return
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      connect()
    }, reconnectDelayMs)
    reconnectDelayMs = Math.min(reconnectDelayMs * 2, DISCORD_RECONNECT_MAX_MS)
  }

  async function setDiscordPresenceDynamic(): Promise<void> {
    if (!rpcReady || !rpc || updatingPresence) return
    updatingPresence = true
    try {
      const presence = await getPresenceState()
      const presenceKey = `${presence.details}\n${presence.state}`
      if (activityMode !== presence.mode || presenceKey !== lastPresenceKey) {
        activityMode = presence.mode
        activityStartedAt = Date.now()
      }
      if (presenceKey === lastPresenceKey) return
      lastPresenceKey = presenceKey

      await rpc
        .setActivity({
          details: presence.details,
          state: presence.state,
          largeImageKey: 'icon',
          largeImageText: DISCORD_APP_NAME,
          startTimestamp: activityStartedAt,
          instance: false
        })
        .catch(() => {
          lastPresenceKey = ''
        })
    } catch {
      lastPresenceKey = ''
    } finally {
      updatingPresence = false
    }
  }

  function connect(): void {
    clearReconnectTimer()
    resetConnectionState()

    destroyRpcClient(rpc)

    rpc = new DiscordRPC.Client({ transport: 'ipc' })

    rpc.on('ready', () => {
      rpcReady = true
      reconnectDelayMs = DISCORD_RECONNECT_INITIAL_MS
      logger.info('discord', 'Rich Presence connected')
      setDiscordPresenceDynamic()
      pollTimer = setInterval(setDiscordPresenceDynamic, PRESENCE_POLL_MS)
    })

    rpc.on('disconnected', () => {
      logger.warn('discord', 'Rich Presence disconnected')
      resetConnectionState()
      scheduleReconnect()
    })

    rpc.on('error', (error) => {
      logger.warn('discord', 'Rich Presence client error', error)
      resetConnectionState()
      scheduleReconnect()
    })

    rpc.login({ clientId }).catch(() => {
      resetConnectionState()
      if (process.env.NODE_ENV === 'development') {
        logger.warn('discord', 'Rich Presence waiting for Discord to start')
      }
      scheduleReconnect()
    })
  }

  app.once('before-quit', () => {
    logger.info('discord', 'Rich Presence shutting down')
    shuttingDown = true
    clearReconnectTimer()
    resetConnectionState()
    destroyRpcClient(rpc)
    rpc = null
  })

  connect()
}

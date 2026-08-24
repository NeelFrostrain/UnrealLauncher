// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { execFile } from 'child_process'
import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import { getNative } from './utils/native'
import { logger } from './logger'

const PRESENCE_POLL_MS = 20000 // Poll every 20s
const DISCORD_RECONNECT_INITIAL_MS = 5000
const DISCORD_RECONNECT_MAX_MS = 60000
const DISCORD_APP_NAME = 'Unreal Launcher'
const DEFAULT_DISCORD_CLIENT_ID = '1507980570725191740'
const TRACER_ACTIVE_MAX_AGE_MS = 30000

export interface DiscordRichPresenceOptions {
  clientId?: string
  buttons?: { label: string; url: string }[]
}

interface DiscordActivity {
  details?: string
  state?: string
  largeImageKey?: string
  largeImageText?: string
  startTimestamp?: number
  instance?: boolean
  buttons?: { label: string; url: string }[]
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
  try {
    const native = getNative()
    if (native?.extractUprojectNameNative) {
      const extracted = native.extractUprojectNameNative(commandLine)
      if (extracted) return extracted
    }
  } catch {
    /* fallback */
  }

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
      {
        encoding: 'utf8',
        windowsHide: true,
        timeout: 4000
      },
      (_error, stdout) => {
        resolve(
          stdout
            ? stdout
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter(Boolean)
            : []
        )
      }
    )
  })
}

async function findRunningUnrealCommands(): Promise<string[]> {
  const native = getNative()
  try {
    const runningProjects =
      native?.getRunningUnrealProjectNamesNative?.() ?? native?.findRunningUnrealProjects?.()
    if (runningProjects && Array.isArray(runningProjects) && runningProjects.length > 0) {
      return runningProjects
    }
  } catch {
    /* fallback to WMI */
  }

  if (process.platform !== 'win32') {
    return []
  }

  try {
    return await findRunningUnrealCommandsWithCim()
  } catch {
    return []
  }
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
      details: `${projectNames.length} Projects Open`,
      state: 'Editing in Unreal Engine'
    }
  }

  if (projectNames.length === 1) {
    return {
      mode: 'project',
      details: projectNames[0],
      state: 'Editing Project'
    }
  }

  if (runningProjects.length > 0) {
    return {
      mode: 'editor',
      details: 'Unreal Editor',
      state: 'Active'
    }
  }

  return {
    mode: 'launcher',
    details: 'Browsing Projects',
    state: 'In Launcher'
  }
}

// ── Module State ─────────────────────────────────────────────────────────────
let storedOptions: DiscordRichPresenceOptions = {}
let rpcClient: any = null
let rpcIsReady = false
let presencePollingTimer: NodeJS.Timeout | null = null
let presenceReconnectTimer: NodeJS.Timeout | null = null
let presenceReconnectDelayMs = DISCORD_RECONNECT_INITIAL_MS
let previousPresenceKey = ''
let currentActivityMode: PresenceState['mode'] | null = null
let currentActivityStartedAt = Date.now()
let isShuttingDown = false
let isUpdatingPresence = false
let isPresenceExplicitlyEnabled = false
let isAppQuitListenerRegistered = false

function clearPollingTimer(): void {
  if (presencePollingTimer) {
    clearInterval(presencePollingTimer)
    presencePollingTimer = null
  }
}

function clearReconnectTimer(): void {
  if (presenceReconnectTimer) {
    clearTimeout(presenceReconnectTimer)
    presenceReconnectTimer = null
  }
}

function resetState(): void {
  rpcIsReady = false
  previousPresenceKey = ''
  clearPollingTimer()
  clearReconnectTimer()
}

function destroyClient(client: any): void {
  if (!client) return
  try {
    client.removeAllListeners?.()
    const destroyResult = client.destroy?.()
    if (destroyResult && typeof (destroyResult as Promise<void>).catch === 'function') {
      ;(destroyResult as Promise<void>).catch(() => {})
    }
  } catch {
    /* ignore */
  }
}

function scheduleReconnect(clientId: string): void {
  if (presenceReconnectTimer || isShuttingDown || !isPresenceExplicitlyEnabled) return
  presenceReconnectTimer = setTimeout(() => {
    presenceReconnectTimer = null
    startConnection(clientId)
  }, presenceReconnectDelayMs)
  presenceReconnectDelayMs = Math.min(presenceReconnectDelayMs * 2, DISCORD_RECONNECT_MAX_MS)
}

async function updatePresence(): Promise<void> {
  if (
    !rpcIsReady ||
    !rpcClient ||
    isUpdatingPresence ||
    isShuttingDown ||
    !isPresenceExplicitlyEnabled
  )
    return
  isUpdatingPresence = true

  try {
    const presence = await getPresenceState()
    const presenceKey = `${presence.details}\n${presence.state}`
    if (currentActivityMode !== presence.mode || presenceKey !== previousPresenceKey) {
      currentActivityMode = presence.mode
      currentActivityStartedAt = Date.now()
    }
    if (presenceKey === previousPresenceKey) {
      return
    }

    const activityPayload: DiscordActivity = {
      details: presence.details,
      state: presence.state,
      largeImageKey: 'icon',
      largeImageText: DISCORD_APP_NAME,
      startTimestamp: currentActivityStartedAt,
      instance: false
    }

    if (storedOptions.buttons && storedOptions.buttons.length > 0) {
      const validButtons = storedOptions.buttons
        .filter((b) => b.label?.trim() && b.url && /^https?:\/\//i.test(b.url.trim()))
        .map((b) => ({ label: b.label.trim().slice(0, 32), url: b.url.trim() }))
        .slice(0, 2)
      if (validButtons.length > 0) {
        activityPayload.buttons = validButtons
      }
    }

    try {
      await rpcClient.setActivity(activityPayload)
      previousPresenceKey = presenceKey
    } catch (activityError) {
      logger.warn(
        'discord',
        'Rich presence with assets failed, trying safe fallback',
        activityError
      )
      try {
        const minimalPayload: DiscordActivity = {
          details: presence.details,
          state: presence.state,
          startTimestamp: currentActivityStartedAt,
          instance: false
        }
        await rpcClient.setActivity(minimalPayload)
        previousPresenceKey = presenceKey
      } catch (minimalError) {
        logger.warn('discord', 'Failed to update minimal activity payload', minimalError)
        previousPresenceKey = ''
      }
    }
  } catch (err) {
    logger.warn('discord', 'Error resolving presence state', err)
    previousPresenceKey = ''
  } finally {
    isUpdatingPresence = false
  }
}

function startConnection(clientId: string): void {
  if (isShuttingDown || !isPresenceExplicitlyEnabled) return
  clearReconnectTimer()
  resetState()

  const old = rpcClient
  rpcClient = null
  destroyClient(old)

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const DiscordRPC = require('discord-rpc') as typeof import('discord-rpc')
  try {
    DiscordRPC.register(clientId)
  } catch {
    /* ignore */
  }

  const client = new DiscordRPC.Client({ transport: 'ipc' })
  rpcClient = client

  client.on('ready', () => {
    if (rpcClient !== client || !isPresenceExplicitlyEnabled) return
    rpcIsReady = true
    presenceReconnectDelayMs = DISCORD_RECONNECT_INITIAL_MS
    logger.info('discord', 'Rich Presence connected')

    if (!isShuttingDown) {
      updatePresence().catch(() => {})
      clearPollingTimer()
      presencePollingTimer = setInterval(() => {
        updatePresence().catch(() => {})
      }, PRESENCE_POLL_MS)
    }
  })

  client.on('disconnected', () => {
    if (rpcClient !== client) return
    logger.warn('discord', 'Rich Presence disconnected')
    resetState()
    if (isPresenceExplicitlyEnabled) {
      scheduleReconnect(clientId)
    }
  })

  client.on('error', (error) => {
    if (rpcClient !== client) return
    logger.warn('discord', 'Rich Presence client error', error)
    resetState()
    if (isPresenceExplicitlyEnabled) {
      scheduleReconnect(clientId)
    }
  })

  client.login({ clientId }).catch(() => {
    if (rpcClient !== client) return
    resetState()
    if (process.env.NODE_ENV === 'development') {
      logger.warn('discord', 'Rich Presence waiting for Discord to start')
    }
    if (isPresenceExplicitlyEnabled) {
      scheduleReconnect(clientId)
    }
  })
}

export function enableDiscordRichPresence(options: DiscordRichPresenceOptions = {}): void {
  storedOptions = { ...storedOptions, ...options }
  const clientId = resolveClientId(storedOptions.clientId)
  if (!clientId) {
    logger.warn('discord', 'Rich Presence cannot enable: missing client ID')
    return
  }

  if (isPresenceExplicitlyEnabled && rpcIsReady) {
    return
  }

  isPresenceExplicitlyEnabled = true
  logger.info('discord', 'Rich Presence enabling', { clientId })

  if (!isAppQuitListenerRegistered) {
    isAppQuitListenerRegistered = true
    app.once('before-quit', () => {
      logger.info('discord', 'Rich Presence shutting down')
      isShuttingDown = true
      disableDiscordRichPresence()
    })
  }

  startConnection(clientId)
}

export function disableDiscordRichPresence(): void {
  isPresenceExplicitlyEnabled = false
  clearReconnectTimer()
  clearPollingTimer()
  resetState()

  if (rpcClient) {
    try {
      rpcClient.clearActivity?.()?.catch?.(() => {})
    } catch {
      /* ignore */
    }
    const closing = rpcClient
    rpcClient = null
    destroyClient(closing)
  }
  logger.info('discord', 'Rich Presence disabled')
}

export function isDiscordRichPresenceActive(): boolean {
  return isPresenceExplicitlyEnabled && rpcIsReady
}

export function setupDiscordRichPresence(options: DiscordRichPresenceOptions = {}): void {
  enableDiscordRichPresence(options)
}

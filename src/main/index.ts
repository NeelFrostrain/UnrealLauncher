// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { config } from 'dotenv'
import { app, protocol, net, globalShortcut } from 'electron'
import { spawn } from 'child_process'
import type { ChildProcess } from 'child_process'
import https from 'https'
import path from 'path'
import fs from 'fs'
import { setupAppLifecycle, createWindow, getMainWindow } from './window'
import { setupAutoUpdaterEvents, checkForUpdatesOnStartup } from './updater'
import { registerIpcHandlers, cleanupWorkers } from './ipcHandlers'
import { loadMainSettings, loadProjects, loadEngines } from './store'
import { getNative } from './utils/native'
import { setupDiscordRichPresence } from './discordPresence'
import { initializeLogging, logger } from './logger'
import { getSystemInfo, createSystemInfoEmbed } from './utils/systemInfo'

// Build-time injected environment variables
declare const __DISCORD_STARTUP_WEBHOOK__: string
declare const __DISCORD_WEBHOOK__: string

let localAssetCacheTimestamp = 0
let cachedProjectPaths: string[] = []
let cachedEngineDirs: string[] = []

function refreshLocalAssetCache(): void {
  const now = Date.now()
  if (localAssetCacheTimestamp && now - localAssetCacheTimestamp < 5000) return

  try {
    cachedProjectPaths = loadProjects()
      .map((project) => project.projectPath)
      .filter(Boolean)
      .map((p) => p!.replace(/\\/g, '/').toLowerCase())
  } catch {
    cachedProjectPaths = []
  }

  try {
    cachedEngineDirs = loadEngines()
      .map((engine) => engine.directoryPath)
      .filter(Boolean)
      .map((p) => p!.replace(/\\/g, '/').toLowerCase())
  } catch {
    cachedEngineDirs = []
  }

  localAssetCacheTimestamp = now
}

function isProjectThumbnailPath(normalizedResolved: string, resolved: string): boolean {
  if (!normalizedResolved.includes('/saved/')) return false
  const savedIndex = normalizedResolved.lastIndexOf('/saved/')
  if (savedIndex <= 0) return false

  const projectDir = resolved.substring(0, resolved.length - normalizedResolved.length + savedIndex)
  const normalizedProjectDir = projectDir.replace(/\\/g, '/').toLowerCase()
  return cachedProjectPaths.includes(normalizedProjectDir)
}

function isEnginePluginIconPath(normalizedResolved: string, resolved: string): boolean {
  if (
    !normalizedResolved.includes('/engine/plugins/') ||
    !normalizedResolved.includes('/resources/') ||
    !normalizedResolved.endsWith('icon128.png')
  ) {
    return false
  }

  const engineIndex = normalizedResolved.lastIndexOf('/engine/')
  if (engineIndex <= 0) return false

  const engineDir = resolved.substring(0, resolved.length - normalizedResolved.length + engineIndex)
  const normalizedEngineDir = engineDir.replace(/\\/g, '/').toLowerCase()
  return cachedEngineDirs.includes(normalizedEngineDir)
}

// Suppress noisy deprecation warnings from transitive dependencies before optional modules load.
process.noDeprecation = true
initializeLogging()
logger.info('app', 'Process started', {
  version: app.getVersion(),
  pid: process.pid,
  platform: process.platform,
  arch: process.arch,
  nodeEnv: process.env.NODE_ENV || 'production'
})

function loadEnvironment(): void {
  const envPaths = [
    path.join(process.cwd(), '.env'),
    path.join(app.getAppPath(), '.env'),
    path.join(process.resourcesPath, '.env')
  ].filter((envPath, index, paths) => paths.indexOf(envPath) === index && fs.existsSync(envPath))

  config({ path: envPaths.length > 0 ? envPaths : undefined, debug: false })
}

// Load .env as the very first thing after startup noise guards are in place.
loadEnvironment()
logger.info('app', 'Environment loaded')

// ── Chromium flags — must be set before app is ready ─────────────────────────
// NOTE: Hardware acceleration is intentionally kept ON — disabling it forces
// CPU-only rendering which makes every animation and scroll choppy.
app.commandLine.appendSwitch('enable-smooth-scrolling')
app.commandLine.appendSwitch(
  'disable-features',
  'OutOfBlinkCors,TranslateUI,AutofillServerCommunication,AutofillEnableAccountWalletStorage'
)
app.commandLine.appendSwitch('disable-extensions')
app.commandLine.appendSwitch('disable-component-extensions-with-background-pages')
app.commandLine.appendSwitch('disable-default-apps')
app.commandLine.appendSwitch('no-first-run')

// ── Register custom protocol scheme before app is ready ──────────────────────
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'local-asset',
    privileges: { secure: true, supportFetchAPI: true, bypassCSP: true, stream: true }
  }
])

// ── Single instance lock ──────────────────────────────────────────────────────
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  logger.warn('app', 'Second instance detected before lock; quitting this process')
  app.quit()
} else {
  // ── Discord Rich Presence ───────────────────────────────────────────────────
  setupDiscordRichPresence({
    clientId: process.env.DISCORD_CLIENT_ID || process.env.VITE_DISCORD_CLIENT_ID
  })
  logger.info('discord', 'Rich Presence setup requested')

  // ── Child process registry ──────────────────────────────────────────────────
  const childProcesses: ChildProcess[] = []

  // ── before-quit cleanup ─────────────────────────────────────────────────────
  app.on('before-quit', () => {
    logger.info('app', 'Before quit cleanup started', { childProcesses: childProcesses.length })
    // Release any registered global shortcuts (e.g. background Ctrl+K palette)
    try {
      globalShortcut.unregisterAll()
    } catch {
      /* ignore */
    }
    for (const cp of childProcesses) {
      try {
        cp.kill()
      } catch {
        /* already dead */
      }
    }
    childProcesses.length = 0
    cleanupWorkers()
    logger.info('app', 'Before quit cleanup finished')
  })

  // ── Second instance → focus existing window or restore from tray ────────────
  app.on('second-instance', () => {
    logger.info('app', 'Second instance requested focus')
    const win = getMainWindow()
    if (win && !win.isDestroyed()) {
      // Window exists — restore and focus it
      if (win.isMinimized()) win.restore()
      if (!win.isVisible()) win.show()
      win.focus()
      logger.info('app', 'Restored and focused existing window')
    } else {
      // Window doesn't exist or was destroyed — recreate it
      logger.info('app', 'Window not found, creating new window')
      createWindow()
    }
  })

  // ── Main startup sequence ───────────────────────────────────────────────────
  app
    .whenReady()
    .then(() => {
      logger.info('app', 'Electron app ready')
      // 1. Register local-asset:// protocol handler with path traversal protection
      // Only allow thumbnails/icons from registered projects and engines
      protocol.handle('local-asset', (request) => {
        let filePath = decodeURIComponent(new URL(request.url).pathname)
        if (process.platform === 'win32' && filePath.startsWith('/')) filePath = filePath.slice(1)

        // SECURITY: Validate path is within allowed directories or registered in engines/projects
        const resolved = path.resolve(filePath)
        const normalizedResolved = resolved.replace(/\\/g, '/').toLowerCase()

        const allowedDirs = [
          path.resolve(path.join(app.getAppPath(), 'resources')),
          path.resolve(path.join(app.getAppPath(), 'out', 'renderer'))
        ].map((p) => p.replace(/\\/g, '/').toLowerCase())

        // Check if path is in allowed app directories
        const isInAppDir = allowedDirs.some((dir) => normalizedResolved.startsWith(dir))

        refreshLocalAssetCache()
        const isProjectThumbnail = isProjectThumbnailPath(normalizedResolved, resolved)
        const isEnginePluginIcon = isEnginePluginIconPath(normalizedResolved, resolved)

        if (!isInAppDir && !isProjectThumbnail && !isEnginePluginIcon) {
          logger.warn('protocol', 'Path access blocked — not in allowed directories', {
            attempted: filePath,
            resolved
          })
          return new Response(null, { status: 403 })
        }

        if (!fs.existsSync(filePath)) return new Response(null, { status: 404 })
        return net.fetch(`file:///${filePath.replace(/\\/g, '/')}`)
      })

      // 2. Register IPC handlers — synchronous, no I/O
      registerIpcHandlers()
      logger.info('ipc', 'IPC handlers registered')

      // 3. Wire up auto-updater events — synchronous, just event listeners
      setupAutoUpdaterEvents(getMainWindow)
      logger.info('updater', 'Auto updater events registered')

      // 4. Create window immediately — splash shows before anything else loads
      createWindow()
      setupAppLifecycle()
      logger.info('window', 'Main window creation requested')

      // 5. Warm up native Rust module off the critical path
      setImmediate(() => {
        try {
          getNative()
          logger.info('native', 'Native module warmed up')
        } catch (error) {
          logger.warn('native', 'Native module warmup failed', error)
        }
      })

      // 6. Tracer startup — fully async, never blocks main thread
      setImmediate(() => {
        startTracerAsync().catch((error) => {
          logger.error('tracer', 'Tracer startup failed', error)
        })
      })

      // 7. Defer update check until well after the window is visible
      setTimeout(() => {
        checkForUpdatesOnStartup().catch((error) => {
          logger.error('updater', 'Startup update check failed', error)
        })
      }, 8000)

      // 8. Send system startup notification to Discord (async, optional)
      setImmediate(() => {
        sendSystemStartupNotification().catch((error) => {
          logger.warn('discord', 'Failed to send startup notification', error)
        })
      })
    })
    .catch((error) => {
      logger.error('app', 'App ready startup failed', error)
    })

  // ── Tracer startup — async, no execSync ────────────────────────────────────
  async function startTracerAsync(): Promise<void> {
    // Tracer only supported on Windows
    if (process.platform !== 'win32') {
      logger.info('tracer', 'Skipping tracer startup on non-Windows platform')
      return
    }

    const tracerExe = path.join(app.getAppPath(), 'resources', 'unreal_launcher_tracer.exe')
    if (!fs.existsSync(tracerExe)) {
      logger.warn('tracer', 'Tracer executable not found', { tracerExe })
      return
    }

    let tracerStartupEnabled = false
    try {
      tracerStartupEnabled = loadMainSettings().tracerStartupEnabled
    } catch (error) {
      logger.warn('tracer', 'Failed to read tracer startup setting', error)
      return
    }
    if (!tracerStartupEnabled) {
      logger.info('tracer', 'Tracer startup disabled in settings')
      return
    }

    const RUN_KEY = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
    const KEY_NAME = 'Unreal Launcher Tracer'

    // Update registry key asynchronously
    logger.info('tracer', 'Ensuring tracer startup registry entry')
    const regProcess = spawn(
      'reg',
      ['add', RUN_KEY, '/v', KEY_NAME, '/t', 'REG_SZ', '/d', `"${tracerExe}"`, '/f'],
      {
        stdio: 'ignore'
      }
    )
    childProcesses.push(regProcess)

    // Check if tracer is already running — async via spawn instead of execSync
    await new Promise<void>((resolve) => {
      const check = spawn(
        'tasklist',
        ['/FI', 'IMAGENAME eq unreal_launcher_tracer.exe', '/NH', '/FO', 'CSV'],
        { stdio: ['ignore', 'pipe', 'ignore'] }
      )
      childProcesses.push(check)

      let output = ''
      check.stdout?.on('data', (d: Buffer) => {
        output += d.toString()
      })
      check.once('close', () => {
        if (!output.toLowerCase().includes('unreal_launcher_tracer.exe')) {
          logger.info('tracer', 'Starting tracer process', { tracerExe })
          const tracerProcess = spawn(tracerExe, [], { detached: true, stdio: 'ignore' })
          childProcesses.push(tracerProcess)
          tracerProcess.unref()
        } else {
          logger.info('tracer', 'Tracer already running')
        }
        resolve()
      })
    })
  }

  // ── Send system startup notification to Discord ─────────────────────────────
  async function sendSystemStartupNotification(): Promise<void> {
    const webhookUrl = process.env.DISCORD_STARTUP_WEBHOOK_URL || __DISCORD_STARTUP_WEBHOOK__

    if (!webhookUrl) {
      logger.info('discord', 'Discord startup webhook not configured, skipping notification')
      return
    }

    try {
      const systemInfo = await getSystemInfo(app.getVersion())
      const embed = createSystemInfoEmbed(systemInfo)

      const url = new URL(webhookUrl)

      const payload = JSON.stringify({
        embeds: [embed]
      })

      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      }

      await new Promise<void>((resolve, reject) => {
        const req = https.request(options, (res) => {
          // Consume the response body to prevent socket hang
          res.resume()
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              logger.info('discord', 'System startup notification sent successfully', {
                statusCode: res.statusCode
              })
              resolve()
            } else {
              reject(new Error(`Discord webhook returned status ${res.statusCode}`))
            }
          })
        })

        req.on('error', (error) => {
          reject(error)
        })

        req.write(payload)
        req.end()
      })
    } catch (error) {
      logger.warn('discord', 'Failed to send system startup notification', error)
    }
  }
}

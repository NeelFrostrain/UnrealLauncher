// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { config } from 'dotenv'
import { app, protocol, net } from 'electron'
import { spawn } from 'child_process'
import type { ChildProcess } from 'child_process'
import path from 'path'
import fs from 'fs'
import { setupAppLifecycle, createWindow, getMainWindow } from './window'
import { setupAutoUpdaterEvents, checkForUpdatesOnStartup } from './updater'
import { registerIpcHandlers, cleanupWorkers } from './ipcHandlers'
import { loadMainSettings } from './store'
import { getNative } from './utils/native'
import { setupDiscordRichPresence } from './discordPresence'
import { initializeLogging, logger } from './logger'

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
app.disableHardwareAcceleration()
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=192')
app.commandLine.appendSwitch('disable-http-cache')
app.commandLine.appendSwitch('disable-background-networking')
app.commandLine.appendSwitch('renderer-process-limit', '1')
app.commandLine.appendSwitch('enable-smooth-scrolling')
app.commandLine.appendSwitch('disable-direct-composition')
app.commandLine.appendSwitch(
  'disable-features',
  'OutOfBlinkCors,TranslateUI,AutofillServerCommunication,AutofillEnableAccountWalletStorage,DirectCompositionVideoOverlays'
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

  // ── Second instance → focus existing window ─────────────────────────────────
  app.on('second-instance', () => {
    logger.info('app', 'Second instance requested focus')
    const win = getMainWindow()
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  // ── Main startup sequence ───────────────────────────────────────────────────
  app
    .whenReady()
    .then(() => {
      logger.info('app', 'Electron app ready')
      // 1. Register local-asset:// protocol handler
      protocol.handle('local-asset', (request) => {
        let filePath = decodeURIComponent(new URL(request.url).pathname)
        if (process.platform === 'win32' && filePath.startsWith('/')) filePath = filePath.slice(1)
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
    spawn('reg', ['add', RUN_KEY, '/v', KEY_NAME, '/t', 'REG_SZ', '/d', `"${tracerExe}"`, '/f'], {
      stdio: 'ignore'
    })

    // Check if tracer is already running — async via spawn instead of execSync
    await new Promise<void>((resolve) => {
      const check = spawn(
        'tasklist',
        ['/FI', 'IMAGENAME eq unreal_launcher_tracer.exe', '/NH', '/FO', 'CSV'],
        { stdio: ['ignore', 'pipe', 'ignore'] }
      )
      let output = ''
      check.stdout?.on('data', (d: Buffer) => {
        output += d.toString()
      })
      check.once('close', () => {
        if (!output.toLowerCase().includes('unreal_launcher_tracer.exe')) {
          logger.info('tracer', 'Starting tracer process', { tracerExe })
          spawn(tracerExe, [], { detached: true, stdio: 'ignore' }).unref()
        } else {
          logger.info('tracer', 'Tracer already running')
        }
        resolve()
      })
    })
  }
}

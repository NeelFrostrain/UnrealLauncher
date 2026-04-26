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

// Load .env as the very first thing
config()

// ── Chromium flags — must be set before app is ready ─────────────────────────
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=192')
app.commandLine.appendSwitch('disable-http-cache')
app.commandLine.appendSwitch('disable-background-networking')
app.commandLine.appendSwitch('renderer-process-limit', '1')
app.commandLine.appendSwitch('enable-smooth-scrolling')
app.commandLine.appendSwitch(
  'disable-features',
  'OutOfBlinkCors,TranslateUI,AutofillServerCommunication,AutofillEnableAccountWalletStorage'
)
app.commandLine.appendSwitch('disable-extensions')
app.commandLine.appendSwitch('disable-component-extensions-with-background-pages')
app.commandLine.appendSwitch('disable-default-apps')
app.commandLine.appendSwitch('no-first-run')
app.commandLine.appendSwitch('disable-background-timer-throttling')
app.commandLine.appendSwitch('disable-renderer-backgrounding')

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
  app.quit()
} else {
  // ── Child process registry ──────────────────────────────────────────────────
  const childProcesses: ChildProcess[] = []

  // ── before-quit cleanup ─────────────────────────────────────────────────────
  app.on('before-quit', () => {
    for (const cp of childProcesses) {
      try {
        cp.kill()
      } catch {
        /* already dead */
      }
    }
    childProcesses.length = 0
    cleanupWorkers()
  })

  // ── Second instance → focus existing window ─────────────────────────────────
  app.on('second-instance', () => {
    const win = getMainWindow()
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  // ── Main startup sequence ───────────────────────────────────────────────────
  app.whenReady().then(() => {
    // 1. Register local-asset:// protocol handler
    protocol.handle('local-asset', (request) => {
      let filePath = decodeURIComponent(new URL(request.url).pathname)
      if (process.platform === 'win32' && filePath.startsWith('/')) filePath = filePath.slice(1)
      return net.fetch(`file:///${filePath.replace(/\\/g, '/')}`)
    })

    // 2. Register IPC handlers — synchronous, no I/O
    registerIpcHandlers()

    // 3. Wire up auto-updater events — synchronous, just event listeners
    setupAutoUpdaterEvents(getMainWindow)

    // 4. Create window immediately — splash shows before anything else loads
    createWindow()
    setupAppLifecycle()

    // 5. Warm up native Rust module off the critical path
    setImmediate(() => {
      try {
        getNative()
      } catch {
        /* ignore */
      }
    })

    // 6. Tracer startup — fully async, never blocks main thread
    setImmediate(() => {
      startTracerAsync().catch(() => {})
    })

    // 7. Defer update check until well after the window is visible
    setTimeout(() => {
      checkForUpdatesOnStartup().catch(() => {})
    }, 8000)
  })

  // ── Tracer startup — async, no execSync ────────────────────────────────────
  async function startTracerAsync(): Promise<void> {
    if (process.platform !== 'win32') return

    const tracerExe = path.join(app.getAppPath(), 'resources', 'unreal_launcher_tracer.exe')
    if (!fs.existsSync(tracerExe)) return

    let tracerStartupEnabled = false
    try {
      tracerStartupEnabled = loadMainSettings().tracerStartupEnabled
    } catch {
      return
    }

    const RUN_KEY = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
    const KEY_NAME = 'Unreal Launcher Tracer'

    if (!tracerStartupEnabled) {
      spawn('reg', ['delete', RUN_KEY, '/v', KEY_NAME, '/f'], { stdio: 'ignore' })
      return
    }

    // Update registry key asynchronously
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
          spawn(tracerExe, [], { detached: true, stdio: 'ignore' }).unref()
        }
        resolve()
      })
    })
  }
}

// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { app, protocol, net } from 'electron'
import { execSync, spawn } from 'child_process'
import type { ChildProcess } from 'child_process'
import path from 'path'
import fs from 'fs'
import { setupAppLifecycle, getMainWindow } from './window'
import { setupAutoUpdaterEvents } from './updater'
import { registerIpcHandlers, cleanupWorkers } from './ipcHandlers'
import { loadMainSettings } from './store'

// ── Chromium memory optimizations ─────────────────────────────────────────────
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=192') // tighter V8 heap cap
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

// ── Child process registry ────────────────────────────────────────────────────
// Any spawned child processes that need cleanup on quit are stored here.
const childProcesses: ChildProcess[] = []
export function trackChildProcess(cp: ChildProcess): void {
  childProcesses.push(cp)
  cp.once('exit', () => {
    const i = childProcesses.indexOf(cp)
    if (i !== -1) childProcesses.splice(i, 1)
  })
}

// ── Custom protocol: local-asset:// ──────────────────────────────────────────
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'local-asset',
    privileges: {
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
      stream: true
    }
  }
])

// ── Single instance lock ──────────────────────────────────────────────────────
// If a second instance launches, quit it immediately and focus the first.
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  // This IS the second instance — quit right away, no window created
  app.quit()
} else {
  // Primary instance — focus/restore the window if a second one tried to open
  app.on('second-instance', () => {
    const win = getMainWindow()
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  // ── before-quit: clean up all child processes and workers ─────────────────
  app.on('before-quit', () => {
    // Kill any tracked child processes (e.g. tracer spawned by this instance)
    for (const cp of childProcesses) {
      try {
        cp.kill()
      } catch {
        /* already dead */
      }
    }
    childProcesses.length = 0

    // Terminate any in-flight worker threads
    cleanupWorkers()
  })

  app.whenReady().then(() => {
    // ── local-asset:// protocol handler ──────────────────────────────────────
    protocol.handle('local-asset', (request) => {
      let filePath = decodeURIComponent(new URL(request.url).pathname)
      if (process.platform === 'win32' && filePath.startsWith('/')) {
        filePath = filePath.slice(1)
      }
      return net.fetch(`file:///${filePath.replace(/\\/g, '/')}`)
    })

    // ── Tracer auto-start (Windows only) ─────────────────────────────────────
    // Logic:
    //   1. Read tracerStartupEnabled from settings.json (fast, no registry query)
    //   2. If disabled → do nothing
    //   3. If enabled → check if tracer is already running (tasklist)
    //   4. Only spawn if NOT already running
    //   5. Keep the registry Run key in sync with the setting
    if (process.platform !== 'win32') return

    const tracerExe = path.join(app.getAppPath(), 'resources', 'unreal_launcher_tracer.exe')
    if (!fs.existsSync(tracerExe)) return

    const { tracerStartupEnabled } = loadMainSettings()

    const RUN_KEY = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
    const KEY_NAME = 'Unreal Launcher Tracer'

    if (!tracerStartupEnabled) {
      // Ensure registry key is also removed if setting is off
      try {
        execSync(`reg delete "${RUN_KEY}" /v "${KEY_NAME}" /f 2>nul`, { stdio: 'pipe' })
      } catch {
        /* key didn't exist — fine */
      }
      return
    }

    // Setting is ON — keep registry entry up to date with current exe path
    try {
      execSync(`reg add "${RUN_KEY}" /v "${KEY_NAME}" /t REG_SZ /d "\\"${tracerExe}\\"" /f`, {
        stdio: 'pipe'
      })
    } catch {
      /* ignore registry errors */
    }

    // Check if tracer is already running before spawning
    const alreadyRunning = (() => {
      try {
        return execSync('tasklist /FI "IMAGENAME eq unreal_launcher_tracer.exe" /NH /FO CSV', {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe']
        })
          .toLowerCase()
          .includes('unreal_launcher_tracer.exe')
      } catch {
        return false
      }
    })()

    if (!alreadyRunning) {
      // Tracer is detached + unref'd — it outlives the launcher intentionally.
      // NOT tracked in childProcesses since we don't want to kill it on quit.
      spawn(tracerExe, [], { detached: true, stdio: 'ignore' }).unref()
    }
  })

  setupAutoUpdaterEvents(getMainWindow)
  registerIpcHandlers()
  setupAppLifecycle()
}

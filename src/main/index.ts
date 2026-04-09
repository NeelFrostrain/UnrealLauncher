import { app } from 'electron'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import { setupAppLifecycle, getMainWindow } from './window'
import { setupAutoUpdaterEvents } from './updater'
import { registerIpcHandlers } from './ipcHandlers'

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const win = getMainWindow()
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  // Re-write the tracer startup registry entry on every launch so the path
  // stays correct after updates or if the user moved the install directory.
  // Also auto-start the tracer if it's registered but not currently running.
  app.whenReady().then(() => {
    if (process.platform !== 'win32') return
    const { execSync } = require('child_process')
    const RUN_KEY = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
    const KEY_NAME = 'Unreal Launcher Tracer'
    const tracerExe = app.isPackaged
      ? path.join(process.resourcesPath, 'unreal_launcher_tracer.exe')
      : path.resolve(app.getAppPath(), 'resources', 'unreal_launcher_tracer.exe')

    if (!fs.existsSync(tracerExe)) return

    try {
      // Check if the startup key exists (user has it enabled)
      const regOut = execSync(
        `reg query "${RUN_KEY}" /v "${KEY_NAME}" 2>nul`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
      )
      if (!regOut.includes(KEY_NAME)) return

      // Re-write with current path (handles app updates / moves)
      execSync(
        `reg add "${RUN_KEY}" /v "${KEY_NAME}" /t REG_SZ /d "\\"${tracerExe}\\"" /f`,
        { stdio: 'pipe' }
      )

      // Start the tracer if it's not already running
      const running = execSync(
        'tasklist /FI "IMAGENAME eq unreal_launcher_tracer.exe" /NH /FO CSV',
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
      ).toLowerCase().includes('unreal_launcher_tracer.exe')

      if (!running) {
        spawn(tracerExe, [], { detached: true, stdio: 'ignore' }).unref()
      }
    } catch { /* key doesn't exist — user hasn't enabled it */ }
  })

  setupAutoUpdaterEvents(getMainWindow)
  registerIpcHandlers()
  setupAppLifecycle()
}

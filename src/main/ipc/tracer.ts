// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { ipcMain, app } from 'electron'
import path from 'path'
import fs from 'fs'
import { execSync, spawn } from 'child_process'
import { saveMainSettings, loadMainSettings } from '../store'
import { getTracerDataDir, getTracerBinaryName } from '../utils/platformPaths'
import { isProcessRunning, killProcess } from '../utils/processUtils'

export function registerTracerHandlers(ipcMain_: typeof ipcMain): void {
  // In production: resources/ sits inside app and dev uses the project root.
  const tracerBinaryName = getTracerBinaryName()
  const tracerExe = path.join(app.getAppPath(), 'resources', tracerBinaryName)

  const RUN_KEY = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
  const TRACER_KEY_NAME = 'Unreal Launcher Tracer'

  ipcMain_.handle('tracer-get-startup', (): boolean => {
    if (process.platform === 'win32') {
      try {
        const out = execSync(`reg query "${RUN_KEY}" /v "${TRACER_KEY_NAME}" 2>nul`, {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe']
        })
        return out.includes(TRACER_KEY_NAME)
      } catch {
        return false
      }
    } else if (process.platform === 'linux') {
      // Check saved setting — more reliable than querying systemd
      // (systemd user session may not be available on all distros)
      return loadMainSettings().tracerStartupEnabled ?? false
    } else {
      return false
    }
  })

  ipcMain_.handle('tracer-set-startup', async (_event, enabled: boolean): Promise<void> => {
    saveMainSettings({ tracerStartupEnabled: enabled })

    if (process.platform === 'win32') {
      try {
        if (enabled) {
          if (!fs.existsSync(tracerExe)) return

          execSync(
            `reg add "${RUN_KEY}" /v "${TRACER_KEY_NAME}" /t REG_SZ /d "\\"${tracerExe}\\"" /f`,
            { stdio: 'pipe' }
          )

          if (!isProcessRunning(tracerBinaryName)) {
            spawn(tracerExe, [], { detached: true, stdio: 'ignore' }).unref()
          }
        } else {
          try {
            execSync(`reg delete "${RUN_KEY}" /v "${TRACER_KEY_NAME}" /f`, { stdio: 'pipe' })
          } catch {
            /* key didn't exist */
          }

          killProcess(tracerBinaryName)
        }
      } catch {
        /* ignore */
      }
    } else if (process.platform === 'linux') {
      if (enabled) {
        if (!fs.existsSync(tracerExe)) return

        // Create systemd user service for startup (best-effort — not all distros have systemd user sessions)
        try {
          const systemdDir = path.join(require('os').homedir(), '.config', 'systemd', 'user')
          await fs.promises.mkdir(systemdDir, { recursive: true })

          const serviceContent = `[Unit]
Description=Unreal Launcher Tracer
After=network.target

[Service]
ExecStart=${tracerExe}
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
`
          const servicePath = path.join(systemdDir, 'unreal-launcher-tracer.service')
          await fs.promises.writeFile(servicePath, serviceContent)
          execSync('systemctl --user daemon-reload', { stdio: 'ignore' })
          execSync('systemctl --user enable unreal-launcher-tracer.service', { stdio: 'ignore' })
        } catch {
          /* systemd user session not available — startup-on-boot won't work but manual start still will */
        }

        // Start the tracer process directly if not already running
        if (!isProcessRunning(tracerBinaryName)) {
          spawn(tracerExe, [], { detached: true, stdio: 'ignore' }).unref()
        }
      } else {
        // Stop systemd service if it exists (best-effort)
        try {
          execSync('systemctl --user stop unreal-launcher-tracer.service', { stdio: 'ignore' })
          execSync('systemctl --user disable unreal-launcher-tracer.service', { stdio: 'ignore' })
        } catch {
          /* service may not exist — that's fine */
        }

        // Always kill the process directly — this works whether it was started
        // via systemd, via spawn in index.ts, or manually
        killProcess(tracerBinaryName)
      }
    } else {
      // macOS - could implement launchd here
      console.warn('Startup configuration not implemented for macOS')
    }
  })

  ipcMain_.handle('tracer-is-running', (): boolean => {
    return isProcessRunning(tracerBinaryName)
  })

  ipcMain_.handle('tracer-get-data-dir', (): string => {
    return getTracerDataDir()
  })

  ipcMain_.handle('tracer-get-merge', (): boolean => {
    return loadMainSettings().tracerMergeEnabled
  })

  ipcMain_.handle('tracer-set-merge', (_event, enabled: boolean): void => {
    saveMainSettings({ tracerMergeEnabled: enabled })
  })

  ipcMain_.handle('engines-get-registry', (): boolean => {
    return loadMainSettings().registryEnginesEnabled
  })

  ipcMain_.handle('engines-set-registry', (_event, enabled: boolean): void => {
    saveMainSettings({ registryEnginesEnabled: enabled })
  })
}

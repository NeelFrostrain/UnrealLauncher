import { ipcMain, app } from 'electron'
import path from 'path'
import fs from 'fs'
import { execSync, spawn } from 'child_process'
import { saveMainSettings, loadMainSettings } from '../store'

export function registerTracerHandlers(ipcMain_: typeof ipcMain): void {
  // In production: resources/ sits inside app and dev uses the project root.
  const tracerExe = path.join(app.getAppPath(), 'resources', 'unreal_launcher_tracer.exe')

  const RUN_KEY = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
  const TRACER_KEY_NAME = 'Unreal Launcher Tracer'

  ipcMain_.handle('tracer-get-startup', (): boolean => {
    if (process.platform !== 'win32') return false
    try {
      const out = execSync(`reg query "${RUN_KEY}" /v "${TRACER_KEY_NAME}" 2>nul`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      })
      return out.includes(TRACER_KEY_NAME)
    } catch {
      return false
    }
  })

  ipcMain_.handle('tracer-set-startup', async (_event, enabled: boolean): Promise<void> => {
    if (process.platform !== 'win32') return

    saveMainSettings({ tracerStartupEnabled: enabled })

    try {
      if (enabled) {
        if (!fs.existsSync(tracerExe)) return

        execSync(
          `reg add "${RUN_KEY}" /v "${TRACER_KEY_NAME}" /t REG_SZ /d "\\"${tracerExe}\\"" /f`,
          { stdio: 'pipe' }
        )

        const running = execSync(
          'tasklist /FI "IMAGENAME eq unreal_launcher_tracer.exe" /NH /FO CSV',
          { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
        )
          .toLowerCase()
          .includes('unreal_launcher_tracer.exe')

        if (!running) {
          spawn(tracerExe, [], { detached: true, stdio: 'ignore' }).unref()
        }
      } else {
        try {
          execSync(`reg delete "${RUN_KEY}" /v "${TRACER_KEY_NAME}" /f`, { stdio: 'pipe' })
        } catch {
          /* key didn't exist */
        }

        try {
          execSync('taskkill /F /IM unreal_launcher_tracer.exe', { stdio: 'pipe' })
        } catch {
          /* not running — fine */
        }
      }
    } catch {
      /* ignore */
    }
  })

  ipcMain_.handle('tracer-is-running', (): boolean => {
    try {
      const out = execSync('tasklist /FI "IMAGENAME eq unreal_launcher_tracer.exe" /NH /FO CSV', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      })
      return out.toLowerCase().includes('unreal_launcher_tracer.exe')
    } catch {
      return false
    }
  })

  ipcMain_.handle('tracer-get-data-dir', (): string => {
    const appdata = process.env.APPDATA || ''
    return path.join(appdata, 'Unreal Launcher', 'Tracer')
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

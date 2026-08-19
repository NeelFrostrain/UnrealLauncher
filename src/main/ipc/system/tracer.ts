// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { ipcMain, app } from 'electron'
import path from 'path'
import fs from 'fs'
import { execFile, spawn } from 'child_process'
import { promisify } from 'util'
import { saveMainSettings, loadMainSettings } from '../../store'

const execFileAsync = promisify(execFile)
import { getTracerDataDir, getTracerBinaryName, isProcessRunning } from '../../utils'
import { logger } from '../../logger'
export function registerTracerHandlers(ipcMain_: typeof ipcMain): void {
  // In production: resources/ sits inside app and dev uses the project root.
  const tracerBinaryName = getTracerBinaryName()
  const tracerExe = path.join(app.getAppPath(), 'resources', tracerBinaryName)

  const RUN_KEY = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
  const TRACER_KEY_NAME = 'Unreal Launcher Tracer'

  ipcMain_.handle('tracer-get-startup', async (): Promise<boolean> => {
    if (process.platform !== 'win32') return false

    // Try Rust native registry query
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getNative } = require('../../utils/native')
      const native = getNative()
      if (native?.getWindowsStartupRegistryNative) {
        return native.getWindowsStartupRegistryNative(TRACER_KEY_NAME)
      }
    } catch {
      /* fallback */
    }

    try {
      const { stdout } = await execFileAsync('reg', ['query', RUN_KEY, '/v', TRACER_KEY_NAME], {
        encoding: 'utf8',
        timeout: 3000,
        windowsHide: true
      })
      return stdout.includes(TRACER_KEY_NAME)
    } catch {
      return false
    }
  })

  ipcMain_.handle('tracer-set-startup', async (_event, enabled: boolean): Promise<void> => {
    logger.info('tracer', 'Tracer startup setting changed', { enabled })
    saveMainSettings({ tracerStartupEnabled: enabled })

    // Tracer only supported on Windows
    if (process.platform !== 'win32') return

    try {
      if (enabled) {
        if (!fs.existsSync(tracerExe)) {
          logger.warn('tracer', 'Tracer executable missing while enabling startup', { tracerExe })
          return
        }

        let regOk = false
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { getNative } = require('../../utils/native')
          const native = getNative()
          if (native?.setWindowsStartupRegistryNative) {
            regOk = native.setWindowsStartupRegistryNative(TRACER_KEY_NAME, tracerExe, true)
          }
        } catch {
          /* fallback */
        }

        if (!regOk) {
          await execFileAsync(
            'reg',
            ['add', RUN_KEY, '/v', TRACER_KEY_NAME, '/t', 'REG_SZ', '/d', `"${tracerExe}"`, '/f'],
            { timeout: 5000, windowsHide: true, shell: false }
          )
        }

        // Small delay to prevent rapid command execution
        await new Promise((resolve) => setTimeout(resolve, 100))

        // Start the tracer now if it isn't already running
        const isRunning = await isProcessRunning(tracerBinaryName)
        if (!isRunning) {
          logger.info('tracer', 'Starting tracer from settings', { tracerExe })
          try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { getNative } = require('../../utils/native')
            const native = getNative()
            if (native?.spawnDetachedHiddenProcessNative) {
              native.spawnDetachedHiddenProcessNative(tracerExe, [])
              return
            }
          } catch {
            /* fallback */
          }
          spawn(tracerExe, [], {
            detached: true,
            stdio: 'ignore',
            windowsHide: true,
            shell: false
          }).unref()
        }
      } else {
        // Remove from startup registry — but do NOT kill the running tracer.
        // The tracer owns the Ctrl+K hotkey pipe; killing it breaks the hotkey.
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { getNative } = require('../../utils/native')
          const native = getNative()
          if (native?.setWindowsStartupRegistryNative) {
            native.setWindowsStartupRegistryNative(TRACER_KEY_NAME, '', false)
            return
          }
        } catch {
          /* fallback */
        }

        try {
          await execFileAsync('reg', ['delete', RUN_KEY, '/v', TRACER_KEY_NAME, '/f'], {
            timeout: 5000,
            windowsHide: true,
            shell: false
          })
        } catch {
          /* key didn't exist */
        }
      }
    } catch (error) {
      logger.error('tracer', 'Failed to update tracer startup setting', { enabled, error })
    }
  })

  ipcMain_.handle('tracer-is-running', async (): Promise<boolean> => {
    // Tracer only supported on Windows
    if (process.platform !== 'win32') return false
    return await isProcessRunning(tracerBinaryName)
  })

  ipcMain_.handle('tracer-get-data-dir', (): string => {
    return getTracerDataDir()
  })

  ipcMain_.handle('tracer-get-merge', (): boolean => {
    return loadMainSettings().tracerMergeEnabled
  })

  ipcMain_.handle('tracer-set-merge', (_event, enabled: boolean): void => {
    logger.info('tracer', 'Tracer merge setting changed', { enabled })
    saveMainSettings({ tracerMergeEnabled: enabled })
  })

  ipcMain_.handle('engines-get-registry', (): boolean => {
    return loadMainSettings().registryEnginesEnabled
  })

  ipcMain_.handle('engines-set-registry', (_event, enabled: boolean): void => {
    logger.info('engine', 'Registry engines setting changed', { enabled })
    saveMainSettings({ registryEnginesEnabled: enabled })
  })
}

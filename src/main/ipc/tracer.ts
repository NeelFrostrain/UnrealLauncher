// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { ipcMain, app } from 'electron'
import path from 'path'
import fs from 'fs'
import { execFile, spawn } from 'child_process'
import { promisify } from 'util'
import { saveMainSettings, loadMainSettings } from '../store'

const execFileAsync = promisify(execFile)
import { getTracerDataDir, getTracerBinaryName } from '../utils/platformPaths'
import { isProcessRunning, killProcess } from '../utils/processUtils'
import { logger } from '../logger'
export function registerTracerHandlers(ipcMain_: typeof ipcMain): void {
  // In production: resources/ sits inside app and dev uses the project root.
  const tracerBinaryName = getTracerBinaryName()
  const tracerExe = path.join(app.getAppPath(), 'resources', tracerBinaryName)

  const RUN_KEY = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
  const TRACER_KEY_NAME = 'Unreal Launcher Tracer'

  ipcMain_.handle('tracer-get-startup', async (): Promise<boolean> => {
    if (process.platform !== 'win32') return false
    try {
      const { stdout } = await execFileAsync('reg', ['query', RUN_KEY, '/v', TRACER_KEY_NAME], {
        encoding: 'utf8',
        timeout: 3000
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

        await execFileAsync(
          'reg',
          ['add', RUN_KEY, '/v', TRACER_KEY_NAME, '/t', 'REG_SZ', '/d', `"${tracerExe}"`, '/f'],
          { timeout: 5000 }
        )

        // Use async process check to avoid blocking main thread
        const isRunning = await isProcessRunning(tracerBinaryName)
        if (!isRunning) {
          logger.info('tracer', 'Starting tracer from settings', { tracerExe })
          spawn(tracerExe, [], { detached: true, stdio: 'ignore' }).unref()
        }
      } else {
        try {
          await execFileAsync('reg', ['delete', RUN_KEY, '/v', TRACER_KEY_NAME, '/f'], {
            timeout: 5000
          })
        } catch {
          /* key didn't exist */
        }

        // Use async process kill to avoid blocking main thread
        await killProcess(tracerBinaryName)
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

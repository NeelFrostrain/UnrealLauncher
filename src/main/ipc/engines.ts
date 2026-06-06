// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { ipcMain, BrowserWindow } from 'electron'
import { isRegisteredEnginePath } from '../utils/pathSanitization'
import {
  handleSelectEngineFolder,
  handleLaunchEngine,
  handleLaunchEngineWithConfig,
  handleDeleteEngine,
  calculateEngineSize,
  scanAndMergeEngines,
  scanEnginePlugins,
  handleUpdateEngineAlias
} from './engineHandlers'
import type { LaunchConfig } from '../utils/launchConfigArgs'

/**
 * Registers all engine-related IPC handlers
 */
export function registerEngineHandlers(ipcMain_: typeof ipcMain): void {
  ipcMain_.handle('scan-engines', scanAndMergeEngines)

  ipcMain_.handle('select-engine-folder', handleSelectEngineFolder)

  ipcMain_.handle('launch-engine', async (_event, exePath) => handleLaunchEngine(exePath))

  ipcMain_.handle(
    'launch-engine-with-config',
    async (_event, exePath: string, config: LaunchConfig) =>
      handleLaunchEngineWithConfig(exePath, config)
  )

  ipcMain_.handle('delete-engine', (_event, directoryPath) => handleDeleteEngine(directoryPath))

  ipcMain_.handle('calculate-engine-size', async (event, directoryPath) => {
    const validatedPath = isRegisteredEnginePath(directoryPath)
    if (!validatedPath) {
      return { success: false, error: 'Engine path is not registered' }
    }
    const result = await calculateEngineSize(validatedPath)
    if (result.success && result.size) {
      const win = BrowserWindow.fromWebContents(event.sender)
      win?.webContents.send('size-calculated', {
        type: 'engine',
        path: validatedPath,
        size: result.size
      })
    }
    return result
  })

  ipcMain_.handle('scan-engine-plugins', (_event, engineDir: string) => {
    // SECURITY: Validate path is a registered engine
    const validatedPath = isRegisteredEnginePath(engineDir)
    if (!validatedPath) {
      return []
    }
    return scanEnginePlugins(validatedPath)
  })

  ipcMain_.handle('update-engine-alias', (_event, directoryPath: string, alias: string) =>
    handleUpdateEngineAlias(directoryPath, alias)
  )
}

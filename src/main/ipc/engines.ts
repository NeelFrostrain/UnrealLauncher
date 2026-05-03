// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { ipcMain } from 'electron'
import {
  handleSelectEngineFolder,
  handleLaunchEngine,
  handleDeleteEngine,
  calculateEngineSize,
  scanAndMergeEngines,
  loadSavedEngines,
  scanEnginePlugins
} from './engineHandlers'

/**
 * Registers all engine-related IPC handlers
 */
export function registerEngineHandlers(ipcMain_: typeof ipcMain): void {
  ipcMain_.handle('scan-engines', scanAndMergeEngines)

  ipcMain_.handle('select-engine-folder', handleSelectEngineFolder)

  ipcMain_.handle('launch-engine', async (_event, exePath) => handleLaunchEngine(exePath))

  ipcMain_.handle('delete-engine', (_event, directoryPath) => handleDeleteEngine(directoryPath))

  ipcMain_.handle('calculate-engine-size', async (_event, directoryPath) =>
    calculateEngineSize(directoryPath)
  )

  ipcMain_.handle('scan-engine-plugins', (_event, engineDir: string) =>
    scanEnginePlugins(engineDir)
  )
}

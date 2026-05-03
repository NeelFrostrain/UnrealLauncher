// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { ipcMain } from 'electron'
import { openFileOrDirectory } from '../utils/processUtils'
import {
  handleSelectProjectFolder,
  handleLaunchProject,
  handleLaunchProjectGame,
  calculateProjectSize,
  calculateAllProjectSizes,
  scanAndMergeProjects,
  loadSavedProjects,
  deleteProject
} from './projectHandlers'

/**
 * Registers all project-related IPC handlers
 */
export function registerProjectHandlers(ipcMain_: typeof ipcMain): void {
  ipcMain_.handle('scan-projects', scanAndMergeProjects)

  ipcMain_.handle('load-saved-projects', loadSavedProjects)

  ipcMain_.handle('select-project-folder', handleSelectProjectFolder)

  ipcMain_.handle('launch-project', async (_event, projectPath) =>
    handleLaunchProject(projectPath)
  )

  ipcMain_.handle('launch-project-game', async (_event, projectPath) =>
    handleLaunchProjectGame(projectPath)
  )

  ipcMain_.handle('open-directory', (_event, dirPath): void => {
    openFileOrDirectory(dirPath)
  })

  ipcMain_.handle('delete-project', (_event, projectPath) => deleteProject(projectPath))

  ipcMain_.handle('calculate-project-size', async (_event, projectPath) =>
    calculateProjectSize(projectPath)
  )

  ipcMain_.handle('calculate-all-project-sizes', calculateAllProjectSizes)
}

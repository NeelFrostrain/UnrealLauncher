// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { ipcMain } from 'electron'
import { openFileOrDirectory } from '../utils/processUtils'
import { validatePathForGitRead } from '../utils/pathSanitization'
import {
  handleSelectProjectFolder,
  handleLaunchProject,
  handleLaunchProjectGame,
  handleLaunchProjectWithConfig,
  calculateProjectSize,
  calculateAllProjectSizes,
  scanAndMergeProjects,
  loadSavedProjects,
  deleteProject
} from './projectHandlers'
import type { LaunchConfig } from '../utils/launchConfigArgs'

/**
 * Registers all project-related IPC handlers
 */
export function registerProjectHandlers(ipcMain_: typeof ipcMain): void {
  ipcMain_.handle('scan-projects', scanAndMergeProjects)

  ipcMain_.handle('load-saved-projects', loadSavedProjects)

  ipcMain_.handle('select-project-folder', handleSelectProjectFolder)

  ipcMain_.handle('launch-project', async (_event, projectPath) => handleLaunchProject(projectPath))

  ipcMain_.handle('launch-project-game', async (_event, projectPath) =>
    handleLaunchProjectGame(projectPath)
  )

  ipcMain_.handle(
    'launch-project-with-config',
    async (_event, projectPath: string, config: LaunchConfig) =>
      handleLaunchProjectWithConfig(projectPath, config)
  )

  ipcMain_.handle('open-directory', (_event, dirPath): void => {
    // SECURITY: Validate path is a valid existing directory
    const validatedPath = validatePathForGitRead(dirPath)
    if (validatedPath) {
      openFileOrDirectory(validatedPath)
    }
  })

  ipcMain_.handle('delete-project', (_event, projectPath) => deleteProject(projectPath))

  ipcMain_.handle('calculate-project-size', async (_event, projectPath) => {
    // SECURITY: Validate path is a valid existing directory
    const validatedPath = validatePathForGitRead(projectPath)
    if (!validatedPath) {
      return { error: 'Project path not found' }
    }
    return calculateProjectSize(validatedPath)
  })

  ipcMain_.handle('calculate-all-project-sizes', calculateAllProjectSizes)
}

// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { ipcMain } from 'electron'
import { openFileOrDirectory } from '../utils/processUtils'
import { isRegisteredProjectPath, resolveOpenableDirectory } from '../utils/pathSanitization'
import {
  handleSelectProjectFolder,
  handleLaunchProject,
  handleLaunchProjectGame,
  handleLaunchProjectWithConfig,
  calculateProjectSize,
  calculateAllProjectSizes,
  scanAndMergeProjects,
  loadSavedProjects,
  deleteProject,
  checkProjectHealth
} from './projectHandlers'
import type { LaunchConfig } from '../utils/launchConfigArgs'
import { registerProjectAssetHandlers } from './projectAssets'
import { registerProjectSnapshotHandlers } from './projectSnapshots'

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

  ipcMain_.handle('open-directory', (_event, dirPath): { success: boolean; error?: string } => {
    const validatedPath = resolveOpenableDirectory(dirPath)
    if (!validatedPath) {
      return { success: false, error: 'Directory path not allowed or does not exist' }
    }
    openFileOrDirectory(validatedPath)
    return { success: true }
  })

  ipcMain_.handle('delete-project', (_event, projectPath) => deleteProject(projectPath))

  ipcMain_.handle('calculate-project-size', async (_event, projectPath) => {
    // SECURITY: Validate path is a valid existing directory
    const validatedPath = isRegisteredProjectPath(projectPath)
    if (!validatedPath) {
      return { error: 'Project path not found' }
    }
    return calculateProjectSize(validatedPath)
  })

  ipcMain_.handle('calculate-all-project-sizes', calculateAllProjectSizes)

  ipcMain_.handle('project-check-health', async (_event, projectPath: string) => {
    // SECURITY: Validate path is a valid existing project directory
    const validatedPath = isRegisteredProjectPath(projectPath)
    if (!validatedPath) {
      return { error: 'Project path not found' }
    }
    return checkProjectHealth(validatedPath)
  })

  registerProjectAssetHandlers(ipcMain_)
  registerProjectSnapshotHandlers(ipcMain_)
}

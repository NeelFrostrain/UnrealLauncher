// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { dialog } from 'electron'
import {
  clearAppData,
  clearTracerData,
  loadMainSettings,
  saveMainSettings,
  loadEngineScanPaths,
  saveEngineScanPaths,
  loadProjectScanPaths,
  saveProjectScanPaths
} from '../store'
import { getMainWindow } from '../window'
import { getNative } from '../utils/native'
import { openFileOrDirectory } from '../utils/processUtils'
import { clearLogFiles, getLogsDir, logger } from '../logger'

/**
 * Handles the get-native-status IPC event
 */
export function handleGetNativeStatus(): boolean {
  return getNative() !== null
}

/**
 * Handles the clear-app-data IPC event
 */
export function handleClearAppData(): void {
  logger.warn('data', 'Clearing app data')
  clearAppData()
}

/**
 * Handles the clear-tracer-data IPC event
 */
export function handleClearTracerData(): void {
  logger.warn('data', 'Clearing tracer data')
  clearTracerData()
}

/**
 * Handles the get-main-settings IPC event
 */
export function handleGetMainSettings(): Record<string, unknown> {
  return loadMainSettings()
}

/**
 * Handles the save-main-settings IPC event
 */
export function handleSaveMainSettings(settings: Record<string, unknown>): void {
  const settingKeys =
    typeof settings === 'object' && settings !== null
      ? Object.keys(settings)
      : []
  logger.info('settings', 'Saving main settings', { keys: settingKeys })
  saveMainSettings(settings)
}

/**
 * Handles the get-running-projects IPC event
 */
export function handleGetRunningProjects(): string[] {
  const native = getNative()
  return native?.findRunningUnrealProjects?.() ?? []
}

/**
 * Handles the select-folder IPC event
 */
export async function handleSelectFolder(): Promise<string[] | null> {
  const win = getMainWindow()
  if (!win) return null

  logger.info('dialog', 'Select folder dialog opened')
  const result = await dialog.showOpenDialog(win, {
    title: 'Select Folder',
    properties: ['openDirectory']
  })

  if (result.canceled) {
    logger.info('dialog', 'Select folder dialog canceled')
    return null
  }
  logger.info('dialog', 'Select folder dialog completed', {
    count: result.filePaths.length,
    firstPath: result.filePaths[0]
  })
  return result.filePaths
}

/**
 * Handles the get-engine-scan-paths IPC event
 */
export function handleGetEngineScanPaths(): string[] {
  return loadEngineScanPaths()
}

/**
 * Handles the save-engine-scan-paths IPC event
 */
export function handleSaveEngineScanPaths(paths: string[]): void {
  logger.info('settings', 'Saving engine scan paths', { count: paths.length })
  saveEngineScanPaths(paths)
}

/**
 * Handles the get-project-scan-paths IPC event
 */
export function handleGetProjectScanPaths(): string[] {
  return loadProjectScanPaths()
}

/**
 * Handles the save-project-scan-paths IPC event
 */
export function handleSaveProjectScanPaths(paths: string[]): void {
  logger.info('settings', 'Saving project scan paths', { count: paths.length })
  saveProjectScanPaths(paths)
}

export function handleOpenLogsFolder(): void {
  const logsDir = getLogsDir()
  logger.info('logs', 'Opening logs folder', { logsDir })
  openFileOrDirectory(logsDir)
}

export function handleClearLogs(): { success: boolean; removed: number } {
  const removed = clearLogFiles()
  logger.warn('logs', 'Cleared log files', { removed })
  return { success: true, removed }
}

export function handleRendererActivity(event: Record<string, unknown>): void {
  logger.info('ui', event?.action || 'Renderer activity', event || {})
}

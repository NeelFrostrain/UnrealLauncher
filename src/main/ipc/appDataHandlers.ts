// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
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
  clearAppData()
}

/**
 * Handles the clear-tracer-data IPC event
 */
export function handleClearTracerData(): void {
  clearTracerData()
}

/**
 * Handles the get-main-settings IPC event
 */
export function handleGetMainSettings(): any {
  return loadMainSettings()
}

/**
 * Handles the save-main-settings IPC event
 */
export function handleSaveMainSettings(settings: any): void {
  saveMainSettings(settings)
}

/**
 * Handles the select-folder IPC event
 */
export async function handleSelectFolder(): Promise<string[] | null> {
  const win = getMainWindow()
  if (!win) return null

  const result = await dialog.showOpenDialog(win, {
    title: 'Select Folder',
    properties: ['openDirectory']
  })

  return result.canceled ? null : result.filePaths
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
  saveProjectScanPaths(paths)
}

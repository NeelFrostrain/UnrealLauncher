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
} from '../../store'
import { getMainWindow } from '../../window'
import { getNative, openFileOrDirectory } from '../../utils'
import { clearLogFiles, getLogsDir, logger } from '../../logger'
import { enableDiscordRichPresence, disableDiscordRichPresence } from '../../discordPresence'

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
  return loadMainSettings() as unknown as Record<string, unknown>
}

/**
 * Handles the save-main-settings IPC event
 */
export function handleSaveMainSettings(settings: Record<string, unknown>): void {
  const settingKeys = typeof settings === 'object' && settings !== null ? Object.keys(settings) : []
  logger.info('settings', 'Saving main settings', { keys: settingKeys })
  saveMainSettings(settings)

  if (settings.discordRpcEnabled !== undefined) {
    if (settings.discordRpcEnabled) {
      enableDiscordRichPresence({
        clientId:
          process.env.DISCORD_CLIENT_ID ||
          process.env.VITE_DISCORD_CLIENT_ID ||
          '1507980570725191740',
        buttons: [
          {
            label: 'Join Discord',
            url: `${process.env.VITE_DISCORD_INVITE_URL || 'https://discord.gg/vq4UDfevG2'}`
          },
          {
            label: 'Download Launcher',
            url: `${process.env.VITE_COMPANY_WEBSITE_URL || process.env.VITE_WEBSITE_URL || 'https://cyronicstudio.vercel.app'}`
          }
        ]
      })
    } else {
      disableDiscordRichPresence()
    }
  }
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
 * Handles the select-file IPC event
 */
export async function handleSelectFile(
  filters?: Array<{ name: string; extensions: string[] }>
): Promise<string | null> {
  const win = getMainWindow()
  if (!win) return null

  logger.info('dialog', 'Select file dialog opened')
  const result = await dialog.showOpenDialog(win, {
    title: 'Select File',
    properties: ['openFile'],
    filters: filters || [{ name: 'Executable Files', extensions: ['exe'] }]
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }
  return result.filePaths[0]
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

export function handleGetAppStorageUsage(): {
  totalBytes: number
  logsBytes: number
  thumbnailsBytes: number
  snapshotsBytes: number
  storeBytes: number
  logCount: number
  thumbnailCount: number
} {
  const native = getNative()
  if (native?.calculateAppStorageUsageNative) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { app } = require('electron')
      return native.calculateAppStorageUsageNative(app.getPath('userData'))
    } catch {
      /* fallback */
    }
  }

  return {
    totalBytes: 0,
    logsBytes: 0,
    thumbnailsBytes: 0,
    snapshotsBytes: 0,
    storeBytes: 0,
    logCount: 0,
    thumbnailCount: 0
  }
}

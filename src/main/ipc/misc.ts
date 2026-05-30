// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { ipcMain } from 'electron'
import { registerWindowHandlers } from './windowHandlers'
import { handleOpenExternal } from './externalLinks'
import { sendDiscordWebhook } from './discordWebhook'
import {
  handleGetNativeStatus,
  handleClearAppData,
  handleClearTracerData,
  handleGetMainSettings,
  handleSaveMainSettings,
  handleGetRunningProjects,
  handleSelectFolder,
  handleGetEngineScanPaths,
  handleSaveEngineScanPaths,
  handleGetProjectScanPaths,
  handleSaveProjectScanPaths,
  handleOpenLogsFolder,
  handleClearLogs,
  handleRendererActivity
} from './appDataHandlers'

/**
 * Registers all miscellaneous IPC handlers
 */
export function registerMiscHandlers(ipcMain_: typeof ipcMain): void {
  // Window handlers
  registerWindowHandlers(ipcMain_)

  // External links
  ipcMain_.handle('open-external', async (_event, url) => handleOpenExternal(url))

  // Discord webhook
  ipcMain_.handle(
    'send-discord-webhook',
    async (_event, _webhookUrl: string, payloadJson: string) => sendDiscordWebhook(payloadJson)
  )

  // App data
  ipcMain_.handle('get-native-status', handleGetNativeStatus)
  ipcMain_.handle('clear-app-data', handleClearAppData)
  ipcMain_.handle('clear-tracer-data', handleClearTracerData)
  ipcMain_.handle('open-logs-folder', handleOpenLogsFolder)
  ipcMain_.handle('clear-logs', handleClearLogs)
  ipcMain_.handle('log-activity', (_event, activity) => handleRendererActivity(activity))
  ipcMain_.handle('get-main-settings', handleGetMainSettings)
  ipcMain_.handle('save-main-settings', (_event, settings) => handleSaveMainSettings(settings))
  ipcMain_.handle('get-running-projects', handleGetRunningProjects)
  ipcMain_.handle('select-folder', handleSelectFolder)

  // Scan paths
  ipcMain_.handle('get-engine-scan-paths', handleGetEngineScanPaths)
  ipcMain_.handle('save-engine-scan-paths', (_event, paths) => handleSaveEngineScanPaths(paths))
  ipcMain_.handle('get-project-scan-paths', handleGetProjectScanPaths)
  ipcMain_.handle('save-project-scan-paths', (_event, paths) => handleSaveProjectScanPaths(paths))
}

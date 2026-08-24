// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { ipcMain, app } from 'electron'
import { handleCheckForUpdates, handleCheckGithubVersion, autoUpdater } from '../../updater'
import { logger } from '../../logger'

export function registerUpdateHandlers(ipcMain_: typeof ipcMain): void {
  ipcMain_.handle('check-for-updates', async () => {
    logger.info('updater', 'Checking for application updates')
    return handleCheckForUpdates()
  })

  ipcMain_.handle('download-update', async () => {
    logger.info('updater', 'Downloading update payload')
    try {
      await autoUpdater.downloadUpdate()
      logger.info('updater', 'Update downloaded successfully')
      return { success: true }
    } catch (err) {
      logger.error('updater', 'Update download failed', { error: err })
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  })

  ipcMain_.handle('install-update', () => {
    logger.info('updater', 'Quitting and installing update')
    return autoUpdater.quitAndInstall()
  })

  ipcMain_.handle('get-app-version', () => {
    const v = app.getVersion()
    logger.debug('updater', 'Application version queried', { version: v })
    return v
  })

  ipcMain_.handle('check-github-version', () => {
    logger.info('updater', 'Checking latest version from GitHub releases')
    return handleCheckGithubVersion(app.getVersion())
  })
}

import { ipcMain, app } from 'electron'
import { handleCheckForUpdates, handleCheckGithubVersion, autoUpdater } from '../updater'

export function registerUpdateHandlers(ipcMain_: typeof ipcMain): void {
  ipcMain_.handle('check-for-updates', handleCheckForUpdates)

  ipcMain_.handle('download-update', async () => {
    try {
      await autoUpdater.downloadUpdate()
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  })

  ipcMain_.handle('install-update', () => autoUpdater.quitAndInstall())

  ipcMain_.handle('get-app-version', () => app.getVersion())

  ipcMain_.handle('check-github-version', () => handleCheckGithubVersion(app.getVersion()))
}

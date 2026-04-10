import { ipcMain, dialog, app } from 'electron'
import path from 'path'
import fs from 'fs'
import { getMainWindow } from '../window'
import { getDefaultFabPaths, findFirstExisting, scanFabFolder } from './fabScanner'
import type { FabAsset } from './fabScanner'

export type { FabAsset }

export function registerFabHandlers(ipcMain_: typeof ipcMain): void {
  ipcMain_.handle('fab-get-default-path', (): string => {
    return findFirstExisting(getDefaultFabPaths()) ?? ''
  })

  ipcMain_.handle('fab-select-folder', async (): Promise<string | null> => {
    const win = getMainWindow()
    const result = await dialog.showOpenDialog(win, {
      title: 'Select Fab Cache / Download Folder',
      properties: ['openDirectory']
    })
    return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0]
  })

  ipcMain_.handle('fab-scan-folder', (_event, folderPath: string): FabAsset[] => {
    return scanFabFolder(folderPath)
  })

  ipcMain_.handle('fab-save-path', (_event, folderPath: string): void => {
    try {
      const settingsPath = path.join(app.getPath('userData'), 'save', 'settings.json')
      let settings: Record<string, unknown> = {}
      if (fs.existsSync(settingsPath)) {
        settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
      }
      settings.fabCachePath = folderPath
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8')
    } catch {
      /* ignore */
    }
  })

  ipcMain_.handle('fab-load-path', (): string => {
    try {
      const settingsPath = path.join(app.getPath('userData'), 'save', 'settings.json')
      if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
        return typeof settings.fabCachePath === 'string' ? settings.fabCachePath : ''
      }
    } catch {
      /* ignore */
    }
    return ''
  })
}

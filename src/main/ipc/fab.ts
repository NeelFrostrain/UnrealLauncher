// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { ipcMain, dialog, app } from 'electron'
import path from 'path'
import fs from 'fs'
import { sanitizeDirectory } from '../utils/pathSanitization'
import { getMainWindow } from '../window'
import { getDefaultFabPaths, findFirstExisting, scanFabFolder } from './fabScanner'
import type { FabAsset } from '../utils/fabAssetDetection'

export type { FabAsset }

export function registerFabHandlers(ipcMain_: typeof ipcMain): void {
  ipcMain_.handle('fab-get-default-path', (): string => {
    return findFirstExisting(getDefaultFabPaths()) ?? ''
  })

  ipcMain_.handle('fab-select-folder', async (): Promise<string | null> => {
    const win = getMainWindow()
    if (!win) return null
    const result = await dialog.showOpenDialog(win, {
      title: 'Select Fab Cache / Download Folder',
      properties: ['openDirectory']
    })
    return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0]
  })

  ipcMain_.handle('fab-scan-folder', async (_event, folderPath: string): Promise<FabAsset[]> => {
    // SECURITY: Sanitize path to prevent directory traversal.
    // Explicitly allow the selected folder as its own authorized base.
    const sanitized = sanitizeDirectory(folderPath, [folderPath])
    if (!sanitized.success || !sanitized.resolvedPath) {
      throw new Error(sanitized.error || 'Invalid Fab folder path')
    }
    return scanFabFolder(sanitized.resolvedPath)
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

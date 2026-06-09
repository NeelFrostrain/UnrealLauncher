// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import type { IpcMain } from 'electron'
import {
  getIsMaximized,
  handleWindowMinimize,
  handleWindowMaximize,
  getMainWindow,
  handleRequestedAppClose
} from '../window'

/**
 * Registers window control IPC handlers
 */
export function registerWindowHandlers(ipcMain: IpcMain): void {
  ipcMain.on('window-minimize', () => handleWindowMinimize(getMainWindow()))
  ipcMain.on('window-maximize', () => handleWindowMaximize(getMainWindow()))
  ipcMain.on('window-close', () => handleRequestedAppClose())
  ipcMain.handle('window-is-maximized', getIsMaximized)
}

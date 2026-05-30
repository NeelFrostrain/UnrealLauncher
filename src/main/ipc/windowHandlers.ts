// Copyright (c) 2026 NeelFrostrain. All rights reserved.
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
export function registerWindowHandlers(ipcMain: any): void {
  ipcMain.on('window-minimize', () => handleWindowMinimize(getMainWindow()))
  ipcMain.on('window-maximize', () => handleWindowMaximize(getMainWindow()))
  ipcMain.on('window-close', () => handleRequestedAppClose())
  ipcMain.handle('window-is-maximized', getIsMaximized)
}

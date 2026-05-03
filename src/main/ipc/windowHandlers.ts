// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { app } from 'electron'
import {
  getIsMaximized,
  handleWindowMinimize,
  handleWindowMaximize,
  getMainWindow
} from '../window'

/**
 * Registers window control IPC handlers
 */
export function registerWindowHandlers(ipcMain: any): void {
  ipcMain.on('window-minimize', () => handleWindowMinimize(getMainWindow()))
  ipcMain.on('window-maximize', () => handleWindowMaximize(getMainWindow()))
  ipcMain.on('window-close', () => app.quit())
  ipcMain.handle('window-is-maximized', getIsMaximized)
}

// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
/**
 * App lifecycle and window management.
 */

import { app, BrowserWindow } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { optimizer } from '@electron-toolkit/utils'
import { MAIN_WINDOW_CONFIG } from './windowConfig'
import { createSplashWindow, getSplashWindow, closeSplashWindow } from './splashWindow'
import { setupWindowEventHandlers, setupDevToolsShortcut, setupMemoryManagement } from './windowHandlers'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow: BrowserWindow | null = null

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

export function createWindow(): void {
  createSplashWindow()

  mainWindow = new BrowserWindow(MAIN_WINDOW_CONFIG as any)
  setupWindowEventHandlers(mainWindow)
  setupDevToolsShortcut(mainWindow)
  setupMemoryManagement(mainWindow)

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show()
      closeSplashWindow()
    }
  })

  mainWindow.on('closed', () => {
    closeSplashWindow()
    mainWindow = null
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

export function setupAppLifecycle(): void {
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
}

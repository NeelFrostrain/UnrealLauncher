// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
/**
 * Window event handlers and control functions.
 */

import { BrowserWindow, screen } from 'electron'

let isMaximized = false
let previousBounds: { x: number; y: number; width: number; height: number } | null = null

export function getIsMaximized(): boolean {
  return isMaximized
}

export function handleWindowMinimize(mainWindow: BrowserWindow | null): void {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.minimize()
}

export function handleWindowMaximize(mainWindow: BrowserWindow | null): void {
  if (!mainWindow || mainWindow.isDestroyed()) return
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().bounds

  if (isMaximized) {
    if (previousBounds) {
      mainWindow.setPosition(previousBounds.x, previousBounds.y)
      mainWindow.setSize(previousBounds.width, previousBounds.height)
    }
    isMaximized = false
  } else {
    previousBounds = mainWindow.getBounds()
    mainWindow.setPosition(0, 0)
    mainWindow.setSize(screenWidth, screenHeight)
    isMaximized = true
  }
}

export function setupWindowEventHandlers(mainWindow: BrowserWindow): void {
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) mainWindow.show()
  })

  mainWindow.on('closed', () => {
    // Cleanup handled by caller
  })

  // Free renderer memory when minimized
  mainWindow.on('minimize', () => {
    mainWindow?.webContents.session.clearCache()
  })
}

export function setupDevToolsShortcut(mainWindow: BrowserWindow): void {
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.control && input.key.toLowerCase() === 'd') {
        event.preventDefault()
        if (mainWindow) {
          if (mainWindow.webContents.isDevToolsOpened()) {
            mainWindow.webContents.closeDevTools()
          } else {
            mainWindow.webContents.openDevTools()
          }
        }
      }
    })
  }
}

export function setupMemoryManagement(mainWindow: BrowserWindow): void {
  // Periodically free unused memory when the window is not focused
  setInterval(() => {
    if (mainWindow && !mainWindow.isFocused()) {
      mainWindow.webContents.executeJavaScript('if(typeof gc==="function")gc()').catch(() => {})
    }
  }, 30_000)
}

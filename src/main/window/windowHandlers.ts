// Copyright (c) 2026 NeelFrostrain. All rights reserved.
/**
 * Window event handlers and control functions.
 */

import { BrowserWindow } from 'electron'

export function enableBackgroundMode(mainWindow: BrowserWindow): void {
  try {
    mainWindow.webContents.setBackgroundThrottling(true)
  } catch {
    // Some Electron runtimes may not support explicit throttling.
  }
  mainWindow.webContents.session.clearCache().catch(() => {
    /* ignore */
  })
}

function enableForegroundMode(mainWindow: BrowserWindow): void {
  try {
    mainWindow.webContents.setBackgroundThrottling(false)
  } catch {
    /* ignore */
  }
}

export function getIsMaximized(mainWindow: BrowserWindow | null): boolean {
  if (!mainWindow || mainWindow.isDestroyed()) return false
  return mainWindow.isMaximized()
}

export function handleWindowMinimize(mainWindow: BrowserWindow | null): void {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.minimize()
}

export function handleWindowMaximize(mainWindow: BrowserWindow | null): void {
  if (!mainWindow || mainWindow.isDestroyed()) return
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow.maximize()
  }
}

export function setupWindowEventHandlers(mainWindow: BrowserWindow): void {
  mainWindow.once('ready-to-show', () => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.show()
  })

  mainWindow.on('closed', () => {
    // Cleanup handled by caller
  })

  mainWindow.on('maximize', () => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window-maximized-change', true)
    }
  })

  mainWindow.on('unmaximize', () => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window-maximized-change', false)
    }
  })

  // Free renderer memory and throttle timers when not visible.
  mainWindow.on('minimize', () => {
    enableBackgroundMode(mainWindow)
  })

  mainWindow.on('hide', () => {
    enableBackgroundMode(mainWindow)
  })

  mainWindow.on('show', () => {
    enableForegroundMode(mainWindow)
  })

  mainWindow.on('focus', () => {
    enableForegroundMode(mainWindow)
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

export function setupMemoryManagement(mainWindow: BrowserWindow): NodeJS.Timeout {
  // Periodically free unused memory when the window is not focused
  return setInterval(() => {
    if (mainWindow && !mainWindow.isFocused()) {
      mainWindow.webContents.executeJavaScript('if(typeof gc==="function")gc()').catch(() => {})
    }
  }, 30_000)
}

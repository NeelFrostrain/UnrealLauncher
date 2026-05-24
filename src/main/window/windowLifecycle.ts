// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
/**
 * App lifecycle and window management.
 */

import { app, BrowserWindow, Tray, Menu, nativeImage } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { optimizer } from '@electron-toolkit/utils'
import { MAIN_WINDOW_CONFIG } from './windowConfig'
import { createSplashWindow, closeSplashWindow } from './splashWindow'
import {
  setupWindowEventHandlers,
  setupDevToolsShortcut,
  setupMemoryManagement
} from './windowHandlers'
import { loadMainSettings } from '../store'

let appTray: Tray | null = null
let isQuiting = false
let memoryManagementTimer: NodeJS.Timeout | null = null

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow: BrowserWindow | null = null

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

function clearMemoryManagementTimer(): void {
  if (!memoryManagementTimer) return
  clearInterval(memoryManagementTimer)
  memoryManagementTimer = null
}

function showOrCreateMainWindow(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show()
    mainWindow.focus()
  } else {
    createWindow()
  }
  destroyAppTray()
}

function getTrayIconPath(): string {
  const appPath = app.getAppPath()
  const candidates = [
    path.join(process.cwd(), 'resources', 'icon.png'),
    path.join(appPath, 'resources', 'icon.png'),
    path.join(appPath.replace('app.asar', 'app.asar.unpacked'), 'resources', 'icon.png'),
    path.join(process.resourcesPath, 'resources', 'icon.png'),
    path.join(process.resourcesPath, 'app.asar.unpacked', 'resources', 'icon.png')
  ]

  return (
    candidates.find((candidate) => !nativeImage.createFromPath(candidate).isEmpty()) ??
    candidates[0]
  )
}

function createAppTray(): boolean {
  if (appTray) return true
  const icon = nativeImage.createFromPath(getTrayIconPath())
  if (icon.isEmpty()) return false

  if (!icon.isEmpty() && process.platform === 'darwin') {
    icon.setTemplateImage(true)
  }

  try {
    appTray = new Tray(icon)
  } catch {
    appTray = null
    return false
  }

  appTray.setToolTip('Unreal Launcher')
  appTray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: 'Show Unreal Launcher',
        click: () => {
          showOrCreateMainWindow()
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          isQuiting = true
          app.quit()
        }
      }
    ])
  )
  appTray.on('double-click', () => {
    showOrCreateMainWindow()
  })
  return true
}

function destroyAppTray(): void {
  if (!appTray) return
  appTray.destroy()
  appTray = null
}

export function handleRequestedAppClose(): void {
  const settings = loadMainSettings()
  if (!settings.backgroundCloseEnabled) {
    isQuiting = true
    app.quit()
    return
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    if (createAppTray()) {
      mainWindow.close()
    }
  }
}

export function handleRequestedAppShow(): void {
  showOrCreateMainWindow()
}

export function requestQuit(): void {
  isQuiting = true
  destroyAppTray()
  app.quit()
}

export function getIsQuitting(): boolean {
  return isQuiting
}

export function getBackgroundCloseEnabled(): boolean {
  return loadMainSettings().backgroundCloseEnabled
}

export function getAppTray(): Tray | null {
  return appTray
}

export function createWindow(): void {
  createSplashWindow()

  mainWindow = new BrowserWindow(MAIN_WINDOW_CONFIG as any)
  setupWindowEventHandlers(mainWindow)
  setupDevToolsShortcut(mainWindow)
  clearMemoryManagementTimer()
  memoryManagementTimer = setupMemoryManagement(mainWindow)

  mainWindow.on('close', () => {
    if (isQuiting) return
    const settings = loadMainSettings()
    if (settings.backgroundCloseEnabled && mainWindow && !mainWindow.isDestroyed()) {
      if (createAppTray()) {
        return
      }
    }
  })

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show()
      closeSplashWindow()
    }
  })

  mainWindow.on('closed', () => {
    clearMemoryManagementTimer()
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
    if (process.platform === 'darwin') return
    if (!loadMainSettings().backgroundCloseEnabled) app.quit()
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
}

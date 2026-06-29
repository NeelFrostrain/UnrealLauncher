// Copyright (c) 2026 NeelFrostrain. All rights reserved.
/**
 * App lifecycle and window management.
 */

import { app, BrowserWindow, Tray, Menu, nativeImage, globalShortcut } from 'electron'
import type { BrowserWindowConstructorOptions } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { optimizer } from '@electron-toolkit/utils'
import { MAIN_WINDOW_CONFIG } from './windowConfig'
import { createSplashWindow, closeSplashWindow } from './splashWindow'
import {
  enableBackgroundMode,
  setupWindowEventHandlers,
  setupDevToolsShortcut,
  setupMemoryManagement
} from './windowHandlers'
import { loadMainSettings } from '../store'
import { logger } from '../logger'

let appTray: Tray | null = null
let isQuiting = false
let memoryManagementTimer: NodeJS.Timeout | null = null

// ── Background global shortcut ────────────────────────────────────────────────
// The tracer process now owns the system-wide Ctrl+K hotkey and signals us
// via the named pipe.  We only register the Electron globalShortcut as a
// fallback for when the tracer is NOT installed / running (e.g. Linux/macOS
// or first-run before tracer starts).  On Windows with tracer running this
// shortcut registration will silently fail (hotkey already claimed) which is
// the correct behaviour — we don't want a double-trigger.
const PALETTE_SHORTCUT = 'CommandOrControl+K'

function registerBackgroundShortcut(): void {
  if (globalShortcut.isRegistered(PALETTE_SHORTCUT)) return
  // On Windows the tracer owns this key; this will fail silently — that's fine.
  const ok = globalShortcut.register(PALETTE_SHORTCUT, () => {
    logger.info('shortcut', 'Background Ctrl+K triggered — opening palette window')
    import('./paletteWindow')
      .then(({ openPaletteWindow }) => {
        openPaletteWindow()
      })
      .catch((err) => logger.error('shortcut', 'Failed to open palette window', err))
  })
  if (ok) {
    logger.info('shortcut', 'Background Ctrl+K registered (tracer not running)')
  } else {
    logger.info('shortcut', 'Background Ctrl+K not registered — tracer owns the hotkey')
  }
}

function unregisterBackgroundShortcut(): void {
  if (!globalShortcut.isRegistered(PALETTE_SHORTCUT)) return
  globalShortcut.unregister(PALETTE_SHORTCUT)
  logger.info('shortcut', 'Background Ctrl+K unregistered')
}

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
    logger.info('window', 'Showing existing main window')
    mainWindow.show()
    mainWindow.focus()
    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }
  } else {
    logger.info('window', 'Recreating main window from tray')
    createWindow()
  }
  // Window is now visible — renderer handles Ctrl+K, so release the global shortcut
  unregisterBackgroundShortcut()
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
    logger.warn('tray', 'Failed to create tray icon')
    return false
  }

  logger.info('tray', 'Tray icon created')
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
  logger.info('tray', 'Tray icon destroyed')
}

export function handleRequestedAppClose(): void {
  const settings = loadMainSettings()
  if (!settings.backgroundCloseEnabled) {
    logger.info('app', 'Close requested; quitting app')
    isQuiting = true
    app.quit()
    return
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    if (createAppTray()) {
      logger.info('window', 'Close requested; hiding window and staying in tray')
      // Register background shortcut before hiding so it's active immediately
      registerBackgroundShortcut()
      mainWindow.hide()
      enableBackgroundMode(mainWindow)
    }
  }
}

export function handleRequestedAppShow(): void {
  showOrCreateMainWindow()
}

export function requestQuit(): void {
  logger.info('app', 'Quit requested')
  isQuiting = true
  unregisterBackgroundShortcut()
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
  logger.info('window', 'Creating splash and main window')
  createSplashWindow()

  mainWindow = new BrowserWindow(MAIN_WINDOW_CONFIG as BrowserWindowConstructorOptions)
  logger.info('window', 'Main BrowserWindow created', {
    width: MAIN_WINDOW_CONFIG.width,
    height: MAIN_WINDOW_CONFIG.height,
    frame: MAIN_WINDOW_CONFIG.frame
  })
  setupWindowEventHandlers(mainWindow)
  setupDevToolsShortcut(mainWindow)
  clearMemoryManagementTimer()
  memoryManagementTimer = setupMemoryManagement(mainWindow)

  mainWindow.on('close', (event) => {
    logger.info('window', 'Main window close event', { isQuiting })
    if (isQuiting) return
    const settings = loadMainSettings()
    if (settings.backgroundCloseEnabled && mainWindow && !mainWindow.isDestroyed()) {
      event.preventDefault()
      if (createAppTray()) {
        // Window is going to tray — register background shortcut
        registerBackgroundShortcut()
        mainWindow.hide()
        enableBackgroundMode(mainWindow)
      }
    }
  })

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      logger.info('window', 'Main window ready to show')
      mainWindow.show()
      closeSplashWindow()
    }
  })

  mainWindow.on('closed', () => {
    logger.info('window', 'Main window closed')
    clearMemoryManagementTimer()
    closeSplashWindow()
    mainWindow = null
  })

  if (process.env.NODE_ENV === 'development') {
    logger.info('window', 'Loading development renderer URL')
    mainWindow.loadURL('http://localhost:5173')
  } else {
    logger.info('window', 'Loading production renderer file')
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

export function setupAppLifecycle(): void {
  app.on('window-all-closed', () => {
    logger.info('app', 'All windows closed')
    if (process.platform === 'darwin') return
    if (!loadMainSettings().backgroundCloseEnabled) app.quit()
  })

  app.on('activate', () => {
    logger.info('app', 'App activated')
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  app.on('browser-window-created', (_, window) => {
    logger.debug('window', 'Browser window created event')
    optimizer.watchWindowShortcuts(window)
  })
}

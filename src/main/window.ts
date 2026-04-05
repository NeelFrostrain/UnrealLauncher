import { app, BrowserWindow, screen } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { optimizer } from '@electron-toolkit/utils'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow: BrowserWindow | null = null
let isMaximized = false
let previousBounds: { x: number; y: number; width: number; height: number } | null = null

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

export function getIsMaximized(): boolean {
  return isMaximized
}

export function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false
    },
    icon: path.join(__dirname, '../../resources/icon.png'),
    frame: false,
    transparent: false,
    titleBarStyle: 'hidden',
    backgroundColor: 'transparent',
    resizable: true,
    minimizable: true,
    maximizable: true,
    closable: true,
    show: false
  })

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) mainWindow.show()
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
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
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

export function handleWindowMinimize(): void {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.minimize()
}

export function handleWindowMaximize(): void {
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

export function setupAppLifecycle(): void {
  app.whenReady().then(() => {
    createWindow()

    if (process.env.NODE_ENV === 'production') {
      setTimeout(() => {
        import('./updater').then(({ autoUpdater }) => autoUpdater.checkForUpdates())
      }, 3000)
    }

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
}

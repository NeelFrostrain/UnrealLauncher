import { app, BrowserWindow, screen } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { optimizer } from '@electron-toolkit/utils'
import { autoUpdater } from './updater'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow: BrowserWindow | null = null
let splashWindow: BrowserWindow | null = null
let isMaximized = false
let previousBounds: { x: number; y: number; width: number; height: number } | null = null

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

export function getIsMaximized(): boolean {
  return isMaximized
}

function createSplashWindow(): void {
  splashWindow = new BrowserWindow({
    width: 420,
    height: 260,
    frame: false,
    resizable: false,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    transparent: false,
    backgroundColor: '#111111',
    center: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  const splashHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Unreal Launcher</title>
        <style>
          :root {
            --color-surface: #242424;
            --color-surface-elevated: #1f1f1f;
            --color-surface-card: #1a1a1a;
            --color-border: rgba(255, 255, 255, 0.1);
            --color-accent: #2563eb;
            --color-accent-hover: #1d4ed8;
            --color-text-primary: rgba(255, 255, 255, 0.9);
            --color-text-secondary: rgba(255, 255, 255, 0.6);
            --color-text-muted: rgba(255, 255, 255, 0.4);
            --radius: 8px;
          }

          body {
            margin: 0;
            padding: 0;
            height: 100vh;
            font-family: 'Space Grotesk', system-ui, -apple-system, sans-serif;
            background-color: var(--color-surface);
            color: var(--color-text-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            user-select: none;
          }

          .container {
            text-align: center;
          }

          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.9; }
            100% { transform: scale(1); opacity: 1; }
          }

          .title {
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 6px;
            color: var(--color-text-primary);
          }

          .status-text {
            font-size: 13px;
            color: var(--color-text-muted);
            font-weight: 400;
          }

          /* Simple blinking dots */
          .dot {
            animation: blink 1.4s infinite both;
            color: var(--color-accent);
          }

          .dot:nth-child(2) { animation-delay: 0.2s; }
          .dot:nth-child(3) { animation-delay: 0.4s; }

          @keyframes blink {
            0% { opacity: 0.1; }
            20% { opacity: 1; }
            100% { opacity: 0.1; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="title">Unreal Launcher</div>
          <div class="status-text">
            Opening Launcher<span class="loading-dots">
              <span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
            </span>
          </div>
        </div>
      </body>
    </html>
`

  splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHtml)}`)
  splashWindow.once('ready-to-show', () => {
    if (splashWindow) splashWindow.show()
  })

  splashWindow.on('closed', () => {
    splashWindow = null
  })
}

export function createWindow(): void {
  createSplashWindow()

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      backgroundThrottling: true, // throttle timers/animations when minimized
      spellcheck: false, // no spell check needed in a launcher
      enableWebSQL: false, // unused, saves memory
      v8CacheOptions: 'bypassHeatCheck' // faster JS startup via V8 code cache
    },
    icon: path.join(__dirname, '../../resources/icon.png'),
    frame: false,
    transparent: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#121212',
    resizable: true,
    minimizable: true,
    maximizable: true,
    closable: true,
    show: false
  })

  mainWindow.once('ready-to-show', () => {
    // Wait a bit more to ensure React app is fully loaded
    setTimeout(() => {
      if (mainWindow) {
        mainWindow.show()
        if (splashWindow) {
          splashWindow.close()
          splashWindow = null
        }
      }
    }, 1000) // 1s
  })

  mainWindow.on('closed', () => {
    if (splashWindow) {
      splashWindow.close()
      splashWindow = null
    }
    mainWindow = null
  })

  // Free renderer memory when minimized — reclaimed automatically on restore
  mainWindow.on('minimize', () => {
    mainWindow?.webContents.session.clearCache()
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
      setTimeout(() => autoUpdater.checkForUpdates(), 3000)
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

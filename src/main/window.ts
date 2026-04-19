// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
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
    <title>Unreal Launcher | Frostrain</title>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;700&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
    <style>
        :root {
            --color-obsidian: #0A0A0B;
            --color-surface: #121214;
            --color-accent: #3B82F6; /* Cyber Blue */
            --color-text: #E2E8F0;
            --color-border: #262626;
            --neo-shadow: 6px 6px 0px 0px rgba(0, 0, 0, 1);
        }

        body {
            margin: 0;
            padding: 0;
            height: 100vh;
            font-family: 'Space Grotesk', sans-serif;
            background-color: var(--color-obsidian);
            color: var(--color-text);
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            user-select: none;
        }

        .loader-card {
            position: relative;
            z-index: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .logo-box {
            background: var(--color-accent);
            width: 40px;
            height: 40px;
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            color: white;
            box-shadow: 4px 4px 0px black;
        }

        .title {
            font-size: 18px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 3px;
            margin-bottom: 8px;
            background: linear-gradient(to right, #fff, #666);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .status-wrapper {
            display: flex;
            align-items: center;
            gap: 12px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            color: var(--color-accent);
            background: rgba(59, 130, 246, 0.05);
            padding: 4px 12px;
            border-radius: 2px;
        }

        .progress-bar {
            width: 100%;
            height: 2px;
            background: var(--color-border);
            margin-top: 20px;
            position: relative;
            overflow: hidden;
        }

        .progress-fill {
            position: absolute;
            height: 100%;
            background: var(--color-accent);
            width: 30%;
            animation: slide 1.5s infinite ease-in-out;
        }

        @keyframes slide {
            0% { left: -30%; }
            100% { left: 100%; }
        }

        .dot {
            animation: blink 1.4s infinite both;
        }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes blink {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="loader-card">
        <div class="title">Unreal Launcher</div>
        <div class="status-wrapper">
            <span>INITIALIZING ENGINE_TRACER</span>
            <span class="loading-dots">
                <span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
            </span>
        </div>

        <div class="progress-bar">
            <div class="progress-fill"></div>
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
      v8CacheOptions: 'bypassHeatCheck', // faster JS startup via V8 code cache
      webSecurity: false // allow loading external images from FAB
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

    // Periodically free unused memory when the window is not focused
    setInterval(() => {
      if (mainWindow && !mainWindow.isFocused()) {
        app.commandLine.appendSwitch('js-flags', '--expose-gc')
        mainWindow.webContents.executeJavaScript('if(typeof gc==="function")gc()').catch(() => {})
      }
    }, 30_000)
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
}

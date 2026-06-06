// Copyright (c) 2026 NeelFrostrain. All rights reserved.
/**
 * Manages the standalone command palette BrowserWindow.
 *
 * The palette is a small frameless window rendered from palette.html.
 * It is hidden until the renderer signals ready, to avoid a white flash.
 * It auto-closes after a command is executed.
 */

import { BrowserWindow, screen } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { logger } from '../logger'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let paletteWindow: BrowserWindow | null = null

export function getPaletteWindow(): BrowserWindow | null {
  return paletteWindow
}

export function isPaletteOpen(): boolean {
  return paletteWindow !== null && !paletteWindow.isDestroyed() && paletteWindow.isVisible()
}

/**
 * Opens the palette window, creating it if needed.
 * Subsequent calls while it's already open just focus it.
 */
export function openPaletteWindow(): void {
  // If already open — focus it
  if (paletteWindow && !paletteWindow.isDestroyed()) {
    paletteWindow.focus()
    return
  }

  // Use workAreaSize with scaleFactor to correctly size the window on
  // high-DPI displays (125%, 150%, 200% Windows scaling)
  const display = screen.getPrimaryDisplay()
  const { width: sw, height: sh } = display.workAreaSize

  // Window dimensions in logical pixels — Electron handles DPI scaling internally
  const W = Math.round(Math.min(600, sw * 0.5))
  const H = Math.round(Math.min(600, sh * 0.75))
  const x = Math.round((sw - W) / 2)
  const y = Math.round(sh * 0.08)   // ~8% from top

  paletteWindow = new BrowserWindow({
    width: W,
    height: H,
    x,
    y,
    frame: false,
    transparent: false,
    resizable: false,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,                       // shown only after 'palette-ready' IPC
    backgroundColor: '#1f1f1f',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, '../preload/palette.js'),
      webSecurity: true,
      spellcheck: false
    }
  })

  paletteWindow.on('closed', () => {
    logger.info('palette', 'Palette window closed')
    paletteWindow = null
  })

  // Close on blur (user clicked somewhere else) — mimic a popover
  paletteWindow.on('blur', () => {
    closePaletteWindow()
  })

  if (process.env.NODE_ENV === 'development') {
    // In dev, the renderer dev server also serves palette.html
    paletteWindow.loadURL('http://localhost:5173/palette.html')
  } else {
    paletteWindow.loadFile(path.join(__dirname, '../renderer/palette.html'))
  }

  logger.info('palette', 'Palette window created')
}

export function closePaletteWindow(): void {
  if (paletteWindow && !paletteWindow.isDestroyed()) {
    paletteWindow.close()
  }
}

// Copyright (c) 2026 NeelFrostrain. All rights reserved.
/**
 * Splash window creation and management.
 */

import { BrowserWindow } from 'electron'
import type { BrowserWindowConstructorOptions } from 'electron'
import { SPLASH_WINDOW_CONFIG, SPLASH_HTML } from './windowConfig'

let splashWindow: BrowserWindow | null = null

export function createSplashWindow(): void {
  splashWindow = new BrowserWindow(SPLASH_WINDOW_CONFIG as BrowserWindowConstructorOptions)
  splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(SPLASH_HTML)}`)
  splashWindow.once('ready-to-show', () => {
    if (splashWindow) splashWindow.show()
  })
  splashWindow.on('closed', () => {
    splashWindow = null
  })
}

export function getSplashWindow(): BrowserWindow | null {
  return splashWindow
}

export function closeSplashWindow(): void {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close()
    splashWindow = null
  }
}

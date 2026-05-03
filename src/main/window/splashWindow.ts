// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
/**
 * Splash window creation and management.
 */

import { BrowserWindow } from 'electron'
import { SPLASH_WINDOW_CONFIG, SPLASH_HTML } from './windowConfig'

let splashWindow: BrowserWindow | null = null

export function createSplashWindow(): void {
  splashWindow = new BrowserWindow(SPLASH_WINDOW_CONFIG as any)
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

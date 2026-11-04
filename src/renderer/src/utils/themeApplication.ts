// Copyright (c) 2026 NeelFrostrain. All rights reserved.
/**
 * Theme application and CSS utilities.
 */

import type { ThemeTokenMap } from './themeTokens'

export function applyTheme(tokens: ThemeTokenMap, overrides: Partial<ThemeTokenMap> = {}): void {
  const merged = { ...tokens, ...overrides }
  const root = document.documentElement
  for (const [key, value] of Object.entries(merged)) {
    if (key === 'font-family') {
      root.style.setProperty('--font-family', value)
    } else if (key === 'font-size') {
      const parsed = parseInt(value, 10)
      const safeSize = Number.isFinite(parsed) ? Math.min(24, Math.max(10, parsed)) : 15
      root.style.setProperty('--font-size', `${safeSize}px`)
    } else {
      root.style.setProperty(`--color-${key}`, value)
    }
  }
}

export function applyRadius(px: number): void {
  const safePx = Math.min(24, Math.max(0, Number.isFinite(px) ? Math.round(px) : 8))
  document.documentElement.style.setProperty('--radius', `${safePx}px`)
}

export function applyScale(scale: number): void {
  const safeScale = Math.min(2.0, Math.max(0.5, Number.isFinite(scale) ? scale : 1.0))
  document.documentElement.style.setProperty('--ui-scale', String(safeScale))
  if (typeof window !== 'undefined' && window.electronAPI?.setZoomFactor) {
    try {
      window.electronAPI.setZoomFactor(safeScale)
    } catch {
      /* ignore */
    }
  }
}

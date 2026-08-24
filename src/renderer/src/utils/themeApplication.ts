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
      root.style.setProperty('--font-size', value)
    } else {
      root.style.setProperty(`--color-${key}`, value)
    }
  }
}

export function applyRadius(px: number): void {
  document.documentElement.style.setProperty('--radius', `${px}px`)
}

export function applyScale(scale: number): void {
  document.documentElement.style.setProperty('--ui-scale', String(scale))
}

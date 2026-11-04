// Copyright (c) 2026 NeelFrostrain. All rights reserved.
/**
 * Theme persistence and storage management.
 */

import { BUILT_IN_THEMES, DEFAULT_THEME_ID, type ThemeTokenMap } from './themeTokens'

const STORAGE_KEY = 'unrealLauncherTheme'
const RADIUS_KEY = 'unrealLauncherRadius'
const SCALE_KEY = 'unrealLauncherUIScale'

export interface PersistedTheme {
  id: string
  overrides: Partial<ThemeTokenMap>
}

export function loadPersistedTheme(): PersistedTheme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedTheme
      if (BUILT_IN_THEMES.some((t) => t.id === parsed.id)) {
        // Sanitize overrides if font-size is present
        const safeOverrides = { ...(parsed.overrides || {}) }
        if (safeOverrides['font-size']) {
          const parsedSize = parseInt(safeOverrides['font-size'], 10)
          if (Number.isFinite(parsedSize)) {
            safeOverrides['font-size'] = `${Math.min(24, Math.max(10, parsedSize))}px`
          } else {
            delete safeOverrides['font-size']
          }
        }
        return { id: parsed.id, overrides: safeOverrides }
      }
    }
  } catch {
    /* ignore */
  }
  return { id: DEFAULT_THEME_ID, overrides: {} }
}

export function persistTheme(id: string, overrides: Partial<ThemeTokenMap>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id, overrides }))
  } catch {
    /* ignore */
  }
}

export function loadPersistedRadius(): number {
  try {
    const v = localStorage.getItem(RADIUS_KEY)
    if (v !== null) {
      const num = Number(v)
      if (Number.isFinite(num)) {
        return Math.min(24, Math.max(0, Math.round(num)))
      }
    }
  } catch {
    /* ignore */
  }
  return 8
}

export function persistRadius(px: number): void {
  try {
    const safePx = Math.min(24, Math.max(0, Number.isFinite(px) ? Math.round(px) : 8))
    localStorage.setItem(RADIUS_KEY, String(safePx))
  } catch {
    /* ignore */
  }
}

export function loadPersistedScale(): number {
  try {
    const v = localStorage.getItem(SCALE_KEY)
    if (v !== null) {
      const num = Number(v)
      if (Number.isFinite(num)) {
        return Math.min(2.0, Math.max(0.5, Math.round(num * 100) / 100))
      }
    }
  } catch {
    /* ignore */
  }
  return 1.0
}

export function persistScale(scale: number): void {
  try {
    const safeScale = Math.min(2.0, Math.max(0.5, Number.isFinite(scale) ? scale : 1.0))
    localStorage.setItem(SCALE_KEY, String(safeScale))
  } catch {
    /* ignore */
  }
}

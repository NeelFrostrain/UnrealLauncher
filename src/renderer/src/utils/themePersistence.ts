// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
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
      if (BUILT_IN_THEMES.some((t) => t.id === parsed.id)) return parsed
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
    if (v !== null) return Math.min(24, Math.max(0, Number(v)))
  } catch {
    /* ignore */
  }
  return 8
}

export function persistRadius(px: number): void {
  try {
    localStorage.setItem(RADIUS_KEY, String(px))
  } catch {
    /* ignore */
  }
}

export function loadPersistedScale(): number {
  try {
    const v = localStorage.getItem(SCALE_KEY)
    if (v !== null) return Math.min(1.5, Math.max(0.7, Number(v)))
  } catch {
    /* ignore */
  }
  return 1.0
}

export function persistScale(scale: number): void {
  try {
    localStorage.setItem(SCALE_KEY, String(scale))
  } catch {
    /* ignore */
  }
}

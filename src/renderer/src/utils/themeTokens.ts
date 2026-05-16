// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
/**
 * Theme token definitions and built-in themes.
 */

export type ThemeToken =
  | 'surface'
  | 'surface-elevated'
  | 'surface-card'
  | 'border'
  | 'accent'
  | 'accent-hover'
  | 'text-primary'
  | 'text-secondary'
  | 'text-muted'
  | 'font-family'
  | 'font-size'

export type ThemeTokenMap = Record<ThemeToken, string>

export interface BuiltInTheme {
  id: string
  name: string
  tokens: ThemeTokenMap
}

export const BUILT_IN_THEMES: BuiltInTheme[] = [
  {
    id: 'dark',
    name: 'Dark',
    tokens: {
      surface: '#242424',
      'surface-elevated': '#1f1f1f',
      'surface-card': '#1a1a1a',
      border: 'rgba(255,255,255,0.10)',
      accent: '#2563eb',
      'accent-hover': '#1d4ed8',
      'text-primary': 'rgba(255,255,255,0.90)',
      'text-secondary': 'rgba(255,255,255,0.60)',
      'text-muted': 'rgba(255,255,255,0.40)',
      'font-family':
        "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      'font-size': '15px'
    }
  },
  {
    id: 'darker',
    name: 'Darker',
    tokens: {
      surface: '#111111',
      'surface-elevated': '#0d0d0d',
      'surface-card': '#0a0a0a',
      border: 'rgba(255,255,255,0.08)',
      accent: '#2563eb',
      'accent-hover': '#1d4ed8',
      'text-primary': 'rgba(255,255,255,0.90)',
      'text-secondary': 'rgba(255,255,255,0.55)',
      'text-muted': 'rgba(255,255,255,0.35)',
      'font-family':
        "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      'font-size': '15px'
    }
  },
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    tokens: {
      surface: '#0d1117',
      'surface-elevated': '#0a0e14',
      'surface-card': '#080b10',
      border: 'rgba(99,179,237,0.12)',
      accent: '#3b82f6',
      'accent-hover': '#2563eb',
      'text-primary': 'rgba(226,232,240,0.92)',
      'text-secondary': 'rgba(148,163,184,0.80)',
      'text-muted': 'rgba(100,116,139,0.70)',
      'font-family':
        "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      'font-size': '15px'
    }
  },
  {
    id: 'warm-dark',
    name: 'Warm Dark',
    tokens: {
      surface: '#1e1a16',
      'surface-elevated': '#1a1612',
      'surface-card': '#16120e',
      border: 'rgba(255,200,100,0.10)',
      accent: '#d97706',
      'accent-hover': '#b45309',
      'text-primary': 'rgba(255,248,235,0.90)',
      'text-secondary': 'rgba(214,188,150,0.70)',
      'text-muted': 'rgba(180,155,110,0.50)',
      'font-family':
        "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      'font-size': '15px'
    }
  }
]

export const DEFAULT_THEME_ID = 'dark'

export function getTheme(id: string): BuiltInTheme {
  return BUILT_IN_THEMES.find((t) => t.id === id) ?? BUILT_IN_THEMES[0]
}

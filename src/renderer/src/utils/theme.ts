// ── Token names ───────────────────────────────────────────────────────────────

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

// ── Built-in themes ───────────────────────────────────────────────────────────

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

// ── CSS variable injection ────────────────────────────────────────────────────

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

// ── Persistence ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'unrealLauncherTheme'

interface PersistedTheme {
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

// ── Custom profiles ───────────────────────────────────────────────────────────

export interface CustomProfile {
  id: string // uuid-like, prefixed with 'custom-'
  name: string
  tokens: ThemeTokenMap
}

const PROFILES_KEY = 'unrealLauncherThemeProfiles'
const ACTIVE_PROFILE_KEY = 'unrealLauncherActiveProfile'

export function loadCustomProfiles(): CustomProfile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY)
    if (raw) return JSON.parse(raw) as CustomProfile[]
  } catch {
    /* ignore */
  }
  return []
}

export function saveCustomProfiles(profiles: CustomProfile[]): void {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles))
  } catch {
    /* ignore */
  }
}

export function loadActiveProfileId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_PROFILE_KEY)
  } catch {
    return null
  }
}

export function saveActiveProfileId(id: string | null): void {
  try {
    if (id) localStorage.setItem(ACTIVE_PROFILE_KEY, id)
    else localStorage.removeItem(ACTIVE_PROFILE_KEY)
  } catch {
    /* ignore */
  }
}

export function createProfile(name: string, tokens: ThemeTokenMap): CustomProfile {
  return { id: `custom-${Date.now()}`, name, tokens }
}

/** Resolve the full token map for any id — built-in or custom profile. */
export function resolveTokens(id: string, profiles: CustomProfile[]): ThemeTokenMap {
  const builtin = BUILT_IN_THEMES.find((t) => t.id === id)
  if (builtin) return builtin.tokens
  const profile = profiles.find((p) => p.id === id)
  if (profile) return profile.tokens
  return BUILT_IN_THEMES[0].tokens
}

// ── Border radius ─────────────────────────────────────────────────────────────

const RADIUS_KEY = 'unrealLauncherRadius'

export function loadPersistedRadius(): number {
  try {
    const v = localStorage.getItem(RADIUS_KEY)
    if (v !== null) return Math.min(24, Math.max(0, Number(v)))
  } catch {
    /* ignore */
  }
  return 8 // default
}

export function persistRadius(px: number): void {
  try {
    localStorage.setItem(RADIUS_KEY, String(px))
  } catch {
    /* ignore */
  }
}

export function applyRadius(px: number): void {
  document.documentElement.style.setProperty('--radius', `${px}px`)
}

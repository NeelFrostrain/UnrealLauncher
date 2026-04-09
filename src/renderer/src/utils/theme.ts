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
      'surface':           '#242424',
      'surface-elevated':  '#1f1f1f',
      'surface-card':      '#1a1a1a',
      'border':            'rgba(255,255,255,0.10)',
      'accent':            '#2563eb',
      'accent-hover':      '#1d4ed8',
      'text-primary':      'rgba(255,255,255,0.90)',
      'text-secondary':    'rgba(255,255,255,0.60)',
      'text-muted':        'rgba(255,255,255,0.40)',
    },
  },
  {
    id: 'darker',
    name: 'Darker',
    tokens: {
      'surface':           '#111111',
      'surface-elevated':  '#0d0d0d',
      'surface-card':      '#0a0a0a',
      'border':            'rgba(255,255,255,0.08)',
      'accent':            '#2563eb',
      'accent-hover':      '#1d4ed8',
      'text-primary':      'rgba(255,255,255,0.90)',
      'text-secondary':    'rgba(255,255,255,0.55)',
      'text-muted':        'rgba(255,255,255,0.35)',
    },
  },
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    tokens: {
      'surface':           '#0d1117',
      'surface-elevated':  '#0a0e14',
      'surface-card':      '#080b10',
      'border':            'rgba(99,179,237,0.12)',
      'accent':            '#3b82f6',
      'accent-hover':      '#2563eb',
      'text-primary':      'rgba(226,232,240,0.92)',
      'text-secondary':    'rgba(148,163,184,0.80)',
      'text-muted':        'rgba(100,116,139,0.70)',
    },
  },
  {
    id: 'warm-dark',
    name: 'Warm Dark',
    tokens: {
      'surface':           '#1e1a16',
      'surface-elevated':  '#1a1612',
      'surface-card':      '#16120e',
      'border':            'rgba(255,200,100,0.10)',
      'accent':            '#d97706',
      'accent-hover':      '#b45309',
      'text-primary':      'rgba(255,248,235,0.90)',
      'text-secondary':    'rgba(214,188,150,0.70)',
      'text-muted':        'rgba(180,155,110,0.50)',
    },
  },
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
    root.style.setProperty(`--color-${key}`, value)
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
  } catch { /* ignore */ }
  return { id: DEFAULT_THEME_ID, overrides: {} }
}

export function persistTheme(id: string, overrides: Partial<ThemeTokenMap>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id, overrides }))
  } catch { /* ignore */ }
}

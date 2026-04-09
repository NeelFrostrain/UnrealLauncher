import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import {
  type ThemeToken,
  type ThemeTokenMap,
  type CustomProfile,
  BUILT_IN_THEMES,
  applyTheme,
  getTheme,
  loadPersistedTheme,
  persistTheme,
  loadCustomProfiles,
  saveCustomProfiles,
  loadActiveProfileId,
  saveActiveProfileId,
  createProfile,
  resolveTokens,
  loadPersistedRadius,
  applyRadius,
} from './theme'

interface ThemeContextType {
  // Built-in theme
  activeThemeId: string
  customOverrides: Partial<ThemeTokenMap>
  setTheme: (id: string) => void
  setOverride: (token: ThemeToken, value: string) => void
  resetOverrides: () => void
  // Custom profiles
  profiles: CustomProfile[]
  activeProfileId: string | null
  saveAsProfile: (name: string) => CustomProfile
  applyProfile: (id: string) => void
  updateProfile: (id: string, patch: Partial<Pick<CustomProfile, 'name' | 'tokens'>>) => void
  deleteProfile: (id: string) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

export const ThemeProvider = ({ children }: { children: ReactNode }): React.ReactElement => {
  const [activeThemeId, setActiveThemeId] = useState<string>(() => loadPersistedTheme().id)
  const [customOverrides, setCustomOverrides] = useState<Partial<ThemeTokenMap>>(() => loadPersistedTheme().overrides)
  const [profiles, setProfiles] = useState<CustomProfile[]>(() => loadCustomProfiles())
  const [activeProfileId, setActiveProfileId] = useState<string | null>(() => loadActiveProfileId())

  // Apply radius on mount
  useEffect(() => { applyRadius(loadPersistedRadius()) }, [])

  // Apply CSS variables whenever active theme/overrides/profile changes
  useEffect(() => {
    if (activeProfileId) {
      const profile = profiles.find((p) => p.id === activeProfileId)
      if (profile) { applyTheme(profile.tokens); return }
    }
    const base = getTheme(activeThemeId)
    applyTheme(base.tokens, customOverrides)
  }, [activeThemeId, customOverrides, activeProfileId, profiles])

  const setTheme = useCallback((id: string) => {
    // Could be a built-in or a custom profile id
    const isProfile = id.startsWith('custom-')
    if (isProfile) {
      setActiveProfileId(id)
      saveActiveProfileId(id)
    } else {
      const theme = BUILT_IN_THEMES.find((t) => t.id === id) ?? BUILT_IN_THEMES[0]
      setActiveThemeId(theme.id)
      setActiveProfileId(null)
      saveActiveProfileId(null)
      setCustomOverrides((prev) => { persistTheme(theme.id, prev); return prev })
    }
  }, [])

  const setOverride = useCallback((token: ThemeToken, value: string) => {
    setActiveProfileId(null)
    saveActiveProfileId(null)
    setCustomOverrides((prev) => {
      const next = { ...prev, [token]: value }
      setActiveThemeId((id) => { persistTheme(id, next); return id })
      return next
    })
  }, [])

  const resetOverrides = useCallback(() => {
    setCustomOverrides({})
    setActiveProfileId(null)
    saveActiveProfileId(null)
    setActiveThemeId((id) => { persistTheme(id, {}); return id })
  }, [])

  // ── Profile CRUD ──────────────────────────────────────────────────────────

  const saveAsProfile = useCallback((name: string): CustomProfile => {
    const baseTokens = resolveTokens(activeThemeId, profiles)
    const merged = { ...baseTokens, ...customOverrides } as ThemeTokenMap
    const profile = createProfile(name, merged)
    setProfiles((prev) => {
      const next = [...prev, profile]
      saveCustomProfiles(next)
      return next
    })
    setActiveProfileId(profile.id)
    saveActiveProfileId(profile.id)
    return profile
  }, [activeThemeId, customOverrides, profiles])

  const applyProfile = useCallback((id: string) => {
    setActiveProfileId(id)
    saveActiveProfileId(id)
  }, [])

  const updateProfile = useCallback((id: string, patch: Partial<Pick<CustomProfile, 'name' | 'tokens'>>) => {
    setProfiles((prev) => {
      const next = prev.map((p) => p.id === id ? { ...p, ...patch } : p)
      saveCustomProfiles(next)
      return next
    })
  }, [])

  const deleteProfile = useCallback((id: string) => {
    setProfiles((prev) => {
      const next = prev.filter((p) => p.id !== id)
      saveCustomProfiles(next)
      return next
    })
    setActiveProfileId((cur) => {
      if (cur === id) { saveActiveProfileId(null); return null }
      return cur
    })
  }, [])

  return (
    <ThemeContext.Provider value={{
      activeThemeId, customOverrides, setTheme, setOverride, resetOverrides,
      profiles, activeProfileId, saveAsProfile, applyProfile, updateProfile, deleteProfile,
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

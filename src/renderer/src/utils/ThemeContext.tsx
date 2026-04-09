import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import {
  type ThemeToken,
  type ThemeTokenMap,
  applyTheme,
  getTheme,
  loadPersistedTheme,
  persistTheme,
} from './theme'

interface ThemeContextType {
  activeThemeId: string
  customOverrides: Partial<ThemeTokenMap>
  setTheme: (id: string) => void
  setOverride: (token: ThemeToken, value: string) => void
  resetOverrides: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

export const ThemeProvider = ({ children }: { children: ReactNode }): React.ReactElement => {
  const [activeThemeId, setActiveThemeId] = useState<string>(() => {
    const persisted = loadPersistedTheme()
    return persisted.id
  })
  const [customOverrides, setCustomOverrides] = useState<Partial<ThemeTokenMap>>(() => {
    return loadPersistedTheme().overrides
  })

  // Apply on mount and whenever theme/overrides change
  useEffect(() => {
    const theme = getTheme(activeThemeId)
    applyTheme(theme.tokens, customOverrides)
  }, [activeThemeId, customOverrides])

  const setTheme = useCallback((id: string) => {
    const theme = getTheme(id)
    if (!theme) {
      console.warn(`[theme] Unknown theme id: ${id}, falling back to dark`)
    }
    setActiveThemeId(theme.id)
    setCustomOverrides((prev) => {
      persistTheme(theme.id, prev)
      return prev
    })
  }, [])

  const setOverride = useCallback((token: ThemeToken, value: string) => {
    setCustomOverrides((prev) => {
      const next = { ...prev, [token]: value }
      setActiveThemeId((id) => {
        persistTheme(id, next)
        return id
      })
      return next
    })
  }, [])

  const resetOverrides = useCallback(() => {
    setCustomOverrides({})
    setActiveThemeId((id) => {
      persistTheme(id, {})
      return id
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ activeThemeId, customOverrides, setTheme, setOverride, resetOverrides }}>
      {children}
    </ThemeContext.Provider>
  )
}

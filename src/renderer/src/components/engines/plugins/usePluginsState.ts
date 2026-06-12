// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useEffect, useState, useMemo, useCallback } from 'react'
import { useToast } from '../../../components/ui/ToastContext'

export type ViewMode = 'list' | 'grid'

interface EnginePlugin {
  name: string
  path: string
  icon: string | null
  version: string
  description: string
  category: string
  createdBy: string
  isBeta: boolean
  isExperimental: boolean
}

export interface UsePluginsStateReturn {
  plugins: EnginePlugin[]
  loading: boolean
  error: string | null
  searchQuery: string
  setSearchQuery: (query: string) => void
  viewMode: ViewMode
  handleViewChange: (mode: ViewMode) => void
  grouped: Array<{ category: string; plugins: EnginePlugin[] }>
  totalVisible: number
  load: () => Promise<void>
}

export function usePluginsState(engineDir: string): UsePluginsStateReturn {
  const { addToast } = useToast()
  const [plugins, setPlugins] = useState<EnginePlugin[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (localStorage.getItem('pluginsViewMode') as ViewMode) ?? 'list'
  )

  const load = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      setPlugins(await window.electronAPI.scanEnginePlugins(engineDir))
    } catch (err) {
      setPlugins([])
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      addToast('Plugin scan failed: ' + msg, 'error')
    }
    setLoading(false)
  }, [engineDir, addToast])

  useEffect(() => {
    load()
  }, [load])

  const handleViewChange = useCallback((mode: ViewMode): void => {
    setViewMode(mode)
    localStorage.setItem('pluginsViewMode', mode)
  }, [])

  const grouped = useMemo((): Array<{ category: string; plugins: EnginePlugin[] }> => {
    const q = searchQuery.trim().toLowerCase()
    const filtered = q
      ? plugins.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q)
        )
      : plugins
    const map = new Map<string, EnginePlugin[]>()
    for (const p of filtered) {
      const cat = p.category || 'Other'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(p)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => {
        if (a === 'Marketplace') return 1
        if (b === 'Marketplace') return -1
        return a.localeCompare(b)
      })
      .map(([category, plugins]) => ({ category, plugins }))
  }, [plugins, searchQuery])

  const totalVisible = useMemo(() => grouped.reduce((s, g) => s + g.plugins.length, 0), [grouped])

  return {
    plugins,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    viewMode,
    handleViewChange,
    grouped,
    totalVisible,
    load
  }
}

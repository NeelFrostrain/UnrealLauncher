// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useEffect, useState, useMemo, useCallback } from 'react'

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

export function usePluginsState(engineDir: string) {
  const [plugins, setPlugins] = useState<EnginePlugin[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (localStorage.getItem('pluginsViewMode') as ViewMode) ?? 'list'
  )

  const load = useCallback(async (): Promise<void> => {
    setLoading(true)
    try { setPlugins(await window.electronAPI.scanEnginePlugins(engineDir)) }
    catch { setPlugins([]) }
    setLoading(false)
  }, [engineDir])

  useEffect(() => { load() }, [load])

  const handleViewChange = useCallback((mode: ViewMode): void => {
    setViewMode(mode)
    localStorage.setItem('pluginsViewMode', mode)
  }, [])

  const grouped = useMemo((): Array<{ category: string; plugins: EnginePlugin[] }> => {
    const q = searchQuery.trim().toLowerCase()
    const filtered = q
      ? plugins.filter((p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q))
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

  return { plugins, loading, searchQuery, setSearchQuery, viewMode, handleViewChange, grouped, totalVisible, load }
}

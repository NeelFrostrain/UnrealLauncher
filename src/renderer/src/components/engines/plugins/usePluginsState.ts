// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
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
  enabledByDefault?: boolean
  dependencies?: string[]
  source?: 'Engine' | 'Project'
  projectName?: string
  docsUrl?: string
  supportUrl?: string
}

export interface UsePluginsStateReturn {
  plugins: EnginePlugin[]
  setPlugins: React.Dispatch<React.SetStateAction<EnginePlugin[]>>
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

export function usePluginsState(engineDir: string, engineVersion: string): UsePluginsStateReturn {
  const { addToast } = useToast()
  const addToastRef = useRef(addToast)
  useEffect(() => {
    addToastRef.current = addToast
  }, [addToast]) // Safely updates after render
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
      // Try cached plugins first (fast) and then refresh in background
      const cacheKey = `pluginsCache:${encodeURIComponent(engineDir)}`
      // Try cache first
      try {
        const raw = localStorage.getItem(cacheKey)
        if (raw) {
          const parsed = JSON.parse(raw) as { scannedAt: number; plugins: EnginePlugin[] }
          // Consider cache valid for 60 minutes
          if (Date.now() - (parsed.scannedAt ?? 0) < 1000 * 60 * 60) {
            setPlugins(parsed.plugins)
          }
        }
      } catch {
        /* ignore cache */
      }

      // 1. Scan engine plugins
      const freshEngine = await window.electronAPI.scanEnginePlugins(engineDir)
      const mappedEngine = freshEngine.map((p) => ({
        ...p,
        source: 'Engine' as const
      }))

      // 2. Scan project plugins
      let mappedProjects: EnginePlugin[] = []
      try {
        const savedProjects = await window.electronAPI.loadSavedProjects()
        const matchingProjects = savedProjects.filter(
          (p) =>
            p.projectPath && (p.version === engineVersion || p.version.startsWith(engineVersion))
        )
        const scanPromises = matchingProjects.map(async (p) => {
          try {
            const projPlugins = await window.electronAPI.projectScanPlugins(p.projectPath!)
            return projPlugins
              .filter((plugin) => plugin.path)
              .map((plugin) => {
                const normPath = plugin.path.replace(/\\/g, '/')
                const pluginDir = normPath.substring(0, normPath.lastIndexOf('/'))
                return {
                  name: plugin.name,
                  path: pluginDir,
                  icon: null,
                  version: plugin.version,
                  description: plugin.description,
                  category: 'Project: ' + p.name,
                  createdBy: '',
                  isBeta: false,
                  isExperimental: false,
                  enabledByDefault: plugin.enabledByDefault ?? true,
                  dependencies: plugin.dependencies ?? [],
                  docsUrl: plugin.docsUrl ?? '',
                  supportUrl: plugin.supportUrl ?? '',
                  source: 'Project' as const,
                  projectName: p.name
                }
              })
          } catch {
            return []
          }
        })
        const results = await Promise.all(scanPromises)
        mappedProjects = results.flat()
      } catch (err) {
        console.error('Failed to load project plugins:', err)
      }

      const merged = [...mappedEngine, ...mappedProjects]
      setPlugins(merged)
      // Persist fresh scan
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ scannedAt: Date.now(), plugins: merged }))
      } catch {
        /* ignore */
      }
    } catch (err) {
      setPlugins([])
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      addToastRef.current('Plugin scan failed: ' + msg, 'error')
    }
    setLoading(false)
  }, [engineDir, engineVersion])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    setPlugins,
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

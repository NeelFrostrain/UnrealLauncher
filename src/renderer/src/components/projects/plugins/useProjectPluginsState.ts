// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useToast } from '../../../components/ui/ToastContext'

export type ViewMode = 'list' | 'grid'

interface ProjectPlugin {
  name: string
  internalName: string
  path: string
  description: string
  version: string
  enabled: boolean
}

export function useProjectPluginsState(projectPath: string): {
  plugins: ProjectPlugin[]
  filteredPlugins: ProjectPlugin[]
  loading: boolean
  error: string | null
  searchQuery: string
  setSearchQuery: (q: string) => void
  viewMode: ViewMode
  handleViewChange: (mode: ViewMode) => void
  togglePlugin: (internalName: string, currentStatus: boolean) => Promise<void>
  load: () => Promise<void>
} {
  const { addToast } = useToast()
  const addToastRef = useRef(addToast)
  addToastRef.current = addToast

  const [plugins, setPlugins] = useState<ProjectPlugin[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (localStorage.getItem('projectPluginsViewMode') as ViewMode) ?? 'list'
  )

  // Stable — only re-creates when projectPath changes, not on every addToast render
  const load = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      setPlugins(await window.electronAPI.projectScanPlugins(projectPath))
    } catch (err) {
      setPlugins([])
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      addToastRef.current('Plugin scan failed: ' + msg, 'error')
    }
    setLoading(false)
  }, [projectPath])

  useEffect(() => {
    load()
  }, [load])

  const togglePlugin = useCallback(
    async (internalName: string, currentStatus: boolean): Promise<void> => {
      const nextStatus = !currentStatus

      // Optimistic update
      setPlugins((prev) =>
        prev.map((p) => (p.internalName === internalName ? { ...p, enabled: nextStatus } : p))
      )

      try {
        const result = await window.electronAPI.projectTogglePlugin(
          projectPath,
          internalName,
          nextStatus
        )
        if (!result.success) throw new Error(result.error || 'Unknown error')
        addToastRef.current(`${nextStatus ? 'Enabled' : 'Disabled'} ${internalName}`, 'success')
      } catch (err) {
        // Revert on failure
        setPlugins((prev) =>
          prev.map((p) => (p.internalName === internalName ? { ...p, enabled: currentStatus } : p))
        )
        const msg = err instanceof Error ? err.message : String(err)
        addToastRef.current(`Failed to update plugin: ${msg}`, 'error')
      }
    },
    [projectPath]
  )

  const handleViewChange = useCallback((mode: ViewMode): void => {
    setViewMode(mode)
    localStorage.setItem('projectPluginsViewMode', mode)
  }, [])

  const filteredPlugins = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return q
      ? plugins.filter(
          (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
        )
      : plugins
  }, [plugins, searchQuery])

  return {
    plugins,
    filteredPlugins,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    viewMode,
    handleViewChange,
    togglePlugin,
    load
  }
}

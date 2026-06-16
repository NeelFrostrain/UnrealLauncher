// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useEffect, useState, useMemo, useCallback } from 'react'
import { useToast } from '../../../components/ui/ToastContext'

export type ViewMode = 'list' | 'grid'

interface ProjectPlugin {
  name: string
  path: string
  description: string
  version: string
  enabled: boolean
}

export function useProjectPluginsState(projectPath: string) {
  const { addToast } = useToast()
  const [plugins, setPlugins] = useState<ProjectPlugin[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (localStorage.getItem('projectPluginsViewMode') as ViewMode) ?? 'list'
  )

  const load = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      // Calls the backend handler we registered in Step 12
      setPlugins(await window.electronAPI.projectScanPlugins(projectPath))
    } catch (err) {
      setPlugins([])
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      addToast('Plugin scan failed: ' + msg, 'error')
    }

    setLoading(false)
  }, [projectPath, addToast])

  useEffect(() => {
    load()
  }, [load])

  // 1. New function to trigger the backend toggle configuration update
  const togglePlugin = useCallback(async (pluginInternalName: string, currentStatus: boolean): Promise<void> => {
    const nextStatus = !currentStatus

    // Optimistic UI Update: update layout state instantly so the user experience is smooth
    setPlugins((prev) =>
      prev.map((p) => (p.name === pluginInternalName ? { ...p, enabled: nextStatus } : p))
    )

    try {
      const result = await window.electronAPI.projectTogglePlugin(projectPath, pluginInternalName, nextStatus)
      if (!result.success) {
        throw new Error(result.error || 'Unknown file error')
      }
      addToast(`Successfully ${nextStatus ? 'enabled' : 'disabled'} ${pluginInternalName}`, 'success')
    } catch (err) {
      // Revert the UI state if the backend operation fails
      setPlugins((prev) =>
        prev.map((p) => (p.name === pluginInternalName ? { ...p, enabled: currentStatus } : p))
      )
      const msg = err instanceof Error ? err.message : String(err)
      addToast(`Failed to update plugin config: ${msg}`, 'error')
    }
  }, [projectPath, addToast])

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
    togglePlugin, // Expose toggle function to UI elements
    load
  }
}

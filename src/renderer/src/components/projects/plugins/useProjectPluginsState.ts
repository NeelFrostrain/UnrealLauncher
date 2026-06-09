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

export function useProjectPluginsState(projectDir: string) {
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
      setPlugins(await window.electronAPI.projectScanPlugins(projectDir))
    } catch (err) {
      setPlugins([])
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      addToast('Plugin scan failed: ' + msg, 'error')
    }

    setLoading(false)
  }, [projectDir, addToast])

  useEffect(() => {
    load()
  }, [load])

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
    load
  }
}

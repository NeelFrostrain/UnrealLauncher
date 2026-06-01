// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import type { FabAsset } from './AssetCard'

type ViewMode = 'list' | 'grid'

/**
 * Custom hook for managing FabTab state
 */
export function useFabTabState() {
  const [folderPath, setFolderPath] = useState('')
  const [assets, setAssets] = useState<FabAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQueryRaw] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const setSearchQuery = useCallback((q: string): void => {
    setSearchQueryRaw(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedQuery(q), 200)
  }, [])
  const [typeFilter, setTypeFilter] = useState<FabAsset['type'] | 'all'>('all')
  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (localStorage.getItem('fabViewMode') as ViewMode) ?? 'list'
  )

  useEffect(() => {
    const init = async (): Promise<void> => {
      const saved = await window.electronAPI.fabLoadPath()
      if (saved) {
        setFolderPath(saved)
        scan(saved)
      } else {
        const def = await window.electronAPI.fabGetDefaultPath()
        if (def) {
          setFolderPath(def)
          scan(def)
        }
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const scan = useCallback(async (dir: string): Promise<void> => {
    if (!dir) return
    setLoading(true)
    try {
      setAssets(await window.electronAPI.fabScanFolder(dir))
    } catch {
      setAssets([])
    }
    setLoading(false)
  }, [])

  const handlePickFolder = async (): Promise<void> => {
    const picked = await window.electronAPI.fabSelectFolder()
    if (!picked) return
    setFolderPath(picked)
    await window.electronAPI.fabSavePath(picked)
    scan(picked)
  }

  const handleViewChange = (mode: ViewMode): void => {
    setViewMode(mode)
    localStorage.setItem('fabViewMode', mode)
  }

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase()
    return assets.filter((a) => {
      const matchType = typeFilter === 'all' || a.type === typeFilter
      const matchSearch = !q || a.name.toLowerCase().includes(q)
      return matchType && matchSearch
    })
  }, [assets, typeFilter, debouncedQuery])

  return {
    folderPath,
    assets,
    loading,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    viewMode,
    filtered,
    scan,
    handlePickFolder,
    handleViewChange
  }
}

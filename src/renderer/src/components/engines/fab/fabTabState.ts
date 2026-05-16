// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useEffect, useState, useCallback } from 'react'
import type { FabAsset } from './AssetCard'

type ViewMode = 'list' | 'grid'

/**
 * Custom hook for managing FabTab state
 */
export function useFabTabState() {
  const [folderPath, setFolderPath] = useState('')
  const [assets, setAssets] = useState<FabAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
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

  const filtered = assets.filter((a) => {
    const matchType = typeFilter === 'all' || a.type === typeFilter
    const matchSearch =
      !searchQuery.trim() || a.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchType && matchSearch
  })

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

// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import type { Project, TabType } from '../types'
import { useProjectFavorites } from './useProjectFavorites'
import { useProjectFilters } from './useProjectFilters'
import { useProjectActions } from './useProjectActions'
import { clearGitCache } from './useGitStatus'
import type { ViewMode } from '../components/projects/ProjectsToolbar'
import type { SortConfig } from '../components/projects/projectUtils'
import { useToast } from '../components/ui/ToastContext'
import { logActivity } from '../utils/activityLogger'

const HIDDEN_KEY = 'projectHidden'

function loadHiddenPaths(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]')
  } catch {
    return []
  }
}
function saveHiddenPaths(paths: string[]): void {
  localStorage.setItem(HIDDEN_KEY, JSON.stringify(paths))
}

/* eslint-disable @typescript-eslint/explicit-function-return-type */
export function useProjectsPageState() {
  const location = useLocation()
  const { addToast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [currentTab, setCurrentTab] = useState<TabType>(() => {
    const path = location.pathname
    if (path === '/projects/favorites') return 'favorites'
    if (path === '/projects/hidden') return 'hidden'
    return 'all'
  })
  const [refreshing, setRefreshing] = useState(false)
  const [backgroundScanning, setBackgroundScanning] = useState(false)
  const [calculatingSizes, setCalculatingSizes] = useState(false)
  const [addingProject, setAddingProject] = useState(false)
  const [scanEpoch, setScanEpoch] = useState(0)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('projectsViewMode') as ViewMode) ?? 'list'
  })
  const [sortConfig, setSortConfig] = useState<SortConfig>(() => {
    try {
      const saved = localStorage.getItem('projectsSortConfig')
      if (saved) return JSON.parse(saved) as SortConfig
    } catch {
      /* ignore */
    }
    return { key: 'lastOpenedAt', direction: 'desc' }
  })

  const { favoritePaths, toggleFavoritePath: toggleFav } = useProjectFavorites()
  const stableFavoritePaths = useMemo(() => favoritePaths, [JSON.stringify(favoritePaths)])
  const [hiddenPaths, setHiddenPaths] = useState<string[]>(loadHiddenPaths)
  const stableHiddenPaths = useMemo(() => hiddenPaths, [JSON.stringify(hiddenPaths)])
  // Stabilize array references to avoid busting useMemo/useEffect when contents are unchanged
  // favoritePathsRef is used for stable access in async callbacks
  const { filterForTab, switchTab: switchTabFn } = useProjectFilters()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [displayStart, setDisplayStart] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const allProjectsRef = useRef<Project[]>([])
  const currentTabRef = useRef<TabType>(currentTab)
  const hiddenPathsRef = useRef<string[]>(hiddenPaths)
  const favoritePathsRef = useRef<string[]>(favoritePaths)

  useEffect(() => {
    currentTabRef.current = currentTab
  }, [currentTab])
  useEffect(() => {
    hiddenPathsRef.current = hiddenPaths
  }, [hiddenPaths])
  useEffect(() => {
    favoritePathsRef.current = favoritePaths
  }, [favoritePaths])

  const handleListScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop
    setDisplayStart(Math.max(0, Math.floor(scrollTop / 98) - 5))
  }, [])

  const loadProjects = useCallback(
    async (source: 'saved' | 'scan'): Promise<Project[]> => {
      if (!window.electronAPI) return []
      if (source === 'saved') setLoading(true)
      else setBackgroundScanning(true)
      try {
        logActivity('Projects load started', { source })
        const raw =
          source === 'saved'
            ? await window.electronAPI.loadSavedProjects()
            : await window.electronAPI.scanProjects()
        clearGitCache()
        const deduped = dedupeProjectList(raw)
        allProjectsRef.current = deduped
        // Use refs for favorite/hidden paths to avoid stale closures during async loads
        setProjects(
          filterForTab(
            currentTabRef.current,
            deduped,
            favoritePathsRef.current,
            hiddenPathsRef.current
          )
        )
        setScanEpoch((e) => e + 1)
        logActivity('Projects load completed', {
          source,
          rawCount: raw.length,
          dedupedCount: deduped.length
        })
        return deduped
      } catch (err) {
        logActivity('Projects load failed', { source, error: err instanceof Error ? err.message : String(err) })
        console.error(`loadProjects(${source}) failed:`, err)
        return []
      } finally {
        if (source === 'saved') setLoading(false)
        else setBackgroundScanning(false)
      }
    },
    [filterForTab]
  )

  const loadSavedProjects = useCallback(() => loadProjects('saved'), [loadProjects])
  const scanProjects = useCallback(() => loadProjects('scan'), [loadProjects])

  const loadProjectsForTab = useCallback(
    async (tab: TabType): Promise<Project[]> => {
      if (!window.electronAPI) return []
      try {
        logActivity('Projects tab load started', { tab })
        const raw = await window.electronAPI.scanProjects()
        clearGitCache()
        const deduped = dedupeProjectList(raw)
        allProjectsRef.current = deduped
        const filtered = filterForTab(
          tab,
          deduped,
          favoritePathsRef.current,
          hiddenPathsRef.current
        )
        setProjects(filtered)
        setScanEpoch((e) => e + 1)
        logActivity('Projects tab load completed', {
          tab,
          rawCount: raw.length,
          filteredCount: filtered.length
        })
        return filtered
      } catch (err) {
        logActivity('Projects tab load failed', { tab, error: err instanceof Error ? err.message : String(err) })
        console.error('loadProjectsForTab failed:', err)
        return []
      }
    },
    [filterForTab]
  )

  const { handleRefresh, handleLaunch, handleOpenDir, handleAddProject } = useProjectActions({
    currentTab,
    loadProjectsForTab
  })

  // Sync tab state with URL
  // NOTE: favoritePaths intentionally NOT in deps — we use favoritePathsRef to avoid
  // re-running this effect (and wiping the project list) every time a favorite is toggled.
  useEffect(() => {
    const path = location.pathname
    const tab: TabType =
      path === '/projects/favorites' ? 'favorites' : path === '/projects/hidden' ? 'hidden' : 'all'
    logActivity('Projects tab synced from route', { path, tab })
    setCurrentTab(tab)
    currentTabRef.current = tab
    // Only re-filter if we already have data — never wipe the list on a tab switch
    if (allProjectsRef.current.length > 0) {
      setProjects(
        filterForTab(tab, allProjectsRef.current, favoritePathsRef.current, hiddenPathsRef.current)
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, filterForTab])

  // Initial load
  useEffect(() => {
    loadSavedProjects().then(() => scanProjects())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Live size updates
  useEffect(() => {
    if (!window.electronAPI) return
    return window.electronAPI.onSizeCalculated((data) => {
      if (data.type === 'project') {
        setProjects((prev) =>
          prev.map((p) => (p.projectPath === data.path ? { ...p, size: data.size } : p))
        )
      }
    })
  }, [])

  const switchTab = useCallback(
    (tab: TabType): void => {
      logActivity('Projects tab switch requested', { from: currentTab, to: tab })
      // Clear git cache when switching tabs to ensure fresh git status is fetched
      clearGitCache()
      // Pass favorites from ref to avoid reading localStorage inside the utility
      switchTabFn(
        tab,
        currentTab,
        allProjectsRef.current,
        setCurrentTab,
        setProjects,
        hiddenPathsRef.current,
        favoritePathsRef.current
      )
    },
    [switchTabFn, currentTab]
  )

  const toggleFavoritePath = useCallback(
    (projectPath: string): void => {
      logActivity('Project favorite toggled', { projectPath })
      toggleFav(projectPath, (updated) => {
        if (currentTab === 'favorites') {
          setProjects(
            filterForTab('favorites', allProjectsRef.current, updated, hiddenPathsRef.current)
          )
        }
      })
    },
    [toggleFav, currentTab, filterForTab]
  )

  // Hide / unhide a project
  const toggleHiddenPath = useCallback(
    (projectPath: string): void => {
      const current = hiddenPathsRef.current
      const isHidden = current.includes(projectPath)
      logActivity('Project hidden state toggled', { projectPath, nextHidden: !isHidden })
      const updated = isHidden
        ? current.filter((p) => p !== projectPath)
        : [...current, projectPath]

      hiddenPathsRef.current = updated
      setHiddenPaths(updated)
      saveHiddenPaths(updated)

      // Re-filter current view
      setProjects(
        filterForTab(
          currentTabRef.current,
          allProjectsRef.current,
          favoritePathsRef.current,
          updated
        )
      )

      addToast(isHidden ? 'Project restored to list' : 'Project hidden', 'success')
    },
    [filterForTab, addToast]
  )

  const toggleSearch = useCallback((): void => {
    setSearchOpen((prev) => {
      if (prev) setSearchQuery('')
      return !prev
    })
  }, [])

  const handleViewChange = useCallback((mode: ViewMode): void => {
    setViewMode(mode)
    localStorage.setItem('projectsViewMode', mode)
  }, [])

  const handleSortChange = useCallback((config: SortConfig): void => {
    setSortConfig(config)
    localStorage.setItem('projectsSortConfig', JSON.stringify(config))
  }, [])

  const handleAddProjectClick = useCallback(
    () => handleAddProject({ addingProject, setAddingProject }),
    [handleAddProject, addingProject]
  )

  const handleRefreshClick = useCallback(
    () => handleRefresh({ setRefreshing, setCalculatingSizes }),
    [handleRefresh]
  )

  return {
    projects,
    loading,
    currentTab,
    refreshing,
    backgroundScanning,
    calculatingSizes,
    addingProject,
    scanEpoch,
    viewMode,
    sortConfig,
    searchOpen,
    searchQuery,
    displayStart,
    containerRef,
    favoritePaths: stableFavoritePaths,
    hiddenPaths: stableHiddenPaths,
    allProjectsRef,

    switchTab,
    toggleFavoritePath,
    toggleHiddenPath,
    toggleSearch,
    handleViewChange,
    handleSortChange,
    handleAddProjectClick,
    handleRefreshClick,
    handleLaunch,
    handleOpenDir,
    handleListScroll,
    setSearchQuery
  }
}

function normalizeProjectPath(projectPath: string): string {
  return projectPath.replace(/\\/g, '/').toLowerCase()
}

function dedupeProjectList(source: Project[]): Project[] {
  const seen = new Set<string>()
  return source.filter((project) => {
    const rawPath = project.projectPath
    if (!rawPath) return false
    const key = normalizeProjectPath(rawPath)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

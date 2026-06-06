// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useEffect, useState, useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import type { Project, TabType } from '../types'
import { useProjectFavorites } from './useProjectFavorites'
import { useProjectFilters } from './useProjectFilters'
import { useProjectActions } from './useProjectActions'
import { useProjectLoader } from './useProjectLoader'
import { clearGitCache } from './useGitStatus'
import type { ViewMode } from '../components/projects/ProjectsToolbar'
import type { SortConfig } from '../components/projects/projectUtils'
import { useToast } from '../components/ui/ToastContext'
import { logActivity } from '../utils/activityLogger'

const HIDDEN_KEY = 'projectHidden'

function loadHiddenPaths(): string[] {
  try { return JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]') } catch { return [] }
}
function saveHiddenPaths(paths: string[]): void {
  localStorage.setItem(HIDDEN_KEY, JSON.stringify(paths))
}

/* eslint-disable @typescript-eslint/explicit-function-return-type */
export function useProjectsPageState() {
  const location   = useLocation()
  const { addToast } = useToast()

  const [projects,    setProjects]    = useState<Project[]>([])
  const [currentTab,  setCurrentTab]  = useState<TabType>(() => {
    const p = location.pathname
    if (p === '/projects/favorites') return 'favorites'
    if (p === '/projects/hidden')    return 'hidden'
    return 'all'
  })
  const [scanEpoch,   setScanEpoch]   = useState(0)
  const [refreshing,       setRefreshing]       = useState(false)
  const [calculatingSizes, setCalculatingSizes] = useState(false)
  const [addingProject,    setAddingProject]    = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>(() => (localStorage.getItem('projectsViewMode') as ViewMode) ?? 'list')
  const [sortConfig, setSortConfig] = useState<SortConfig>(() => {
    try {
      const saved = localStorage.getItem('projectsSortConfig')
      if (saved) return JSON.parse(saved) as SortConfig
    } catch { /* ignore */ }
    return { key: 'lastOpenedAt', direction: 'desc' }
  })
  const [searchOpen,  setSearchOpen]  = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [displayStart, setDisplayStart] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const { favoritePaths, toggleFavoritePath: toggleFav } = useProjectFavorites()
  const [hiddenPaths, setHiddenPaths] = useState<string[]>(loadHiddenPaths)
  const { filterForTab, switchTab: switchTabFn } = useProjectFilters()

  const allProjectsRef  = useRef<Project[]>([])
  const currentTabRef   = useRef<TabType>(currentTab)
  const hiddenPathsRef  = useRef<string[]>(hiddenPaths)
  const favoritePathsRef = useRef<string[]>(favoritePaths)

  // Keep refs in sync on every render (no useEffect latency)
  currentTabRef.current    = currentTab
  hiddenPathsRef.current   = hiddenPaths
  favoritePathsRef.current = favoritePaths

  const { loading, backgroundScanning, loadProjects, loadProjectsForTab } = useProjectLoader({
    allProjectsRef, currentTabRef, favoritePathsRef, hiddenPathsRef,
    filterForTab, setProjects, setScanEpoch
  })

  const { handleRefresh, handleLaunch, handleOpenDir, handleAddProject } = useProjectActions({
    currentTab, loadProjectsForTab
  })

  // Sync tab ↔ URL
  useEffect(() => {
    const p = location.pathname
    const tab: TabType = p === '/projects/favorites' ? 'favorites' : p === '/projects/hidden' ? 'hidden' : 'all'
    logActivity('Projects tab synced from route', { path: p, tab })
    setCurrentTab(tab)
    currentTabRef.current = tab
    if (allProjectsRef.current.length > 0) {
      setProjects(filterForTab(tab, allProjectsRef.current, favoritePathsRef.current, hiddenPathsRef.current))
    }
  }, [location.pathname, filterForTab])

  // Initial load
  useEffect(() => {
    loadProjects('saved').then(() => loadProjects('scan'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Tab / favorites / hidden mutations ──────────────────────────────────────

  const switchTab = useCallback((tab: TabType): void => {
    logActivity('Projects tab switch requested', { from: currentTab, to: tab })
    clearGitCache()
    switchTabFn(tab, currentTab, allProjectsRef.current, setCurrentTab, setProjects, hiddenPathsRef.current, favoritePathsRef.current)
  }, [switchTabFn, currentTab])

  const toggleFavoritePath = useCallback((projectPath: string): void => {
    logActivity('Project favorite toggled', { projectPath })
    toggleFav(projectPath, (updated) => {
      if (currentTab === 'favorites') {
        setProjects(filterForTab('favorites', allProjectsRef.current, updated, hiddenPathsRef.current))
      }
    })
  }, [toggleFav, currentTab, filterForTab])

  const toggleHiddenPath = useCallback((projectPath: string): void => {
    const current  = hiddenPathsRef.current
    const isHidden = current.includes(projectPath)
    logActivity('Project hidden state toggled', { projectPath, nextHidden: !isHidden })
    const updated  = isHidden ? current.filter((p) => p !== projectPath) : [...current, projectPath]
    hiddenPathsRef.current = updated
    setHiddenPaths(updated)
    saveHiddenPaths(updated)
    setProjects(filterForTab(currentTabRef.current, allProjectsRef.current, favoritePathsRef.current, updated))
    addToast(isHidden ? 'Project restored to list' : 'Project hidden', 'success')
  }, [filterForTab, addToast])

  // ── UI state ─────────────────────────────────────────────────────────────────

  const toggleSearch = useCallback((): void => {
    setSearchOpen((prev) => { if (prev) setSearchQuery(''); return !prev })
  }, [])

  const handleViewChange = useCallback((mode: ViewMode): void => {
    setViewMode(mode); localStorage.setItem('projectsViewMode', mode)
  }, [])

  const handleSortChange = useCallback((config: SortConfig): void => {
    setSortConfig(config); localStorage.setItem('projectsSortConfig', JSON.stringify(config))
  }, [])

  const handleListScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setDisplayStart(Math.max(0, Math.floor(e.currentTarget.scrollTop / 98) - 5))
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
    projects, loading, currentTab,
    refreshing, backgroundScanning, calculatingSizes, addingProject,
    scanEpoch, viewMode, sortConfig,
    searchOpen, searchQuery, displayStart,
    containerRef, favoritePaths, hiddenPaths, allProjectsRef,
    switchTab, toggleFavoritePath, toggleHiddenPath,
    toggleSearch, handleViewChange, handleSortChange,
    handleAddProjectClick, handleRefreshClick,
    handleLaunch, handleOpenDir, handleListScroll,
    setSearchQuery
  }
}

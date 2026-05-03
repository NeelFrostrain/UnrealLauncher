// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useEffect, useState, useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import type { Project, TabType } from '../types'
import { useProjectFavorites } from './useProjectFavorites'
import { useProjectFilters } from './useProjectFilters'
import { useProjectActions } from './useProjectActions'
import { clearGitCache } from './useGitStatus'
import type { ViewMode } from '../components/projects/ProjectsToolbar'

/**
 * Hook to manage all ProjectsPage state
 * Handles projects, tabs, search, view mode, and loading states
 */
export function useProjectsPageState() {
  const location = useLocation()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [currentTab, setCurrentTab] = useState<TabType>(() => {
    const path = location.pathname
    if (path === '/projects/favorites') return 'favorites'
    if (path === '/projects/recent') return 'recent'
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

  const { favoritePaths, toggleFavoritePath: toggleFav } = useProjectFavorites()
  const { filterForTab, switchTab: switchTabFn } = useProjectFilters()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [displayStart, setDisplayStart] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const allProjectsRef = useRef<Project[]>([])
  const currentTabRef = useRef<TabType>(currentTab)

  useEffect(() => {
    currentTabRef.current = currentTab
  }, [currentTab])

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
        const raw =
          source === 'saved'
            ? await window.electronAPI.loadSavedProjects()
            : await window.electronAPI.scanProjects()
        clearGitCache()
        const deduped = dedupeProjectList(raw)
        allProjectsRef.current = deduped
        setProjects(filterForTab(currentTabRef.current, deduped, favoritePaths))
        setScanEpoch((e) => e + 1)
        return deduped
      } catch (err) {
        console.error(`loadProjects(${source}) failed:`, err)
        return []
      } finally {
        if (source === 'saved') setLoading(false)
        else setBackgroundScanning(false)
      }
    },
    [filterForTab, favoritePaths]
  )

  const loadSavedProjects = useCallback(() => loadProjects('saved'), [loadProjects])
  const scanProjects = useCallback(() => loadProjects('scan'), [loadProjects])

  const loadProjectsForTab = useCallback(
    async (tab: TabType): Promise<Project[]> => {
      if (!window.electronAPI) return []
      try {
        const raw = await window.electronAPI.scanProjects()
        clearGitCache()
        const deduped = dedupeProjectList(raw)
        allProjectsRef.current = deduped
        const filtered = filterForTab(tab, deduped, favoritePaths)
        setProjects(filtered)
        setScanEpoch((e) => e + 1)
        return filtered
      } catch (err) {
        console.error('loadProjectsForTab failed:', err)
        return []
      }
    },
    [filterForTab, favoritePaths]
  )

  const { handleRefresh, handleLaunch, handleOpenDir, handleDelete, handleAddProject } =
    useProjectActions({ currentTab, loadProjectsForTab })

  // Sync tab state with URL
  useEffect(() => {
    const path = location.pathname
    const tab: TabType =
      path === '/projects/favorites' ? 'favorites' : path === '/projects/recent' ? 'recent' : 'all'
    setCurrentTab(tab)
    currentTabRef.current = tab
    if (allProjectsRef.current.length > 0) {
      setProjects(filterForTab(tab, allProjectsRef.current, favoritePaths))
    }
  }, [location.pathname, favoritePaths, filterForTab])

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
      switchTabFn(tab, currentTab, allProjectsRef.current, setCurrentTab, setProjects)
    },
    [switchTabFn, currentTab]
  )

  const toggleFavoritePath = useCallback(
    (projectPath: string): void => {
      toggleFav(projectPath, (updated) => {
        if (currentTab === 'favorites') {
          setProjects(filterForTab('favorites', allProjectsRef.current, updated))
        }
      })
    },
    [toggleFav, currentTab, filterForTab]
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

  const handleDeleteCard = useCallback(
    (path: string) => handleDelete(path, setProjects),
    [handleDelete]
  )

  const handleAddProjectClick = useCallback(
    () => handleAddProject({ addingProject, setAddingProject }),
    [handleAddProject, addingProject]
  )

  const handleRefreshClick = useCallback(
    () => handleRefresh({ setRefreshing, setCalculatingSizes }),
    [handleRefresh]
  )

  return {
    // State
    projects,
    loading,
    currentTab,
    refreshing,
    backgroundScanning,
    calculatingSizes,
    addingProject,
    scanEpoch,
    viewMode,
    searchOpen,
    searchQuery,
    displayStart,
    containerRef,
    favoritePaths,
    allProjectsRef,

    // Handlers
    switchTab,
    toggleFavoritePath,
    toggleSearch,
    handleViewChange,
    handleDeleteCard,
    handleAddProjectClick,
    handleRefreshClick,
    handleLaunch,
    handleOpenDir,
    handleListScroll,
    setSearchQuery
  }
}

/**
 * Normalize project path for comparison
 */
function normalizeProjectPath(projectPath: string): string {
  return projectPath.replace(/\\/g, '/').toLowerCase()
}

/**
 * Remove duplicate projects from list
 */
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

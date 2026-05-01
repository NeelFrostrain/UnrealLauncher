// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import PageWrapper from '../layout/PageWrapper'
import ProjectCard from '../components/projects/ProjectCard'
import ProjectCardGrid from '../components/projects/ProjectCardGrid'
import { FolderOpen, Clock, Star } from 'lucide-react'
import ProjectsToolbar from '../components/projects/ProjectsToolbar'
import type { ViewMode } from '../components/projects/ProjectsToolbar'
import type { Project, TabType } from '../types'
import { useProjectFavorites } from '../hooks/useProjectFavorites'
import { useProjectFilters } from '../hooks/useProjectFilters'
import { useProjectActions } from '../hooks/useProjectActions'
import { clearGitCache } from '../hooks/useGitStatus'

// ── Pure helpers — module-level so they are never recreated ──────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

const ProjectsPage = (): React.ReactElement => {
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
  // Incremented after every scan so cards re-fetch git status and bust thumbnail cache
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
  const ITEMS_PER_BATCH = 50

  const allProjectsRef = useRef<Project[]>([])

  // Ref so async callbacks always read the latest tab without stale closure issues
  const currentTabRef = useRef<TabType>(currentTab)
  useEffect(() => {
    currentTabRef.current = currentTab
  }, [currentTab])

  const handleListScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop
    setDisplayStart(Math.max(0, Math.floor(scrollTop / 98) - 5))
  }, [])

  // ── Single unified data loader ─────────────────────────────────────────────
  // `source` controls whether we call loadSavedProjects (fast, no scan) or
  // scanProjects (full scan). Both paths share identical post-processing.
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

  // Thin wrappers kept for call-site compatibility
  const loadSavedProjects = useCallback(() => loadProjects('saved'), [loadProjects])
  const scanProjects = useCallback(() => loadProjects('scan'), [loadProjects])

  // loadProjectsForTab is what useProjectActions calls — always does a full scan
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

  // ── Sync tab state with URL ────────────────────────────────────────────────
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

  // ── Initial load: fast saved data first, then background scan ─────────────
  useEffect(() => {
    loadSavedProjects().then(() => scanProjects())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Live size updates pushed from main process ─────────────────────────────
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

  const visibleProjects = useMemo(
    () =>
      (searchQuery.trim()
        ? projects.filter((p) => p.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
        : projects
      ).map((project) => ({
        ...project,
        isFavorite: project.projectPath ? favoritePaths.includes(project.projectPath) : false
      })),
    [projects, searchQuery, favoritePaths]
  )

  return (
    <PageWrapper>
      <ProjectsToolbar
        tabs={[
          { id: 'all', label: 'All', icon: <FolderOpen size={11} /> },
          { id: 'recent', label: 'Recent', icon: <Clock size={11} /> },
          { id: 'favorites', label: 'Favorites', icon: <Star size={11} /> }
        ]}
        currentTab={currentTab}
        searchOpen={searchOpen}
        searchQuery={searchQuery}
        refreshing={refreshing}
        calculatingSizes={calculatingSizes}
        addingProject={addingProject}
        onTabClick={switchTab}
        onToggleSearch={toggleSearch}
        onSearchChange={setSearchQuery}
        onAddProject={handleAddProjectClick}
        onRefresh={handleRefreshClick}
        backgroundScanning={backgroundScanning}
        viewMode={viewMode}
        onViewChange={handleViewChange}
      />

      <div className="flex-1 overflow-hidden mt-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div
              className="w-5 h-5 rounded-full border-2 animate-spin"
              style={{
                borderColor: 'color-mix(in srgb, var(--color-accent) 25%, transparent)',
                borderTopColor: 'var(--color-accent)'
              }}
            />
          </div>
        ) : visibleProjects.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(200px,1fr))] overflow-y-auto py-2 h-full content-start">
              {visibleProjects.map((data) => (
                <ProjectCardGrid
                  key={data.projectPath || data.name}
                  {...data}
                  isFavorite={data.isFavorite}
                  scanEpoch={scanEpoch}
                  onToggleFavorite={toggleFavoritePath}
                  onLaunch={handleLaunch}
                  onOpenDir={handleOpenDir}
                  onDelete={handleDeleteCard}
                />
              ))}
            </div>
          ) : (
            <div
              ref={containerRef}
              onScroll={handleListScroll}
              className="flex flex-col gap-2 overflow-y-auto py-2 h-full"
            >
              {visibleProjects.slice(displayStart, displayStart + ITEMS_PER_BATCH).map((data) => (
                <ProjectCard
                  key={data.projectPath || data.name}
                  {...data}
                  isFavorite={data.isFavorite}
                  scanEpoch={scanEpoch}
                  onToggleFavorite={toggleFavoritePath}
                  onLaunch={handleLaunch}
                  onOpenDir={handleOpenDir}
                  onDelete={handleDeleteCard}
                />
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-white/50">
            <p className="text-lg mb-2">
              {searchQuery.trim()
                ? 'No projects match your search'
                : currentTab === 'favorites'
                  ? 'No favorite projects'
                  : 'No projects found'}
            </p>
            <p className="text-sm text-white/30 mb-4">
              {searchQuery.trim()
                ? 'Try a different project name or clear the search.'
                : currentTab === 'favorites'
                  ? 'Add projects to favorites from the All Projects tab'
                  : 'Use Add Project to add one manually.'}
            </p>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}

export default ProjectsPage

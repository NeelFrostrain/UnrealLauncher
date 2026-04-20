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
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('projectsViewMode') as ViewMode) ?? 'list'
  })
  const { favoritePaths, toggleFavoritePath: toggleFav } = useProjectFavorites()
  const { filterForTab, switchTab: switchTabFn } = useProjectFilters()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [displayStart, setDisplayStart] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const ITEMS_PER_BATCH = 50

  const allProjectsRef = useRef<Project[]>([])

  const normalizeProjectPath = useCallback((projectPath: string): string => {
    return projectPath.replace(/\\/g, '/').toLowerCase()
  }, [])

  const dedupeProjectList = useCallback(
    (source: Project[]): Project[] => {
      const seen = new Set<string>()
      return source.filter((project) => {
        const rawPath = project.projectPath
        if (!rawPath) return false
        const key = normalizeProjectPath(rawPath)
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    },
    [normalizeProjectPath]
  )

  const handleListScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget
    const scrollTop = container.scrollTop
    const itemHeight = 90 + 8
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 5)
    setDisplayStart(startIndex)
  }, [])

  const loadSavedProjectsForTab = useCallback(
    async (tab: TabType): Promise<Project[]> => {
      if (!window.electronAPI) {
        setLoading(false)
        return []
      }
      try {
        const savedProjects = await window.electronAPI.loadSavedProjects()
        clearGitCache()
        const dedupedProjects = dedupeProjectList(savedProjects)
        allProjectsRef.current = dedupedProjects
        const filtered = filterForTab(tab, dedupedProjects, favoritePaths)
        setProjects(filtered)
        return dedupedProjects
      } catch (err) {
        console.error('Failed to load saved projects for tab:', tab, err)
        return []
      } finally {
        setLoading(false)
      }
    },
    [dedupeProjectList, filterForTab, favoritePaths]
  )

  const scanProjectsInBackground = useCallback(
    async (tab: TabType): Promise<void> => {
      if (!window.electronAPI) return
      setBackgroundScanning(true)
      try {
        const scannedProjects = await window.electronAPI.scanProjects()
        clearGitCache()
        const dedupedProjects = dedupeProjectList(scannedProjects)

        const existingMap = new Map<string, Project>()
        allProjectsRef.current.forEach((project) => {
          if (project.projectPath) {
            existingMap.set(normalizeProjectPath(project.projectPath), project)
          }
        })

        const mergedProjects = [...allProjectsRef.current]
        let addedCount = 0

        for (const project of dedupedProjects) {
          if (!project.projectPath) continue
          const normalized = normalizeProjectPath(project.projectPath)
          const existing = existingMap.get(normalized)
          if (!existing) {
            mergedProjects.push(project)
            existingMap.set(normalized, project)
            addedCount += 1
          } else {
            const updated = { ...existing, ...project }
            const index = mergedProjects.findIndex(
              (p) => p.projectPath && normalizeProjectPath(p.projectPath) === normalized
            )
            if (index !== -1) mergedProjects[index] = updated
          }
        }

        const dedupedMerged = dedupeProjectList(mergedProjects)
        allProjectsRef.current = dedupedMerged
        setProjects(filterForTab(tab, dedupedMerged, favoritePaths))

        if (addedCount > 0) {
          console.info(`Background scan added ${addedCount} new project(s).`)
        }
      } catch (err) {
        console.error('Background project scan failed:', err)
      } finally {
        setBackgroundScanning(false)
      }
    },
    [dedupeProjectList, favoritePaths, filterForTab, normalizeProjectPath]
  )

  const loadProjectsForTab = useCallback(
    async (tab: TabType): Promise<Project[]> => {
      if (!window.electronAPI) {
        setLoading(false)
        return []
      }
      try {
        const scannedProjects = await window.electronAPI.scanProjects()
        clearGitCache()
        const dedupedProjects = dedupeProjectList(scannedProjects)
        allProjectsRef.current = dedupedProjects
        const filtered = filterForTab(tab, dedupedProjects, favoritePaths)
        setProjects(filtered)
        return filtered
      } catch (err) {
        console.error('Failed to load projects for tab:', tab, err)
        return []
      } finally {
        setLoading(false)
      }
    },
    [dedupeProjectList, filterForTab, favoritePaths]
  )

  const { handleRefresh, handleLaunch, handleOpenDir, handleDelete, handleAddProject } =
    useProjectActions({ currentTab, loadProjectsForTab })

  useEffect(() => {
    const path = location.pathname
    let tab: TabType = 'all'
    if (path === '/projects/favorites') tab = 'favorites'
    else if (path === '/projects/recent') tab = 'recent'
    setCurrentTab(tab)
    if (allProjectsRef.current.length > 0) {
      setProjects(filterForTab(tab, allProjectsRef.current, favoritePaths))
    }
  }, [location.pathname, favoritePaths, filterForTab])

  const toggleFavoritePath = (projectPath: string): void => {
    toggleFav(projectPath, (updated) => {
      if (currentTab === 'favorites') {
        setProjects(filterForTab('favorites', allProjectsRef.current, updated))
      }
    })
  }

  useEffect(() => {
    const init = async (): Promise<void> => {
      await loadSavedProjectsForTab('all')
      await scanProjectsInBackground('all')
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (window.electronAPI) {
      const cleanup = window.electronAPI.onSizeCalculated((data) => {
        if (data.type === 'project') {
          setProjects((prev) =>
            prev.map((p) => (p.projectPath === data.path ? { ...p, size: data.size } : p))
          )
        }
      })
      return cleanup
    }
    return () => {}
  }, [])

  const switchTab = (tab: TabType): void => {
    switchTabFn(tab, currentTab, allProjectsRef.current, setCurrentTab, setProjects)
  }

  const toggleSearch = (): void => {
    setSearchOpen((prev) => {
      if (prev) setSearchQuery('')
      return !prev
    })
  }

  const visibleProjects = useMemo(
    () =>
      (searchQuery.trim()
        ? projects.filter((project) =>
            project.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
          )
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
        onSearchChange={(value) => setSearchQuery(value)}
        onAddProject={() => handleAddProject({ addingProject, setAddingProject })}
        onRefresh={() =>
          handleRefresh({
            setRefreshing,
            setCalculatingSizes,
            setProjects: (v) => setProjects(v as Project[])
          })
        }
        backgroundScanning={backgroundScanning}
        viewMode={viewMode}
        onViewChange={(mode) => {
          setViewMode(mode)
          localStorage.setItem('projectsViewMode', mode)
        }}
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
            <div
              ref={gridRef}
              className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(200px,1fr))] overflow-y-auto py-2 h-full content-start"
            >
              {visibleProjects.map((data) => (
                <ProjectCardGrid
                  key={data.projectPath || data.name}
                  {...data}
                  isFavorite={data.isFavorite}
                  onToggleFavorite={toggleFavoritePath}
                  onLaunch={handleLaunch}
                  onOpenDir={handleOpenDir}
                  onDelete={(path) => handleDelete(path, setProjects)}
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
                  onToggleFavorite={toggleFavoritePath}
                  onLaunch={handleLaunch}
                  onOpenDir={handleOpenDir}
                  onDelete={(path) => handleDelete(path, setProjects)}
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

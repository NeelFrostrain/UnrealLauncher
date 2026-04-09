import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import PageWrapper from '../layout/PageWrapper'
import ProjectCard from '../components/projects/ProjectCard'
import ProjectCardGrid from '../components/projects/ProjectCardGrid'
import ProjectsToolbar from '../components/projects/ProjectsToolbar'
import type { ViewMode } from '../components/projects/ProjectsToolbar'
import type { Project, TabType } from '../types'
import { useToast } from '../components/ui/ToastContext'
import { getSetting } from '../utils/settings'

const ProjectsPage = (): React.ReactElement => {
  const location = useLocation()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [, setAllProjects] = useState<Project[]>([])
  const [currentTab, setCurrentTab] = useState<TabType>(() => {
    const path = location.pathname
    if (path === '/projects/favorites') return 'favorites'
    if (path === '/projects/recent') return 'recent'
    return 'all'
  })
  const [refreshing, setRefreshing] = useState(false)
  const [calculatingSizes, setCalculatingSizes] = useState(false)
  const [addingProject, setAddingProject] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('projectsViewMode') as ViewMode) ?? 'list'
  })
  const [favoritePaths, setFavoritePaths] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('projectFavorites') || '[]')
    } catch {
      return []
    }
  })
  const { addToast } = useToast()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [displayStart, setDisplayStart] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const [gridCols, setGridCols] = useState(4)
  const ITEMS_PER_BATCH = 50

  // Compute grid columns based on actual container width, not viewport
  useEffect(() => {
    const el = gridRef.current
    if (!el) return
    const CARD_MIN = 200 // minimum card width in px
    const GAP = 12
    const obs = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width
      const cols = Math.max(1, Math.floor((w + GAP) / (CARD_MIN + GAP)))
      setGridCols(cols)
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [viewMode]) // Number of items to render at once

  const allProjectsRef = useRef<Project[]>([])

  // Handle scroll virtualization for list view
  const handleListScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget
    const scrollTop = container.scrollTop
    const itemHeight = 90 + 8 // Item height + gap (mb-2)
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 5) // 5 items buffer
    setDisplayStart(startIndex)
  }, [])

  useEffect(() => {
    const path = location.pathname
    let tab: TabType = 'all'
    if (path === '/projects/favorites') tab = 'favorites'
    else if (path === '/projects/recent') tab = 'recent'
    setCurrentTab(tab)
    // Load projects for the tab if needed
    if (allProjectsRef.current.length > 0) {
      const favs = getFavoritePaths()
      setProjects(filterForTab(tab, allProjectsRef.current, favs))
    }
  }, [location.pathname])

  const getFavoritePaths = (): string[] => favoritePaths

  const saveFavoritePaths = (paths: string[]): void => {
    setFavoritePaths(paths)
    localStorage.setItem('projectFavorites', JSON.stringify(paths))
  }

  const filterForTab = (tab: TabType, source: Project[], favorites: string[]): Project[] => {
    if (tab === 'recent') {
      return source
        .filter((p) => !!p.lastOpenedAt)
        .sort((a, b) => new Date(b.lastOpenedAt!).getTime() - new Date(a.lastOpenedAt!).getTime())
        .slice(0, 20)
    }
    if (tab === 'favorites') {
      return source.filter((p) => p.projectPath && favorites.includes(p.projectPath))
    }
    return source
  }

  const toggleFavoritePath = (projectPath: string): void => {
    const favorites = getFavoritePaths()
    const updated = favorites.includes(projectPath)
      ? favorites.filter((path) => path !== projectPath)
      : [...favorites, projectPath]
    saveFavoritePaths(updated)

    if (currentTab === 'favorites') {
      setProjects(filterForTab('favorites', allProjectsRef.current, updated))
    }
  }

  const loadProjectsForTab = useCallback(async (tab: TabType): Promise<Project[]> => {
    if (!window.electronAPI) return []
    try {
      const scannedProjects = await window.electronAPI.scanProjects()
      allProjectsRef.current = scannedProjects
      setAllProjects(scannedProjects)
      const favs = JSON.parse(localStorage.getItem('projectFavorites') || '[]') as string[]
      const filtered = filterForTab(tab, scannedProjects, favs)
      setProjects(filtered)
      return filtered
    } catch (err) {
      console.error('Failed to load projects for tab:', tab, err)
      return []
    }
  }, [])

  // Load saved projects on mount
  useEffect(() => {
    loadProjectsForTab('all')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Listen for size updates
  useEffect(() => {
    if (window.electronAPI) {
      const cleanup = window.electronAPI.onSizeCalculated((data) => {
        if (data.type === 'project') {
          // Update current display
          setProjects((prev) =>
            prev.map((p) => (p.projectPath === data.path ? { ...p, size: data.size } : p))
          )
        }
      })
      return cleanup
    }
    return () => {} // No-op cleanup if electronAPI is not available
  }, [])

  const switchTab = (tab: TabType): void => {
    if (currentTab === tab) return
    setCurrentTab(tab)
    const favs = JSON.parse(localStorage.getItem('projectFavorites') || '[]') as string[]
    setProjects(filterForTab(tab, allProjectsRef.current, favs))

    // Navigate to the corresponding route
    if (tab === 'favorites') navigate('/projects/favorites')
    else if (tab === 'recent') navigate('/projects/recent')
    else navigate('/projects/all')
  }

  const handleRefresh = async (): Promise<void> => {
    setRefreshing(true)
    setCalculatingSizes(true)
    setProjects([])
    await loadProjectsForTab(currentTab)
    setRefreshing(false)
    // Calculate sizes for all projects after scan
    await window.electronAPI.calculateAllProjectSizes()
    setCalculatingSizes(false)
  }

  const toggleSearch = (): void => {
    setSearchOpen((prev) => {
      if (prev) setSearchQuery('')
      return !prev
    })
  }

  const handleSearchQueryChange = (value: string): void => {
    setSearchQuery(value)
  }

  const handleLaunch = async (projectPath: string): Promise<void> => {
    if (window.electronAPI) {
      const result = await window.electronAPI.launchProject(projectPath)
      if (!result.success) {
        addToast('Failed to launch project: ' + result.error, 'error')
      } else {
        // Check if auto-close on launch is enabled
        if (getSetting('autoCloseOnLaunch')) {
          // Close the app after successful launch
          setTimeout(() => {
            window.electronAPI?.windowClose()
          }, 1000) // Small delay to ensure the launch process starts
        }
      }
    }
  }

  const handleOpenDir = async (dirPath: string): Promise<void> => {
    if (window.electronAPI) {
      await window.electronAPI.openDirectory(dirPath)
    }
  }

  const handleDelete = async (projectPath: string): Promise<void> => {
    try {
      if (window.electronAPI) {
        const success = await window.electronAPI.deleteProject(projectPath)
        if (!success) {
          addToast('Failed to remove project from storage', 'error')
          return
        }
      }
      setProjects((prev) => prev.filter((p) => p.projectPath !== projectPath))
      const favorites = getFavoritePaths()
      if (favorites.includes(projectPath)) {
        saveFavoritePaths(favorites.filter((path) => path !== projectPath))
        if (currentTab === 'favorites') {
          await loadProjectsForTab('favorites')
        }
      }
      addToast('Project removed from list', 'success')
    } catch (error) {
      console.error('Error deleting project:', error)
      addToast('Failed to remove project', 'error')
    }
  }

  const handleAddProject = async (): Promise<void> => {
    if (!window.electronAPI || addingProject) return

    setAddingProject(true)

    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Folder selection timeout')), 30000) // 30 second timeout
      })

      const selectPromise = window.electronAPI.selectProjectFolder()
      const result = await Promise.race([selectPromise, timeoutPromise])

      if (!result) {
        addToast('No folder was selected', 'info')
        setAddingProject(false)
        return
      }

      const added = result.addedProjects.length
      const duplicates = result.duplicateProjects.length
      // Separate batch-limit messages from real invalid ones
      const batchMsg = result.invalidProjects.find((p) => p.reason.startsWith('Batch limit'))
      const invalid = result.invalidProjects.filter(
        (p) => !p.reason.startsWith('Batch limit')
      ).length

      if (added > 0) {
        addToast(`Added ${added} new project${added === 1 ? '' : 's'}`, 'success')
      }
      if (duplicates > 0) {
        addToast(`${duplicates} already exist${duplicates === 1 ? 's' : ''}`, 'warning')
      }
      if (invalid > 0) {
        addToast(`${invalid} invalid project${invalid === 1 ? '' : 's'} skipped`, 'error')
      }
      if (batchMsg) {
        addToast(`Batch limit: ${batchMsg.reason}`, 'warning')
      }
      if (added === 0 && duplicates === 0 && invalid === 0 && !batchMsg) {
        addToast('No new projects were added', 'info')
      }

      await loadProjectsForTab(currentTab)
    } catch (error) {
      console.error('Error adding projects:', error)
      addToast('Failed to add projects. Please try again.', 'error')
    } finally {
      setAddingProject(false)
    }
  }

  const tabs: Array<{ id: TabType; label: string }> = [
    { id: 'all', label: 'All Projects' },
    { id: 'recent', label: 'Recent' },
    { id: 'favorites', label: 'Favorites' }
  ]

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
        tabs={tabs}
        currentTab={currentTab}
        searchOpen={searchOpen}
        searchQuery={searchQuery}
        refreshing={refreshing}
        calculatingSizes={calculatingSizes}
        addingProject={addingProject}
        onTabClick={switchTab}
        onToggleSearch={toggleSearch}
        onSearchChange={handleSearchQueryChange}
        onAddProject={handleAddProject}
        onRefresh={handleRefresh}
        viewMode={viewMode}
        onViewChange={(mode) => {
          setViewMode(mode)
          localStorage.setItem('projectsViewMode', mode)
        }}
      />

      <div className="flex-1 overflow-hidden mt-1">
        {visibleProjects.length > 0 ? (
          viewMode === 'grid' ? (
            <div
              ref={gridRef}
              className="grid gap-3 overflow-y-auto py-2 px-2 h-full content-start"
              style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
            >
              {visibleProjects.map((data) => (
                <ProjectCardGrid
                  key={data.projectPath || data.name}
                  {...data}
                  isFavorite={data.isFavorite}
                  onToggleFavorite={toggleFavoritePath}
                  onLaunch={handleLaunch}
                  onOpenDir={handleOpenDir}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            // List view - with virtualization-like rendering for performance
            <div
              ref={containerRef}
              onScroll={handleListScroll}
              className="flex flex-col gap-2 overflow-y-auto py-2 px-2 h-full"
            >
              {visibleProjects.slice(displayStart, displayStart + ITEMS_PER_BATCH).map((data) => (
                <ProjectCard
                  key={data.projectPath || data.name}
                  {...data}
                  isFavorite={data.isFavorite}
                  onToggleFavorite={toggleFavoritePath}
                  onLaunch={handleLaunch}
                  onOpenDir={handleOpenDir}
                  onDelete={handleDelete}
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

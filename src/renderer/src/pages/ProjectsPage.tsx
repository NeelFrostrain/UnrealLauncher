import { useEffect, useState, useCallback } from 'react'
import PageWrapper from '../layout/PageWrapper'
import ProjectCard from '../components/ProjectCard'
import ProjectsToolbar from '../components/ProjectsToolbar'
import type { Project, TabType } from '../types'

const ProjectsPage = (): React.ReactElement => {
  const [projects, setProjects] = useState<Project[]>([])
  const [currentTab, setCurrentTab] = useState<TabType>('all')
  const [refreshing, setRefreshing] = useState(false)
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const getFavoritePaths = (): string[] => {
    try {
      return JSON.parse(localStorage.getItem('projectFavorites') || '[]')
    } catch {
      return []
    }
  }

  const saveFavoritePaths = (paths: string[]): void => {
    localStorage.setItem('projectFavorites', JSON.stringify(paths))
  }

  const toggleFavoritePath = (projectPath: string): void => {
    const favorites = getFavoritePaths()
    const updated = favorites.includes(projectPath)
      ? favorites.filter((path) => path !== projectPath)
      : [...favorites, projectPath]
    saveFavoritePaths(updated)

    if (currentTab === 'favorites') {
      void loadProjectsForTab('favorites')
    } else {
      setProjects((prev) =>
        prev.map((project) => (project.projectPath === projectPath ? { ...project } : project))
      )
    }
  }

  // Define loadProjectsForTab first before using it in useEffect
  const loadProjectsForTab = useCallback(async (tab: TabType): Promise<Project[]> => {
    if (!window.electronAPI) return []

    try {
      // Always fetch fresh data from the file system
      const scannedProjects = await window.electronAPI.scanProjects()
      setAllProjects(scannedProjects)

      let filtered = scannedProjects

      // Filter based on tab
      if (tab === 'recent') {
        // Sort by creation date, most recent first
        filtered = scannedProjects
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 20) // Limit to 20 most recent
      } else if (tab === 'favorites') {
        const favorites = getFavoritePaths()
        filtered = scannedProjects.filter((p) => favorites.includes(p.projectPath))
      }
      // 'all' tab shows all projects (no filtering)

      // Set current display
      setProjects(filtered)

      // Calculate sizes for projects with estimates
      for (const project of filtered) {
        if (project.projectPath && project.size.startsWith('~')) {
          window.electronAPI.calculateProjectSize(project.projectPath).then((result) => {
            if (result.success && result.size) {
              setProjects((prev) =>
                prev.map((p) =>
                  p.projectPath === project.projectPath ? { ...p, size: result.size! } : p
                )
              )
            }
          })
        }
      }

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
      window.electronAPI.onSizeCalculated((data) => {
        if (data.type === 'project') {
          // Update current display
          setProjects((prev) =>
            prev.map((p) => (p.projectPath === data.path ? { ...p, size: data.size } : p))
          )
          // Update all projects list
          setAllProjects((prev) =>
            prev.map((p) => (p.projectPath === data.path ? { ...p, size: data.size } : p))
          )
        }
      })
    }
  }, [])

  // Switch tab and load fresh data
  const switchTab = async (tab: TabType): Promise<void> => {
    if (currentTab === tab) return // Already on this tab

    setCurrentTab(tab)
    setProjects([]) // Clear current display

    // Load data for the new tab
    await loadProjectsForTab(tab)
  }

  const handleRefresh = async (): Promise<void> => {
    setRefreshing(true)
    setProjects([])
    await loadProjectsForTab(currentTab)
    setRefreshing(false)
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
        alert('Failed to launch project: ' + result.error)
      }
    }
  }

  const handleOpenDir = async (dirPath: string): Promise<void> => {
    if (window.electronAPI) {
      await window.electronAPI.openDirectory(dirPath)
    }
  }

  const handleDelete = async (projectPath: string): Promise<void> => {
    if (confirm('Remove this project from the list? (Files will not be deleted)')) {
      setProjects((prev) => prev.filter((p) => p.projectPath !== projectPath))
      setAllProjects((prev) => prev.filter((p) => p.projectPath !== projectPath))
      const favorites = getFavoritePaths()
      if (favorites.includes(projectPath)) {
        saveFavoritePaths(favorites.filter((path) => path !== projectPath))
      }
      if (window.electronAPI) {
        await window.electronAPI.deleteProject(projectPath)
      }
      if (currentTab === 'favorites') {
        await loadProjectsForTab('favorites')
      }
    }
  }

  const handleAddProject = async (): Promise<void> => {
    if (!window.electronAPI) return
    const project = await window.electronAPI.selectProjectFolder()
    if (!project) {
      alert('Project already exists or no valid Unreal project folder found.')
      return
    }
    // Check if already in UI state
    if (allProjects.find((p) => p.projectPath === project.projectPath)) {
      alert('This project is already added.')
      return
    }
    setProjects((prev) => [project, ...prev])
    setAllProjects((prev) => [project, ...prev])

    // Calculate size for the new project if it has an estimate
    if (project.projectPath && project.size.startsWith('~')) {
      window.electronAPI.calculateProjectSize(project.projectPath).then((result) => {
        if (result.success && result.size) {
          setProjects((prev) =>
            prev.map((p) =>
              p.projectPath === project.projectPath ? { ...p, size: result.size! } : p
            )
          )
        }
      })
    }
  }

  const tabs: Array<{ id: TabType; label: string }> = [
    { id: 'all', label: 'All Projects' },
    { id: 'recent', label: 'Recent' },
    { id: 'favorites', label: 'Favorites' }
  ]

  const favoritePaths = getFavoritePaths()

  const visibleProjects = (
    searchQuery.trim()
      ? projects.filter((project) =>
          project.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
        )
      : projects
  ).map((project) => ({
    ...project,
    isFavorite: project.projectPath ? favoritePaths.includes(project.projectPath) : false
  }))

  return (
    <PageWrapper>
      <ProjectsToolbar
        tabs={tabs}
        currentTab={currentTab}
        searchOpen={searchOpen}
        searchQuery={searchQuery}
        refreshing={refreshing}
        onTabClick={switchTab}
        onToggleSearch={toggleSearch}
        onSearchChange={handleSearchQueryChange}
        onAddProject={handleAddProject}
        onRefresh={handleRefresh}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 overflow-y-auto py-px px-2 mt-2">
        {visibleProjects.length > 0 ? (
          visibleProjects.map((data, index) => (
            <ProjectCard
              key={`${data.projectPath}-${index}`}
              {...data}
              isFavorite={data.isFavorite}
              onToggleFavorite={toggleFavoritePath}
              onLaunch={handleLaunch}
              onOpenDir={handleOpenDir}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center h-full text-center text-white/50">
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

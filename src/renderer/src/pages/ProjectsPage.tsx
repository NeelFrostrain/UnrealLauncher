import { useEffect, useState, useCallback, useMemo } from 'react'
import PageWrapper from '../layout/PageWrapper'
import ProjectCard from '../components/ProjectCard'
import ProjectsToolbar from '../components/ProjectsToolbar'
import type { Project, TabType } from '../types'
import { useToast } from '../components/ToastContext'
import { getSetting } from '../utils/settings'

const ProjectsPage = (): React.ReactElement => {
  const [projects, setProjects] = useState<Project[]>([])
  const [currentTab, setCurrentTab] = useState<TabType>('all')
  const [refreshing, setRefreshing] = useState(false)
  const [addingProject, setAddingProject] = useState(false)
  const { addToast } = useToast()
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
      let filtered = scannedProjects

      // Filter based on tab
      if (tab === 'recent') {
        // Sort by creation date, most recent first
        filtered = scannedProjects
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 20) // Limit to 20 most recent
      } else if (tab === 'favorites') {
        const favorites = getFavoritePaths()
        filtered = scannedProjects.filter((p) => p.projectPath && favorites.includes(p.projectPath))
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
    if (confirm('Remove this project from the list? (Files will not be deleted)')) {
      try {
        // First try to delete from backend
        if (window.electronAPI) {
          const success = await window.electronAPI.deleteProject(projectPath)
          if (!success) {
            addToast('Failed to remove project from storage', 'error')
            return
          }
        }

        // Update local state only after successful backend deletion
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
      const invalid = result.invalidProjects.length

      if (added > 0) {
        addToast(`Added ${added} new project${added === 1 ? '' : 's'}`, 'success')
      }
      if (duplicates > 0) {
        addToast(
          `${duplicates} project${duplicates === 1 ? '' : 's'} already exist${duplicates === 1 ? 's' : ''}`,
          'warning'
        )
      }
      if (invalid > 0) {
        addToast(`${invalid} invalid project${invalid === 1 ? '' : 's'} found`, 'error')
      }
      if (added === 0 && duplicates === 0 && invalid === 0) {
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

  const favoritePaths = getFavoritePaths()

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
        addingProject={addingProject}
        onTabClick={switchTab}
        onToggleSearch={toggleSearch}
        onSearchChange={handleSearchQueryChange}
        onAddProject={handleAddProject}
        onRefresh={handleRefresh}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 overflow-y-auto py-px px-2 mt-2">
        {visibleProjects.length > 0 ? (
          visibleProjects.map((data) => (
            <ProjectCard
              key={data.projectPath || data.name}
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

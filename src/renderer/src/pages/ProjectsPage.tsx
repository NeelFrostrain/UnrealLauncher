import type { FC, ReactNode } from 'react'
import { useEffect, useState, useCallback } from 'react'
import PageWrapper from '../layout/PageWrapper'
import PageTitleBar from '../components/PageTitlebar'
import type { Project } from '../types'
import { FolderOpen, Play, Trash2, RefreshCw } from 'lucide-react'

const baseUrl = import.meta.env.BASE_URL || './'

type TabType = 'all' | 'recent' | 'favorites'

const resolveAsset = (path?: string): string => {
  if (!path) return `${baseUrl}assets/ProjectDefault.avif`
  // If it's an absolute file path (local screenshot), convert to file:// URL
  if (path.includes(':\\') || (path.includes('/') && !path.startsWith('http'))) {
    // Normalize path separators and ensure proper file:// format
    const normalizedPath = path.replace(/\\/g, '/')
    return `file:///${normalizedPath}`
  }
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('file:')) return path
  return `${baseUrl}${path.replace(/^\//, '')}`
}

const ProjectCardButton = ({
  icon,
  onClick,
  title
}: {
  icon: ReactNode
  onClick?: () => void
  title?: string
}): React.ReactElement => {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-2 rounded-md bg-[#121212] border border-white/10 hover:border-blue-600/40 hover:text-blue-600/70 flex justify-center cursor-pointer items-center text-white transition-colors shadow-lg shadow-blue-900/20"
    >
      {icon}
    </button>
  )
}

const ProjectCard: FC<
  Project & {
    onLaunch: (projectPath: string) => void
    onOpenDir: (dirPath: string) => void
    onDelete: (projectPath: string) => void
  }
> = ({
  createdAt,
  name,
  size,
  version,
  thumbnail,
  projectPath,
  onLaunch,
  onOpenDir,
  onDelete
}): React.ReactElement => {
  const [launching, setLaunching] = useState(false)
  const [currentSize, setCurrentSize] = useState(size)
  const [imageSrc, setImageSrc] = useState<string>(resolveAsset(undefined))

  useEffect(() => {
    const loadThumbnail = async (): Promise<void> => {
      if (thumbnail && window.electronAPI) {
        const dataUrl = await window.electronAPI.loadImage(thumbnail)
        if (dataUrl) {
          setImageSrc(dataUrl)
        } else {
          setImageSrc(resolveAsset(undefined))
        }
      } else {
        setImageSrc(resolveAsset(undefined))
      }
    }
    loadThumbnail()
  }, [thumbnail])

  useEffect(() => {
    setCurrentSize(size)
  }, [size])

  const handleLaunch = async (): Promise<void> => {
    if (!projectPath) return
    setLaunching(true)
    await onLaunch(projectPath)
    setTimeout(() => setLaunching(false), 3000)
  }

  return (
    <div className="w-full h-52 bg-[#121212] rounded-md border border-white/10 cursor-pointer overflow-hidden hover:border-blue-500/50 hover:bg-[#1a1a1a] transition-all duration-200 ease-in-out group relative">
      {/* Launching Overlay */}
      {launching && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-white/90 font-medium">Launching...</p>
          </div>
        </div>
      )}

      {/* Hover Overlay Buttons */}
      <div className="absolute inset-0 z-20 flex items-center justify-center gap-4 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <ProjectCardButton
          icon={<Play size={16} />}
          onClick={handleLaunch}
          title="Launch Project"
        />
        <ProjectCardButton
          icon={<FolderOpen size={16} />}
          onClick={() => projectPath && onOpenDir(projectPath)}
          title="Open Directory"
        />
        <ProjectCardButton
          icon={<Trash2 size={16} />}
          onClick={() => projectPath && onDelete(projectPath)}
          title="Remove from list"
        />
      </div>

      {/* Thumbnail Section */}
      <div className="w-full h-28 relative overflow-hidden">
        <img
          src={imageSrc}
          alt={name}
          className="w-full h-full object-cover opacity-100 group-hover:opacity-40 transition-opacity"
          onError={(e) => {
            e.currentTarget.src = resolveAsset(undefined)
          }}
        />
        <img
          src={resolveAsset(thumbnail)}
          alt={name}
          className="w-full h-full object-cover opacity-100 group-hover:opacity-40 transition-opacity"
          onError={(e) => {
            e.currentTarget.src = resolveAsset(undefined)
          }}
        />
        <div className="absolute top-2 right-2 z-10 bg-black/60 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded text-xs font-mono text-blue-500">
          {version}
        </div>
      </div>

      {/* Accent Divider */}
      <div className="w-full h-0.5 bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]"></div>

      {/* Info Section */}
      <div className="w-full p-3 flex flex-col justify-between h-[calc(100%-114px)]">
        <p
          className="text-sm font-semibold truncate text-gray-200 uppercase tracking-wider"
          title={name}
        >
          {name}
        </p>

        <div className="flex justify-between items-center mt-auto">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 uppercase font-bold">Created</span>
            <span className="text-xs text-gray-400">{createdAt}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-gray-500 uppercase font-bold">Size</span>
            <span className="text-xs text-gray-400 font-mono">{currentSize}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const ProjectsPage = (): React.ReactElement => {
  const [projects, setProjects] = useState<Project[]>([])
  const [scanning, setScanning] = useState(false)
  const [currentTab, setCurrentTab] = useState<TabType>('all')
  const [refreshing, setRefreshing] = useState(false)
  const [allProjects, setAllProjects] = useState<Project[]>([])

  // Define loadProjectsForTab first before using it in useEffect
  const loadProjectsForTab = useCallback(async (tab: TabType): Promise<void> => {
    if (!window.electronAPI) return

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
        // Filter by favorites (you can implement via localStorage or backend)
        filtered = scannedProjects.filter((p) => {
          const favorites = JSON.parse(localStorage.getItem('projectFavorites') || '[]')
          return favorites.includes(p.projectPath)
        })
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
    } catch (err) {
      console.error('Failed to load projects for tab:', tab, err)
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
    // Clear current display
    setProjects([])

    // Reload fresh data
    await loadProjectsForTab(currentTab)
    setRefreshing(false)
  }

  const handleScan = async (): Promise<void> => {
    setScanning(true)
    if (window.electronAPI) {
      try {
        const scannedProjects = await window.electronAPI.scanProjects()
        setAllProjects(scannedProjects)
        setProjects(scannedProjects)

        // Calculate sizes for all projects with estimates
        for (const project of scannedProjects) {
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
      } catch (err) {
        console.error('Failed to scan projects:', err)
      }
    }
    setScanning(false)
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
      if (window.electronAPI) {
        await window.electronAPI.deleteProject(projectPath)
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

  return (
    <PageWrapper>
      <PageTitleBar
        title="Projects"
        description="Your Unreal project list"
        showScanButton
        showAddButton
        scanButtonText="Scan for Projects"
        addButtonText="Add Project"
        onScan={handleScan}
        onAdd={handleAddProject}
        scanning={scanning}
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 px-2 pt-3 pb-2 border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            className={`px-4 py-2 rounded-t-md font-medium text-sm transition-all ${
              currentTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-md bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all disabled:opacity-50"
          title="Refresh projects for this tab"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 overflow-y-auto py-px px-2 mt-2">
        {projects.length > 0 ? (
          projects.map((data, index) => (
            <ProjectCard
              key={`${data.projectPath}-${index}`}
              {...data}
              onLaunch={handleLaunch}
              onOpenDir={handleOpenDir}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center h-full text-center text-white/50">
            <p className="text-lg mb-2">
              {currentTab === 'favorites' ? 'No favorite projects' : 'No projects found'}
            </p>
            <p className="text-sm text-white/30 mb-4">
              {currentTab === 'favorites'
                ? 'Add projects to favorites from the All Projects tab'
                : 'Click &quot;Scan for Projects&quot; to search or add manually'}
            </p>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}

export default ProjectsPage

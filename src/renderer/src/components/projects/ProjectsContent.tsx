// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useMemo } from 'react'
import ProjectCard from './ProjectCard'
import ProjectCardGrid from './ProjectCardGrid'
import type { Project, TabType } from '../../types'
import type { ViewMode } from './ProjectsToolbar'
import type { SortConfig } from './projectUtils'
import { sortProjects } from './projectUtils'

export interface ProjectsContentProps {
  projects: Project[]
  loading: boolean
  currentTab: TabType
  searchQuery: string
  viewMode: ViewMode
  sortConfig: SortConfig
  favoritePaths: string[]
  hiddenPaths: string[]
  displayStart: number
  containerRef: React.RefObject<HTMLDivElement | null>
  onToggleFavorite: (path: string) => void
  onHide: (path: string) => void
  onLaunch: (path: string) => void
  onOpenDir: (path: string) => void
  onListScroll: (e: React.UIEvent<HTMLDivElement>) => void
}

type ProjectWithFlags = Project & { isFavorite: boolean; isHidden: boolean }

const ITEMS_PER_BATCH = 50

export const ProjectsContent = ({
  projects,
  loading,
  currentTab,
  searchQuery,
  viewMode,
  sortConfig,
  favoritePaths,
  hiddenPaths,
  displayStart,
  containerRef,
  onToggleFavorite,
  onHide,
  onLaunch,
  onOpenDir,
  onListScroll
}: ProjectsContentProps): React.ReactElement => {
  // Hoist processed search query to avoid per-project computation on each keystroke
  const q = searchQuery.trim().toLowerCase()

  const visibleProjects = useMemo((): ProjectWithFlags[] => {
    const filtered = (q ? projects.filter((p) => p.name.toLowerCase().includes(q)) : projects).map(
      (project): ProjectWithFlags => ({
        ...project,
        isFavorite: project.projectPath ? favoritePaths.includes(project.projectPath) : false,
        isHidden: project.projectPath ? hiddenPaths.includes(project.projectPath) : false
      })
    )
    return sortProjects(filtered, sortConfig) as ProjectWithFlags[]
  }, [projects, q, favoritePaths, hiddenPaths, sortConfig])

  // Stabilize handlers — pass props directly, no identity wrapper needed
  // (onLaunch/onOpenDir are already stable useCallback refs from the parent)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div
          className="w-5 h-5 rounded-full border-2 animate-spin"
          style={{
            borderColor: 'color-mix(in srgb, var(--color-accent) 25%, transparent)',
            borderTopColor: 'var(--color-accent)'
          }}
        />
      </div>
    )
  }

  if (visibleProjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <p className="text-lg mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          {searchQuery.trim()
            ? 'No projects match your search'
            : currentTab === 'favorites'
              ? 'No favorite projects'
              : currentTab === 'hidden'
                ? 'No hidden projects'
                : 'No projects found'}
        </p>
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
          {searchQuery.trim()
            ? 'Try a different project name or clear the search.'
            : currentTab === 'favorites'
              ? 'Add projects to favorites from the All Projects tab'
              : currentTab === 'hidden'
                ? 'Hide projects using the context menu or the hide button on each card'
                : 'Use Add Project to add one manually.'}
        </p>
      </div>
    )
  }

  if (viewMode === 'grid') {
    // Filter out entries missing a projectPath and pass a per-project thumbnailKey so only changed cards re-render
    return (
      <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(200px,1fr))] overflow-y-auto py-2 h-full content-start">
        {visibleProjects
          .filter((p) => !!p.projectPath)
          .map((data, idx) => (
            <ProjectCardGrid
              key={data.projectPath}
              {...data}
              index={idx}
              isFavorite={data.isFavorite}
              isHidden={data.isHidden}
              thumbnailKey={`${data.projectPath}:${data.thumbnail}`}
              onToggleFavorite={onToggleFavorite}
              onHide={onHide}
              onLaunch={onLaunch}
              onOpenDir={onOpenDir}
            />
          ))}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      onScroll={onListScroll}
      className="flex flex-col gap-2 overflow-y-auto py-2 h-full"
    >
      {visibleProjects
        .slice(displayStart, displayStart + ITEMS_PER_BATCH)
        .filter((p) => !!p.projectPath)
        .map((data, idx) => (
          <ProjectCard
            key={data.projectPath}
            {...data}
            index={displayStart + idx}
            isFavorite={data.isFavorite}
            isHidden={data.isHidden}
            thumbnailKey={`${data.projectPath}:${data.thumbnail}`}
            onToggleFavorite={onToggleFavorite}
            onHide={onHide}
            onLaunch={onLaunch}
            onOpenDir={onOpenDir}
          />
        ))}
    </div>
  )
}

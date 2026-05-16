// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
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
  scanEpoch: number
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
  scanEpoch,
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
  const visibleProjects = useMemo((): ProjectWithFlags[] => {
    const filtered = (
      searchQuery.trim()
        ? projects.filter((p) => p.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
        : projects
    ).map((project): ProjectWithFlags => ({
      ...project,
      isFavorite: project.projectPath ? favoritePaths.includes(project.projectPath) : false,
      isHidden: project.projectPath ? hiddenPaths.includes(project.projectPath) : false
    }))
    return sortProjects(filtered, sortConfig) as ProjectWithFlags[]
  }, [projects, searchQuery, favoritePaths, hiddenPaths, sortConfig])

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
      <div className="flex flex-col items-center justify-center h-full text-center text-white/50">
        <p className="text-lg mb-2">
          {searchQuery.trim()
            ? 'No projects match your search'
            : currentTab === 'favorites'
              ? 'No favorite projects'
              : currentTab === 'hidden'
                ? 'No hidden projects'
                : 'No projects found'}
        </p>
        <p className="text-sm text-white/30 mb-4">
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
    return (
      <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(200px,1fr))] overflow-y-auto py-2 h-full content-start">
        {visibleProjects.map((data) => (
          <ProjectCardGrid
            key={data.projectPath || data.name}
            {...data}
            isFavorite={data.isFavorite}
            isHidden={data.isHidden}
            scanEpoch={scanEpoch}
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
      {visibleProjects.slice(displayStart, displayStart + ITEMS_PER_BATCH).map((data) => (
        <ProjectCard
          key={data.projectPath || data.name}
          {...data}
          isFavorite={data.isFavorite}
          isHidden={data.isHidden}
          scanEpoch={scanEpoch}
          onToggleFavorite={onToggleFavorite}
          onHide={onHide}
          onLaunch={onLaunch}
          onOpenDir={onOpenDir}
        />
      ))}
    </div>
  )
}

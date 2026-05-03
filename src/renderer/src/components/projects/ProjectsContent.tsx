// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useMemo } from 'react'
import ProjectCard from './ProjectCard'
import ProjectCardGrid from './ProjectCardGrid'
import type { Project, TabType } from '../../types'
import type { ViewMode } from './ProjectsToolbar'

export interface ProjectsContentProps {
  projects: Project[]
  loading: boolean
  currentTab: TabType
  searchQuery: string
  viewMode: ViewMode
  scanEpoch: number
  favoritePaths: string[]
  displayStart: number
  containerRef: React.RefObject<HTMLDivElement>
  onToggleFavorite: (path: string) => void
  onLaunch: (project: Project) => void
  onOpenDir: (project: Project) => void
  onDelete: (path: string) => void
  onListScroll: (e: React.UIEvent<HTMLDivElement>) => void
}

const ITEMS_PER_BATCH = 50

export const ProjectsContent = ({
  projects,
  loading,
  currentTab,
  searchQuery,
  viewMode,
  scanEpoch,
  favoritePaths,
  displayStart,
  containerRef,
  onToggleFavorite,
  onLaunch,
  onOpenDir,
  onDelete,
  onListScroll
}: ProjectsContentProps): React.ReactElement => {
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
            scanEpoch={scanEpoch}
            onToggleFavorite={onToggleFavorite}
            onLaunch={onLaunch}
            onOpenDir={onOpenDir}
            onDelete={onDelete}
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
          scanEpoch={scanEpoch}
          onToggleFavorite={onToggleFavorite}
          onLaunch={onLaunch}
          onOpenDir={onOpenDir}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

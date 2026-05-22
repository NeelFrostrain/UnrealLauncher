// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useMemo, useCallback } from 'react'
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

  // Stabilize handlers so child memo'd cards don't receive new function refs each render
  const stableLaunch = useCallback((p: string) => onLaunch(p), [onLaunch])
  const stableOpenDir = useCallback((p: string) => onOpenDir(p), [onOpenDir])

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
              onLaunch={stableLaunch}
              onOpenDir={stableOpenDir}
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
            // Use projectPath as stable, unique key
            key={data.projectPath}
            {...data}
            index={displayStart + idx}
            isFavorite={data.isFavorite}
            isHidden={data.isHidden}
            thumbnailKey={`${data.projectPath}:${data.thumbnail}`}
            onToggleFavorite={onToggleFavorite}
            onHide={onHide}
            onLaunch={stableLaunch}
            onOpenDir={stableOpenDir}
          />
        ))}
    </div>
  )
}

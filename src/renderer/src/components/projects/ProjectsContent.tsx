// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { memo, useMemo, useState, useRef, useEffect, useCallback } from 'react'
import ProjectCard from './ProjectCard'
import { VirtualizedProjectGrid } from './VirtualizedProjectGrid'
import type { Project, TabType } from '../../types'
import type { ViewMode } from './ProjectsToolbar'
import type { SortConfig } from './projectUtils'
import {
  filterProjectsByEngineVersion,
  sortProjects,
  type EngineVersionFilter
} from './projectUtils'

export interface ProjectsContentProps {
  projects: Project[]
  loading: boolean
  currentTab: TabType
  searchQuery: string
  viewMode: ViewMode
  sortConfig: SortConfig
  favoritePaths: string[]
  hiddenPaths: string[]
  // These props are kept for API compatibility but unused — list is self-contained
  displayStart: number
  containerRef: React.RefObject<HTMLDivElement | null>
  onToggleFavorite: (path: string) => void
  onHide: (path: string) => void
  onLaunch: (path: string) => void
  onOpenDir: (path: string) => void
  onListScroll: (e: React.UIEvent<HTMLDivElement>) => void
  engineVersionFilter: EngineVersionFilter
}

type ProjectWithFlags = Project & { isFavorite: boolean; isHidden: boolean }

// List card height in px — must match what ProjectCard renders
const LIST_ITEM_HEIGHT = 88 // px (64px thumb + 2×12px padding)
const LIST_GAP = 8 // gap-2
const ROW_HEIGHT = LIST_ITEM_HEIGHT + LIST_GAP
const BUFFER_ROWS = 4

/**
 * Virtualised list renderer — same absolute-position approach as VirtualizedProjectGrid.
 * Only renders cards that are within the visible viewport + BUFFER_ROWS rows above/below.
 */
const VirtualizedList = memo(function VirtualizedList({
  items,
  onToggleFavorite,
  onHide,
  onLaunch,
  onOpenDir
}: {
  items: ProjectWithFlags[]
  onToggleFavorite: (path: string) => void
  onHide: (path: string) => void
  onLaunch: (path: string) => void
  onOpenDir: (path: string) => void
}): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(800)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    setContainerHeight(el.clientHeight)
    const ro = new ResizeObserver(() => setContainerHeight(el.clientHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const top = (e.currentTarget as HTMLDivElement).scrollTop
    if (rafRef.current !== null) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      setScrollTop(top)
    })
  }, [])

  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    },
    []
  )

  const firstVisible = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_ROWS)
  const lastVisible = Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + BUFFER_ROWS
  const totalHeight = items.length * ROW_HEIGHT - LIST_GAP // no trailing gap

  const visibleRows: React.ReactElement[] = []
  for (let i = firstVisible; i < Math.min(lastVisible, items.length); i++) {
    const data = items[i]
    if (!data?.projectPath) continue
    visibleRows.push(
      <div
        key={data.projectPath}
        style={{
          position: 'absolute',
          top: i * ROW_HEIGHT,
          left: 0,
          right: 0,
          height: LIST_ITEM_HEIGHT
        }}
      >
        <ProjectCard
          {...data}
          isFavorite={data.isFavorite}
          isHidden={data.isHidden}
          thumbnailKey={`${data.projectPath}:${data.thumbnail}`}
          onToggleFavorite={onToggleFavorite}
          onHide={onHide}
          onLaunch={onLaunch}
          onOpenDir={onOpenDir}
        />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="relative overflow-y-auto h-full py-1"
    >
      <div style={{ position: 'relative', width: '100%', height: totalHeight }}>{visibleRows}</div>
    </div>
  )
})

export const ProjectsContent = memo(function ProjectsContent({
  projects,
  loading,
  currentTab,
  searchQuery,
  viewMode,
  sortConfig,
  favoritePaths,
  hiddenPaths,
  onToggleFavorite,
  onHide,
  onLaunch,
  onOpenDir,
  engineVersionFilter
}: ProjectsContentProps): React.ReactElement {
  const q = searchQuery.trim().toLowerCase()

  const visibleProjects = useMemo((): ProjectWithFlags[] => {
    const favoriteSet = new Set(favoritePaths)
    const hiddenSet = new Set(hiddenPaths)
    const filtered = (q ? projects.filter((p) => p.name.toLowerCase().includes(q)) : projects).map(
      (project): ProjectWithFlags => ({
        ...project,
        isFavorite: project.projectPath ? favoriteSet.has(project.projectPath) : false,
        isHidden: project.projectPath ? hiddenSet.has(project.projectPath) : false
      })
    )
    return sortProjects(
      filterProjectsByEngineVersion(filtered, engineVersionFilter),
      sortConfig
    ) as ProjectWithFlags[]
  }, [projects, q, favoritePaths, hiddenPaths, sortConfig, engineVersionFilter])

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
                : currentTab === 'recent'
                  ? 'No recently opened projects'
                  : 'No projects found'}
        </p>
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
          {searchQuery.trim()
            ? 'Try a different project name or clear the search.'
            : currentTab === 'favorites'
              ? 'Add projects to favorites from the All Projects tab'
              : currentTab === 'hidden'
                ? 'Hide projects using the context menu or the hide button on each card'
                : currentTab === 'recent'
                  ? 'Open a project at least once to see it here'
                  : 'Use Add Project to add one manually.'}
        </p>
      </div>
    )
  }

  if (viewMode === 'grid') {
    return (
      <VirtualizedProjectGrid
        items={visibleProjects.filter((p) => !!p.projectPath)}
        onToggleFavorite={onToggleFavorite}
        onHide={onHide}
        onLaunch={onLaunch}
        onOpenDir={onOpenDir}
      />
    )
  }

  return (
    <VirtualizedList
      items={visibleProjects.filter((p) => !!p.projectPath)}
      onToggleFavorite={onToggleFavorite}
      onHide={onHide}
      onLaunch={onLaunch}
      onOpenDir={onOpenDir}
    />
  )
})

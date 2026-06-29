// Copyright (c) 2026 NeelFrostrain. All rights reserved.

import { useEffect, useRef } from 'react'
import { FolderOpen, EyeOff, Star } from 'lucide-react'
import PageWrapper from '../layout/PageWrapper'
import ProjectsToolbar from '../components/projects/ProjectsToolbar'
import { ProjectsContent } from '../components/projects/ProjectsContent'
import { RunningProjectsBanner } from '../components/projects/RunningProjectsBanner'
import { useProjectsPageState } from '../hooks/useProjectsPageState'
import { useGlobalShortcuts } from '../hooks/useGlobalShortcuts'

const ProjectsPage = (): React.ReactElement => {
  const state = useProjectsPageState()

  useGlobalShortcuts({
    onFocusSearch: () => {
      if (!state.searchOpen) state.toggleSearch()
    },
    onRefresh: state.handleRefreshClick,
    onNew: state.handleAddProjectClick
  })

  // Keep a ref to searchOpen so the palette-action handler never has a stale closure
  const searchOpenRef = useRef(state.searchOpen)
  searchOpenRef.current = state.searchOpen

  // Receive action commands dispatched from the mini palette window.
  // Deps are the three stable useCallback refs — avoids re-registration on every render.
  useEffect(() => {
    const handler = (e: Event): void => {
      const { commandId } = (e as CustomEvent<{ commandId: string }>).detail
      if (commandId === 'action-refresh') state.handleRefreshClick()
      else if (commandId === 'action-add-project') state.handleAddProjectClick()
      else if (commandId === 'action-search-projects' && !searchOpenRef.current)
        state.toggleSearch()
    }
    window.addEventListener('palette-action', handler)
    return () => window.removeEventListener('palette-action', handler)
  }, [state.handleRefreshClick, state.handleAddProjectClick, state.toggleSearch])

  return (
    <PageWrapper>
      <ProjectsToolbar
        tabs={[
          { id: 'all', label: 'All', icon: <FolderOpen size={11} /> },
          { id: 'favorites', label: 'Favorites', icon: <Star size={11} /> },
          { id: 'hidden', label: 'Hidden', icon: <EyeOff size={11} /> }
        ]}
        currentTab={state.currentTab}
        searchOpen={state.searchOpen}
        searchQuery={state.searchQuery}
        refreshing={state.refreshing}
        calculatingSizes={state.calculatingSizes}
        addingProject={state.addingProject}
        onTabClick={state.switchTab}
        onToggleSearch={state.toggleSearch}
        onSearchChange={state.setSearchQuery}
        onAddProject={state.handleAddProjectClick}
        onRefresh={state.handleRefreshClick}
        backgroundScanning={state.backgroundScanning}
        viewMode={state.viewMode}
        onViewChange={state.handleViewChange}
        sortConfig={state.sortConfig}
        onSortChange={state.handleSortChange}
      />

      <div className="flex-1 overflow-hidden mt-1 flex flex-col min-h-0">
        <RunningProjectsBanner allProjects={state.allProjectsRef.current} />
        <div className="flex-1 overflow-hidden min-h-0">
          <ProjectsContent
            projects={state.projects}
            loading={state.loading}
            currentTab={state.currentTab}
            searchQuery={state.searchQuery}
            viewMode={state.viewMode}
            sortConfig={state.sortConfig}
            favoritePaths={state.favoritePaths}
            hiddenPaths={state.hiddenPaths}
            displayStart={state.displayStart}
            containerRef={state.containerRef}
            onToggleFavorite={state.toggleFavoritePath}
            onHide={state.toggleHiddenPath}
            onLaunch={state.handleLaunch}
            onOpenDir={state.handleOpenDir}
            onListScroll={state.handleListScroll}
          />
        </div>
      </div>
    </PageWrapper>
  )
}

export default ProjectsPage

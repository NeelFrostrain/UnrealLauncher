// Copyright (c) 2026 NeelFrostrain. All rights reserved.

import { FolderOpen, EyeOff, Star } from 'lucide-react'
import PageWrapper from '../layout/PageWrapper'
import ProjectsToolbar from '../components/projects/ProjectsToolbar'
import { ProjectsContent } from '../components/projects/ProjectsContent'
import { useProjectsPageState } from '../hooks/useProjectsPageState'

const ProjectsPage = (): React.ReactElement => {
  const state = useProjectsPageState()

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

      <div className="flex-1 overflow-hidden mt-1">
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
    </PageWrapper>
  )
}

export default ProjectsPage

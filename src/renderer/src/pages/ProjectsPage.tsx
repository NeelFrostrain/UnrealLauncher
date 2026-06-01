// Copyright (c) 2026 NeelFrostrain. All rights reserved.

import React, { useEffect, useState } from 'react'
import { FolderOpen, EyeOff, Star } from 'lucide-react'
import PageWrapper from '../layout/PageWrapper'
import ProjectsToolbar from '../components/projects/ProjectsToolbar'
import { ProjectsContent } from '../components/projects/ProjectsContent'
import { useProjectsPageState } from '../hooks/useProjectsPageState'
import { useToast } from '../components/ui/ToastContext'

const ProjectsPage = (): React.ReactElement => {
  const state = useProjectsPageState()
  const { showToast } = useToast()
  const [scanProgress, setScanProgress] = useState<{
    percentage: number
    currentPath: string
  } | null>(null)

  useEffect(() => {
    const removeProgress = window.electronAPI.onScanProgress((data) => {
      setScanProgress(data)
      if (data.percentage >= 100) {
        setTimeout(() => setScanProgress(null), 1500)
      }
    })
    const removeErrors = window.electronAPI.onScanErrors((data) => {
      if (data.errors.length > 0) {
        showToast(
          `Scan completed with ${data.errors.length} issue(s): ${data.errors[0]}`,
          'warning'
        )
      }
    })
    return () => {
      removeProgress()
      removeErrors()
    }
  }, [])

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

      {scanProgress && (
        <div className="mx-4 mb-2 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-text-muted)]">
          <div className="flex justify-between mb-1">
            <span className="truncate max-w-[80%]">{scanProgress.currentPath}</span>
            <span>{scanProgress.percentage}%</span>
          </div>
          <div className="h-1 rounded-full bg-[var(--color-border)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-300"
              style={{ width: `${scanProgress.percentage}%` }}
            />
          </div>
        </div>
      )}

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
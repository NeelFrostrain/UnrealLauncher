// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useCallback } from 'react'
import type { TabType } from '../types'
import { getSetting } from '../utils/settings'
import { useToast } from '../components/ui/ToastContext'
import { useProjectFavorites } from './useProjectFavorites'

interface UseProjectActionsOptions {
  currentTab: TabType
  loadProjectsForTab: (tab: TabType) => Promise<unknown>
}

export interface UseProjectActionsReturn {
  handleRefresh: (opts: {
    setRefreshing: (v: boolean) => void
    setCalculatingSizes: (v: boolean) => void
  }) => Promise<void>
  handleLaunch: (projectPath: string) => Promise<void>
  handleOpenDir: (dirPath: string) => Promise<void>
  handleDelete: (
    projectPath: string,
    setProjects: (fn: (prev: import('../types').Project[]) => import('../types').Project[]) => void
  ) => Promise<void>
  handleAddProject: (opts: {
    addingProject: boolean
    setAddingProject: (v: boolean) => void
  }) => Promise<void>
}

export function useProjectActions({
  currentTab,
  loadProjectsForTab
}: UseProjectActionsOptions): UseProjectActionsReturn {
  const { addToast } = useToast()
  const { getFavoritePaths, saveFavoritePaths } = useProjectFavorites()

  const handleRefresh = useCallback(
    async ({
      setRefreshing,
      setCalculatingSizes
    }: {
      setRefreshing: (v: boolean) => void
      setCalculatingSizes: (v: boolean) => void
    }): Promise<void> => {
      setRefreshing(true)
      setCalculatingSizes(true)
      await loadProjectsForTab(currentTab)
      setRefreshing(false)
      await window.electronAPI.calculateAllProjectSizes()
      setCalculatingSizes(false)
    },
    [currentTab, loadProjectsForTab]
  )

  const handleLaunch = useCallback(
    async (projectPath: string): Promise<void> => {
      if (!window.electronAPI) return
      const result = await window.electronAPI.launchProject(projectPath)
      if (!result.success) {
        addToast('Failed to launch project: ' + result.error, 'error')
      } else if (getSetting('autoCloseOnLaunch')) {
        setTimeout(() => window.electronAPI?.windowClose(), 1000)
      }
    },
    [addToast]
  )

  const handleOpenDir = useCallback(async (dirPath: string): Promise<void> => {
    if (window.electronAPI) {
      await window.electronAPI.openDirectory(dirPath)
    }
  }, [])

  const handleDelete = useCallback(
    async (
      projectPath: string,
      setProjects: (
        fn: (prev: import('../types').Project[]) => import('../types').Project[]
      ) => void
    ): Promise<void> => {
      try {
        if (window.electronAPI) {
          const success = await window.electronAPI.deleteProject(projectPath)
          if (!success) {
            addToast('Failed to remove project from storage', 'error')
            return
          }
        }
        setProjects((prev) => prev.filter((p) => p.projectPath !== projectPath))
        const favorites = getFavoritePaths()
        if (favorites.includes(projectPath)) {
          saveFavoritePaths(favorites.filter((p) => p !== projectPath))
          if (currentTab === 'favorites') {
            await loadProjectsForTab('favorites')
          }
        }
        addToast('Project removed from list', 'success')
      } catch (error) {
        console.error('Error deleting project:', error)
        addToast('Failed to remove project', 'error')
      }
    },
    [addToast, currentTab, getFavoritePaths, loadProjectsForTab, saveFavoritePaths]
  )

  const handleAddProject = useCallback(
    async ({
      addingProject,
      setAddingProject
    }: {
      addingProject: boolean
      setAddingProject: (v: boolean) => void
    }): Promise<void> => {
      if (!window.electronAPI || addingProject) return
      setAddingProject(true)
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Folder selection timeout')), 30000)
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
        const batchMsg = result.invalidProjects.find((p) => p.reason.startsWith('Batch limit'))
        const invalid = result.invalidProjects.filter(
          (p) => !p.reason.startsWith('Batch limit')
        ).length

        if (added > 0) addToast(`Added ${added} new project${added === 1 ? '' : 's'}`, 'success')
        if (duplicates > 0)
          addToast(`${duplicates} already exist${duplicates === 1 ? 's' : ''}`, 'warning')
        if (invalid > 0)
          addToast(`${invalid} invalid project${invalid === 1 ? '' : 's'} skipped`, 'error')
        if (batchMsg) addToast(`Batch limit: ${batchMsg.reason}`, 'warning')
        if (added === 0 && duplicates === 0 && invalid === 0 && !batchMsg) {
          addToast('No new projects were added', 'info')
        }

        await loadProjectsForTab(currentTab)
      } catch (error) {
        console.error('Error adding projects:', error)
        addToast('Failed to add projects. Please try again.', 'error')
      } finally {
        setAddingProject(false)
      }
    },
    [addToast, currentTab, loadProjectsForTab]
  )

  return { handleRefresh, handleLaunch, handleOpenDir, handleDelete, handleAddProject }
}

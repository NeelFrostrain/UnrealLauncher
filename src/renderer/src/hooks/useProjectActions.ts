// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useCallback } from 'react'
import type { TabType } from '../types'
import { getSetting } from '../utils/settings'
import { useToast } from '../components/ui/ToastContext'
import { logActivity } from '../utils/activityLogger'

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
      logActivity('Project refresh started', { currentTab })
      const projects = await loadProjectsForTab(currentTab)
      logActivity('Project refresh scan completed', {
        currentTab,
        count: Array.isArray(projects) ? projects.length : 0
      })
      setRefreshing(false)
      await window.electronAPI.calculateAllProjectSizes()
      logActivity('Project refresh size calculation requested')
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
    if (!window.electronAPI) return
    try {
      const result = await window.electronAPI.openDirectory(dirPath)
      if (!result.success) {
        addToast(result.error || 'Failed to open directory', 'error')
      }
    } catch (error) {
      addToast(
        'Failed to open directory: ' + (error instanceof Error ? error.message : String(error)),
        'error'
      )
    }
  }, [addToast])

  const handleAddProject = useCallback(
    async ({
      addingProject,
      setAddingProject
    }: {
      addingProject: boolean
      setAddingProject: (v: boolean) => void
    }): Promise<void> => {
      if (!window.electronAPI || addingProject) return
      logActivity('Add project started', { currentTab })
      setAddingProject(true)
      let timeoutId: NodeJS.Timeout | null = null
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Folder selection timeout')), 30000)
        })
        const selectPromise = window.electronAPI.selectProjectFolder()
        const result = await Promise.race([selectPromise, timeoutPromise])

        if (!result) {
          logActivity('Add project canceled')
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
        logActivity('Add project completed', {
          added,
          duplicates,
          invalid,
          batchLimit: Boolean(batchMsg)
        })

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
        logActivity('Add project failed', {
          error: error instanceof Error ? error.message : String(error)
        })
        console.error('Error adding projects:', error)
        addToast('Failed to add projects. Please try again.', 'error')
      } finally {
        if (timeoutId) clearTimeout(timeoutId)
        setAddingProject(false)
      }
    },
    [addToast, currentTab, loadProjectsForTab]
  )

  return { handleRefresh, handleLaunch, handleOpenDir, handleAddProject }
}

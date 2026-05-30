// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useState } from 'react'
import { useToast } from '../components/ui/ToastContext'
import { getSetting } from '../utils/settings'
import type { EngineCardProps } from '../types'
import { logActivity } from '../utils/activityLogger'

export function useEngineActions(
  setEngines: React.Dispatch<React.SetStateAction<EngineCardProps[]>>
): {
  scanning: boolean
  addingEngine: boolean
  handleScan: () => Promise<void>
  handleLaunch: (exePath: string) => Promise<void>
  handleOpenDir: (dirPath: string) => Promise<void>
  handleDelete: (dirPath: string) => Promise<void>
  handleAddEngine: () => Promise<void>
  handleUpdateAlias: (directoryPath: string, alias: string) => Promise<void>
} {
  const { addToast } = useToast()
  const [scanning, setScanning] = useState(false)
  const [addingEngine, setAddingEngine] = useState(false)

  const handleScan = async (): Promise<void> => {
    logActivity('Engine refresh started')
    setScanning(true)
    try {
      const engines = await window.electronAPI.scanEngines()
      setEngines(engines)
      logActivity('Engine refresh completed', { count: engines.length })
    } catch (err) {
      logActivity('Engine refresh failed', {
        error: err instanceof Error ? err.message : String(err)
      })
      console.error('Failed to scan engines:', err)
    }
    setScanning(false)
  }

  const handleLaunch = async (exePath: string): Promise<void> => {
    const result = await window.electronAPI.launchEngine(exePath)
    if (!result.success) {
      addToast('Failed to launch engine: ' + result.error, 'error')
    } else {
      setEngines((prev) =>
        prev.map((e) =>
          e.exePath === exePath
            ? {
                ...e,
                lastLaunch: new Date().toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })
              }
            : e
        )
      )
      if (getSetting('autoCloseOnLaunch')) setTimeout(() => window.electronAPI?.windowClose(), 1000)
    }
  }

  const handleOpenDir = async (dirPath: string): Promise<void> => {
    await window.electronAPI.openDirectory(dirPath)
  }

  const handleDelete = async (dirPath: string): Promise<void> => {
    try {
      const success = await window.electronAPI.deleteEngine(dirPath)
      if (!success) {
        addToast('Failed to remove engine from storage', 'error')
        logActivity('Delete engine failed', { dirPath, reason: 'API returned false' })
        return
      }
      setEngines((prev) => prev.filter((e) => e.directoryPath !== dirPath))
      addToast('Engine removed from list', 'success')
      logActivity('Delete engine completed', { dirPath })
    } catch (error) {
      addToast('Failed to remove engine', 'error')
      logActivity('Delete engine failed', {
        dirPath,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  const handleAddEngine = async (): Promise<void> => {
    if (!window.electronAPI || addingEngine) return
    logActivity('Add engine started')
    setAddingEngine(true)
    let timeoutId: NodeJS.Timeout | null = null
    try {
      const result = await Promise.race([
        window.electronAPI.selectEngineFolder(),
        new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('timeout')), 30000)
        })
      ])
      if (!result) {
        logActivity('Add engine canceled')
        addToast('No engine folder was selected', 'info')
        return
      }
      if (result.invalid) {
        logActivity('Add engine invalid', { message: result.message })
        addToast(result.message || 'Invalid Unreal Engine installation', 'error')
        return
      }
      if (result.duplicate) {
        logActivity('Add engine duplicate', { message: result.message })
        addToast(result.message || 'This engine is already added', 'warning')
        return
      }
      if (result.added) {
        logActivity('Add engine completed', {
          version: result.added.version,
          directoryPath: result.added.directoryPath
        })
        addToast(`Added engine ${result.added.version}`, 'success')
        setEngines(await window.electronAPI.scanEngines())
      }
    } catch (error) {
      logActivity('Add engine failed', {
        error: error instanceof Error ? error.message : String(error)
      })
      addToast('Failed to add engine. Please try again.', 'error')
    } finally {
      if (timeoutId) clearTimeout(timeoutId)
      setAddingEngine(false)
    }
  }

  const handleUpdateAlias = async (directoryPath: string, alias: string): Promise<void> => {
    try {
      const success = await window.electronAPI.updateEngineAlias(directoryPath, alias)
      if (!success) {
        addToast('Failed to save alias', 'error')
        return
      }
      setEngines((prev) =>
        prev.map((e) =>
          e.directoryPath === directoryPath
            ? { ...e, alias: alias.trim().slice(0, 32) || undefined }
            : e
        )
      )
    } catch {
      addToast('Failed to save alias', 'error')
    }
  }

  return {
    scanning,
    addingEngine,
    handleScan,
    handleLaunch,
    handleOpenDir,
    handleDelete,
    handleAddEngine,
    handleUpdateAlias
  }
}

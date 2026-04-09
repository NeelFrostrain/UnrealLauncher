import { useEffect, useState, useRef, useCallback } from 'react'
import type { EngineCardProps } from '../types'
import PageWrapper from '@renderer/layout/PageWrapper'
import EngineCard from '@renderer/components/engines/EngineCard'
import { useToast } from '../components/ui/ToastContext'
import { getSetting } from '../utils/settings'
import { Plus, RefreshCw } from 'lucide-react'

const EnginesPage = (): React.ReactElement => {
  const [engines, setEngines] = useState<EngineCardProps[]>([])
  const [scanning, setScanning] = useState(false)
  const [addingEngine, setAddingEngine] = useState(false)
  const [displayStart, setDisplayStart] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const { addToast } = useToast()
  const ITEMS_PER_BATCH = 30 // Number of items to render at once

  // Handle scroll virtualization
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget
    const scrollTop = container.scrollTop
    const itemHeight = 120 + 8 // Item height + gap (mb-2)
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 5) // 5 items buffer
    setDisplayStart(startIndex)
  }, [])

  useEffect(() => {
    const loadSavedEngines = async (): Promise<void> => {
      if (window.electronAPI) {
        try {
          const scannedEngines = await window.electronAPI.scanEngines()
          setEngines(scannedEngines)
        } catch (err) {
          console.error('Failed to load engines:', err)
        }
      }
    }

    loadSavedEngines()

    if (window.electronAPI) {
      const cleanup = window.electronAPI.onSizeCalculated((data) => {
        if (data.type === 'engine') {
          setEngines((prev) =>
            prev.map((e) => (e.directoryPath === data.path ? { ...e, folderSize: data.size } : e))
          )
        }
      })
      return cleanup
    }
    return () => {} // No-op cleanup if electronAPI is not available
  }, [])

  const handleScan = async (): Promise<void> => {
    setScanning(true)
    if (window.electronAPI) {
      try {
        const scannedEngines = await window.electronAPI.scanEngines()
        setEngines(scannedEngines)
      } catch (err) {
        console.error('Failed to scan engines:', err)
      }
    }
    setScanning(false)
  }

  const handleLaunch = async (exePath: string): Promise<void> => {
    if (window.electronAPI) {
      const result = await window.electronAPI.launchEngine(exePath)
      if (!result.success) {
        addToast('Failed to launch engine: ' + result.error, 'error')
      } else {
        // Update last launch time
        setEngines((prev) =>
          prev.map((e) => {
            if (e.exePath === exePath) {
              const now = new Date()
              return {
                ...e,
                lastLaunch: now.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })
              }
            }
            return e
          })
        )

        // Check if auto-close on launch is enabled
        if (getSetting('autoCloseOnLaunch')) {
          // Close the app after successful launch
          setTimeout(() => {
            window.electronAPI?.windowClose()
          }, 1000) // Small delay to ensure the launch process starts
        }
      }
    }
  }

  const handleOpenDir = async (dirPath: string): Promise<void> => {
    if (window.electronAPI) {
      await window.electronAPI.openDirectory(dirPath)
    }
  }

  const handleDelete = async (dirPath: string): Promise<void> => {
    addToast('Hold to confirm: removing engine from list (files stay on disk)', 'warning')
    try {
      if (window.electronAPI) {
        const success = await window.electronAPI.deleteEngine(dirPath)
        if (!success) {
          addToast('Failed to remove engine from storage', 'error')
          return
        }
      }
      setEngines((prev) => prev.filter((e) => e.directoryPath !== dirPath))
      addToast('Engine removed from list', 'success')
    } catch (error) {
      console.error('Error deleting engine:', error)
      addToast('Failed to remove engine', 'error')
    }
  }

  const handleAddEngine = async (): Promise<void> => {
    if (!window.electronAPI || addingEngine) return

    setAddingEngine(true)

    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Folder selection timeout')), 30000) // 30 second timeout
      })

      const selectPromise = window.electronAPI.selectEngineFolder()
      const result = await Promise.race([selectPromise, timeoutPromise])

      if (!result) {
        addToast('No engine folder was selected', 'info')
        setAddingEngine(false)
        return
      }

      if (result.invalid) {
        addToast(result.message || 'Invalid Unreal Engine installation', 'error')
        setAddingEngine(false)
        return
      }

      if (result.duplicate) {
        addToast(result.message || 'This engine is already added', 'warning')
        setAddingEngine(false)
        return
      }

      if (result.added) {
        addToast(`Added engine ${result.added.version}`, 'success')
        // Refresh the engines list from the backend
        if (window.electronAPI) {
          try {
            const scannedEngines = await window.electronAPI.scanEngines()
            setEngines(scannedEngines)
          } catch (err) {
            console.error('Failed to refresh engines after add:', err)
            // Fallback: add locally
            setEngines((prev) => [result.added!, ...prev])
          }
        } else {
          // Fallback if API not available
          setEngines((prev) => [result.added!, ...prev])
        }
      }
    } catch (error) {
      console.error('Error adding engine:', error)
      addToast('Failed to add engine. Please try again.', 'error')
    } finally {
      setAddingEngine(false)
    }
  }

  return (
    <PageWrapper>
      {/* Page header — inline, part of the content flow */}
      <div className="flex items-center justify-between px-4 py-4 shrink-0">
        <div>
          <h1 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Engines</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {engines.length > 0 ? `${engines.length} engine${engines.length === 1 ? '' : 's'} installed` : 'No engines found'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleScan}
            disabled={scanning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--color-surface-card)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
          >
            <RefreshCw size={12} className={scanning ? 'animate-spin' : ''} />
            {scanning ? 'Scanning…' : 'Scan'}
          </button>
          <button
            onClick={handleAddEngine}
            disabled={addingEngine}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            <Plus size={12} />
            Add Engine
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {engines.length > 0 ? (
          <div
            ref={containerRef}
            onScroll={handleScroll}
            className="space-y-2 overflow-y-auto py-2 px-4 h-full"
          >
            {engines.slice(displayStart, displayStart + ITEMS_PER_BATCH).map((data) => (
              <EngineCard
                key={data.directoryPath}
                {...data}
                onLaunch={handleLaunch}
                onOpenDir={handleOpenDir}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center" style={{ color: 'var(--color-text-muted)' }}>
            <p className="text-sm mb-1">No engines found</p>
            <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)', opacity: 0.6 }}>
              Click Scan to search common paths, or Add Engine to browse manually
            </p>
            <button
              onClick={handleScan}
              disabled={scanning}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer"
              style={{ backgroundColor: 'var(--color-surface-card)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
            >
              <RefreshCw size={13} className={scanning ? 'animate-spin' : ''} />
              {scanning ? 'Scanning…' : 'Scan for Engines'}
            </button>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}

export default EnginesPage

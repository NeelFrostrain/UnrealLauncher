import { useEffect, useState } from 'react'
import type { EngineCardProps } from '../types'
import PageWrapper from '@renderer/layout/PageWrapper'
import EnginesToolbar from '@renderer/components/engines/EnginesToolbar'
import EngineCard from '@renderer/components/engines/EngineCard'
import { useToast } from '../components/ui/ToastContext'
import { getSetting } from '../utils/settings'

const EnginesPage = (): React.ReactElement => {
  const [engines, setEngines] = useState<EngineCardProps[]>([])
  const [scanning, setScanning] = useState(false)
  const [addingEngine, setAddingEngine] = useState(false)
  const { addToast } = useToast()

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
      <EnginesToolbar
        scanning={scanning}
        addingEngine={addingEngine}
        onAddEngine={handleAddEngine}
        onScan={handleScan}
      />

      <div className="flex-1 space-y-2 overflow-y-auto py-3 px-1.5">
        {engines.length > 0 ? (
          engines.map((data) => (
            <EngineCard
              key={data.directoryPath}
              {...data}
              onLaunch={handleLaunch}
              onOpenDir={handleOpenDir}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-white/50">
            <p className="text-lg mb-2">No engines found</p>
            <p className="text-sm text-white/30 mb-4">
              Click &quot;Scan for Engines&quot; to search or add manually
            </p>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}

export default EnginesPage

import { useEffect, useState } from 'react'
import type { EngineCardProps } from '../types'
import PageWrapper from '@renderer/layout/PageWrapper'
import EnginesToolbar from '@renderer/components/EnginesToolbar'
import EngineCard from '@renderer/components/EngineCard'

const EnginesPage = (): React.ReactElement => {
  const [engines, setEngines] = useState<EngineCardProps[]>([])
  const [scanning, setScanning] = useState(false)

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
      window.electronAPI.onSizeCalculated((data) => {
        if (data.type === 'engine') {
          setEngines((prev) =>
            prev.map((e) => (e.directoryPath === data.path ? { ...e, folderSize: data.size } : e))
          )
        }
      })
    }
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
        alert('Failed to launch engine: ' + result.error)
      } else {
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
      }
    }
  }

  const handleOpenDir = async (dirPath: string): Promise<void> => {
    if (window.electronAPI) {
      await window.electronAPI.openDirectory(dirPath)
    }
  }

  const handleDelete = async (dirPath: string): Promise<void> => {
    if (confirm('Remove this engine from the list? (Files will not be deleted)')) {
      setEngines((prev) => prev.filter((e) => e.directoryPath !== dirPath))
      if (window.electronAPI) {
        await window.electronAPI.deleteEngine(dirPath)
      }
    }
  }

  const handleAddEngine = async (): Promise<void> => {
    if (!window.electronAPI) return
    const engine = await window.electronAPI.selectEngineFolder()
    if (!engine) {
      alert('Engine already exists or no valid Unreal Engine folder selected.')
      return
    }
    if (engines.find((e) => e.directoryPath === engine.directoryPath)) {
      alert('This engine is already added.')
      return
    }
    setEngines((prev) => [engine, ...prev])
  }

  return (
    <PageWrapper>
      <EnginesToolbar scanning={scanning} onAddEngine={handleAddEngine} onScan={handleScan} />

      <div className="flex-1 space-y-2 overflow-y-auto py-3 px-1.5">
        {engines.length > 0 ? (
          engines.map((data, index) => (
            <EngineCard
              key={`${data.directoryPath}-${index}`}
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

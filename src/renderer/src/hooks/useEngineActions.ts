import { useState } from 'react'
import { useToast } from '../components/ui/ToastContext'
import { getSetting } from '../utils/settings'
import type { EngineCardProps } from '../types'

export function useEngineActions(
  setEngines: React.Dispatch<React.SetStateAction<EngineCardProps[]>>
) {
  const { addToast } = useToast()
  const [scanning, setScanning] = useState(false)
  const [addingEngine, setAddingEngine] = useState(false)

  const handleScan = async (): Promise<void> => {
    setScanning(true)
    try { setEngines(await window.electronAPI.scanEngines()) }
    catch (err) { console.error('Failed to scan engines:', err) }
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
            ? { ...e, lastLaunch: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
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
      if (!success) { addToast('Failed to remove engine from storage', 'error'); return }
      setEngines((prev) => prev.filter((e) => e.directoryPath !== dirPath))
      addToast('Engine removed from list', 'success')
    } catch { addToast('Failed to remove engine', 'error') }
  }

  const handleAddEngine = async (): Promise<void> => {
    if (!window.electronAPI || addingEngine) return
    setAddingEngine(true)
    try {
      const result = await Promise.race([
        window.electronAPI.selectEngineFolder(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 30000))
      ])
      if (!result) { addToast('No engine folder was selected', 'info'); return }
      if (result.invalid) { addToast(result.message || 'Invalid Unreal Engine installation', 'error'); return }
      if (result.duplicate) { addToast(result.message || 'This engine is already added', 'warning'); return }
      if (result.added) {
        addToast(`Added engine ${result.added.version}`, 'success')
        setEngines(await window.electronAPI.scanEngines())
      }
    } catch { addToast('Failed to add engine. Please try again.', 'error') }
    finally { setAddingEngine(false) }
  }

  return { scanning, addingEngine, handleScan, handleLaunch, handleOpenDir, handleDelete, handleAddEngine }
}

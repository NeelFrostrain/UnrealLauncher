// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useEffect } from 'react'
import PageWrapper from '@renderer/layout/PageWrapper'
import { useEngineActions } from '../../hooks/useEngineActions'
import { useEnginesPageState } from './enginesPageState'
import { EnginesPageToolbar } from './enginesPageToolbar'
import { EnginesPageContent } from './enginesPageContent'
import { useGlobalShortcuts } from '../../hooks/useGlobalShortcuts'
import { setEnginesCache, clearEngineCompatibilityCache } from '../../hooks/useEngineCompatibility'

const EnginesPage = (): React.ReactElement => {
  const state = useEnginesPageState()
  const {
    scanning,
    addingEngine,
    handleScan,
    handleLaunch,
    handleOpenDir,
    handleDelete,
    handleAddEngine,
    handleUpdateAlias
  } = useEngineActions(state.setEngines)

  useGlobalShortcuts({
    onRefresh: handleScan,
    onNew: handleAddEngine
  })

  // Receive action commands dispatched from the mini palette window
  useEffect(() => {
    const handler = (e: Event): void => {
      const { commandId } = (e as CustomEvent<{ commandId: string }>).detail
      if (commandId === 'action-refresh') handleScan()
      else if (commandId === 'action-add-engine') handleAddEngine()
    }
    window.addEventListener('palette-action', handler)
    return () => window.removeEventListener('palette-action', handler)
  }, [handleScan, handleAddEngine])

  const { setEngines, setLoading } = state

  // Load engines on mount
  useEffect(() => {
    const load = async (): Promise<void> => {
      if (!window.electronAPI) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const savedEngines = await window.electronAPI.loadSavedEngines()
        if (savedEngines.length > 0) {
          setEngines(savedEngines)
          setEnginesCache(savedEngines)
          setLoading(false)
        }

        const engines = await window.electronAPI.scanEngines()
        setEngines(engines)
        // Keep the compatibility badge cache in sync — free since data is already loaded
        setEnginesCache(engines)
        clearEngineCompatibilityCache()
      } catch (err) {
        console.error('Failed to load engines:', err)
      } finally {
        setLoading(false)
      }
    }

    load()

    if (window.electronAPI) {
      return window.electronAPI.onSizeCalculated((data) => {
        if (data.type === 'engine')
          setEngines((prev) =>
            prev.map((e) => (e.directoryPath === data.path ? { ...e, folderSize: data.size } : e))
          )
      })
    }
    return () => {}
  }, [setEngines, setLoading])

  return (
    <PageWrapper>
      <EnginesPageToolbar
        activeTab={state.activeTab}
        engines={state.engines}
        activeEngine={state.activeEngine}
        selectedEngine={state.selectedEngine}
        dropdownOpen={state.dropdownOpen}
        dropdownAnchorRef={state.dropdownAnchorRef as React.RefObject<HTMLButtonElement | null>}
        scanning={scanning}
        addingEngine={addingEngine}
        onTabChange={state.switchTab}
        onScan={handleScan}
        onAddEngine={handleAddEngine}
        onSelectEngine={state.setSelectedEngine}
        onDropdownToggle={state.setDropdownOpen}
      />

      <EnginesPageContent
        activeTab={state.activeTab}
        engines={state.engines}
        loading={state.loading}
        displayStart={state.displayStart}
        itemsPerBatch={state.ITEMS_PER_BATCH}
        activeEngine={state.activeEngine}
        containerRef={state.containerRef as React.RefObject<HTMLDivElement | null>}
        onScroll={state.handleScroll}
        onLaunch={(exePath: string) => handleLaunch(exePath)}
        onOpenDir={(dirPath: string) => handleOpenDir(dirPath)}
        onDelete={(dirPath: string) => handleDelete(dirPath)}
        onUpdateAlias={(directoryPath: string, alias: string) =>
          handleUpdateAlias(directoryPath, alias)
        }
        onScan={handleScan}
        scanning={scanning}
      />
    </PageWrapper>
  )
}

export default EnginesPage

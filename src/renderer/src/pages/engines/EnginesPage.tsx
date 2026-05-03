// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useEffect } from 'react'
import PageWrapper from '@renderer/layout/PageWrapper'
import { useEngineActions } from '../../hooks/useEngineActions'
import { useEnginesPageState } from './enginesPageState'
import { EnginesPageToolbar } from './enginesPageToolbar'
import { EnginesPageContent } from './enginesPageContent'

const EnginesPage = (): React.ReactElement => {
  const state = useEnginesPageState()
  const {
    scanning,
    addingEngine,
    handleScan,
    handleLaunch,
    handleOpenDir,
    handleDelete,
    handleAddEngine
  } = useEngineActions(state.setEngines)

  // Load engines on mount
  useEffect(() => {
    const load = async (): Promise<void> => {
      if (!window.electronAPI) {
        state.setLoading(false)
        return
      }
      try {
        state.setEngines(await window.electronAPI.scanEngines())
      } catch (err) {
        console.error('Failed to load engines:', err)
      } finally {
        state.setLoading(false)
      }
    }

    load()

    if (window.electronAPI) {
      return window.electronAPI.onSizeCalculated((data) => {
        if (data.type === 'engine')
          state.setEngines((prev) =>
            prev.map((e) => (e.directoryPath === data.path ? { ...e, folderSize: data.size } : e))
          )
      })
    }
    return () => {}
  }, [])

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
        onScan={handleScan}
        scanning={scanning}
      />
    </PageWrapper>
  )
}

export default EnginesPage

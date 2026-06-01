// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import React, { useEffect, useState } from 'react'
import PageWrapper from '@renderer/layout/PageWrapper'
import { useEngineActions } from '../../hooks/useEngineActions'
import { useEnginesPageState } from './enginesPageState'
import { EnginesPageToolbar } from './enginesPageToolbar'
import { EnginesPageContent } from './enginesPageContent'
import { useToast } from '../../components/ui/ToastContext'

const EnginesPage = (): React.ReactElement => {
  const state = useEnginesPageState()
  const { showToast } = useToast()
  const [scanProgress, setScanProgress] = useState<{
    percentage: number
    currentPath: string
  } | null>(null)
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

  // Load engines on mount + size listener
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

  // Scan progress + error listeners
  useEffect(() => {
    if (!window.electronAPI) return
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
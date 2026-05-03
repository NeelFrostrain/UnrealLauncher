// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import React from 'react'
import type { EngineCardProps } from '../../types'
import EngineCard from '@renderer/components/engines/EngineCard'
import InstalledPluginsTab from '@renderer/components/engines/InstalledPluginsTab'
import FabTab from '@renderer/components/engines/FabTab'

interface EnginesPageContentProps {
  activeTab: 'engines' | 'plugins' | 'fab'
  engines: EngineCardProps[]
  loading: boolean
  displayStart: number
  itemsPerBatch: number
  activeEngine: EngineCardProps | null
  containerRef: React.RefObject<HTMLDivElement | null>
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void
  onLaunch: (exePath: string) => void
  onOpenDir: (dirPath: string) => void
  onDelete: (dirPath: string) => void
  onScan: () => void
  scanning: boolean
}

/**
 * Renders the content area for different engine tabs
 */
export function EnginesPageContent({
  activeTab,
  engines,
  loading,
  displayStart,
  itemsPerBatch,
  activeEngine,
  containerRef,
  onScroll,
  onLaunch,
  onOpenDir,
  onDelete,
  onScan,
  scanning
}: EnginesPageContentProps) {
  if (activeTab === 'engines') {
    return (
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div
              className="w-5 h-5 rounded-full border-2 animate-spin"
              style={{
                borderColor: 'color-mix(in srgb, var(--color-accent) 25%, transparent)',
                borderTopColor: 'var(--color-accent)'
              }}
            />
          </div>
        ) : engines.length > 0 ? (
          <div
            ref={containerRef}
            onScroll={onScroll}
            className="space-y-2 overflow-y-auto py-2 h-full"
          >
            {engines.slice(displayStart, displayStart + itemsPerBatch).map((data) => (
              <EngineCard
                key={data.directoryPath}
                {...data}
                onLaunch={onLaunch}
                onOpenDir={onOpenDir}
                onDelete={onDelete}
              />
            ))}
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center h-full text-center"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <p className="text-sm mb-1">No engines found</p>
            <p className="text-xs mb-4" style={{ opacity: 0.6 }}>
              Click Scan to search common paths, or Add Engine to browse manually
            </p>
            <button
              onClick={onScan}
              disabled={scanning}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer"
              style={{
                backgroundColor: 'var(--color-surface-card)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)'
              }}
            >
              {scanning ? 'Scanning…' : 'Scan for Engines'}
            </button>
          </div>
        )}
      </div>
    )
  }

  if (activeTab === 'plugins') {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          {activeEngine ? (
            <InstalledPluginsTab
              engineDir={activeEngine.directoryPath}
              engineVersion={activeEngine.version}
            />
          ) : (
            <div
              className="flex items-center justify-center h-full"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <p className="text-xs">No engines installed</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-hidden">
      <FabTab />
    </div>
  )
}

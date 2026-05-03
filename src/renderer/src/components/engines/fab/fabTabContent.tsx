// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { FolderOpen, RefreshCw, Package } from 'lucide-react'
import { AssetListCard, AssetGridCard } from './AssetCard'
import type { FabAsset } from './AssetCard'

interface FabTabContentProps {
  folderPath: string
  loading: boolean
  filtered: FabAsset[]
  searchQuery: string
  viewMode: 'list' | 'grid'
  onPickFolder: () => void
}

/**
 * Renders the content area for FabTab
 */
export function FabTabContent({
  folderPath,
  loading,
  filtered,
  searchQuery,
  viewMode,
  onPickFolder
}: FabTabContentProps) {
  if (!folderPath) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8 px-6">
        {/* Icon */}
        <div
          className="w-12 h-12 flex items-center justify-center rounded-xl mb-4"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
            border: '1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)'
          }}
        >
          <FolderOpen size={22} style={{ color: 'var(--color-accent)' }} />
        </div>

        <p
          className="text-sm font-semibold mb-1"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Set your Fab library folder
        </p>
        <p
          className="text-xs mb-6 text-center max-w-xs"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Point this to your Epic Games Fab cache directory to browse your downloaded assets.
        </p>

        {/* Step-by-step guide */}
        <div className="w-full max-w-sm flex flex-col gap-2 mb-6">
          {[
            { n: '1', text: 'Open the Epic Games Launcher' },
            { n: '2', text: 'Click your profile icon → Settings' },
            { n: '3', text: 'Click "Download Settings"' },
            { n: '4', text: 'Scroll to Advanced' },
            { n: '5', text: 'Find "Fab Library Data Cache Directory" and copy the path' },
            { n: '6', text: 'Paste or browse to that path below' }
          ].map(({ n, text }) => (
            <div
              key={n}
              className="flex items-start gap-3 px-3 py-2.5"
              style={{
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--color-surface-card)',
                border: '1px solid var(--color-border)'
              }}
            >
              <span
                className="shrink-0 w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-full"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-accent) 18%, transparent)',
                  color: 'var(--color-accent)',
                  border: '1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)'
                }}
              >
                {n}
              </span>
              <span
                className="text-xs leading-relaxed"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {text}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onPickFolder}
          className="flex items-center gap-2 px-5 py-2 text-xs font-semibold cursor-pointer"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-text-primary)'
          }}
        >
          <FolderOpen size={13} />
          Choose Folder
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-32 gap-2"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <RefreshCw size={14} className="animate-spin" />
        <span className="text-xs">Scanning…</span>
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-center">
        <Package
          size={28}
          className="mb-2"
          style={{ color: 'var(--color-text-muted)', opacity: 0.25 }}
        />
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {searchQuery ? 'No assets match your search' : 'No assets found in this folder'}
        </p>
      </div>
    )
  }

  if (viewMode === 'grid') {
    return (
      <div
        className="grid gap-2 pt-2"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}
      >
        {filtered.map((asset) => (
          <AssetGridCard key={asset.folderPath} asset={asset} />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 pt-2">
      {filtered.map((asset) => (
        <AssetListCard key={asset.folderPath} asset={asset} />
      ))}
    </div>
  )
}

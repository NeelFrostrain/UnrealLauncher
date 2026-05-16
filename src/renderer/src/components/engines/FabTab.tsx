// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { RefreshCw, Search, FolderInput, LayoutGrid, LayoutList } from 'lucide-react'
import FabFilterBar from './fab/FabFilterBar'
import { TYPE_LABELS } from './fab/AssetCard'
import { useFabTabState } from './fab/fabTabState'
import { FabTabContent } from './fab/fabTabContent'

const FabTab = (): React.ReactElement => {
  const state = useFabTabState()

  return (
    <div className="flex flex-col h-full">
      {/* ── Toolbar ── */}
      <div
        className="flex items-center gap-2 py-2.5 shrink-0"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {/* Folder picker */}
        <button
          onClick={state.handlePickFolder}
          className="flex items-center gap-2 flex-1 px-3 py-1.5 text-xs text-left cursor-pointer min-w-0"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-surface-card)',
            border: '1px solid var(--color-border)',
            color: state.folderPath
              ? 'var(--color-text-secondary)'
              : 'var(--color-text-muted)',
            transition: 'border-color 150ms ease'
          }}
          title="Click to change folder"
        >
          <FolderInput size={12} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
          <span className="truncate">
            {state.folderPath || 'Click to set Fab cache folder…'}
          </span>
        </button>

        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 text-xs w-44 shrink-0"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-surface-card)',
            border: '1px solid var(--color-border)'
          }}
        >
          <Search size={11} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search…"
            value={state.searchQuery}
            onChange={(e) => state.setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-xs"
            style={{ color: 'var(--color-text-primary)' }}
          />
        </div>

        {/* View toggle */}
        <div
          className="flex items-center overflow-hidden shrink-0"
          style={{ borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}
        >
          <button
            onClick={() => state.handleViewChange('list')}
            className="flex items-center p-1.5 cursor-pointer transition-colors"
            style={{
              backgroundColor:
                state.viewMode === 'list' ? 'var(--color-accent)' : 'var(--color-surface-card)',
              color:
                state.viewMode === 'list'
                  ? 'var(--color-text-primary)'
                  : 'var(--color-text-muted)'
            }}
            title="List view"
          >
            <LayoutList size={13} />
          </button>
          <button
            onClick={() => state.handleViewChange('grid')}
            className="flex items-center p-1.5 cursor-pointer transition-colors"
            style={{
              backgroundColor:
                state.viewMode === 'grid' ? 'var(--color-accent)' : 'var(--color-surface-card)',
              color:
                state.viewMode === 'grid'
                  ? 'var(--color-text-primary)'
                  : 'var(--color-text-muted)'
            }}
            title="Grid view"
          >
            <LayoutGrid size={13} />
          </button>
        </div>

        {/* Refresh */}
        <button
          onClick={() => state.scan(state.folderPath)}
          disabled={state.loading || !state.folderPath}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed shrink-0"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-surface-card)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)'
          }}
        >
          <RefreshCw size={12} className={state.loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Filter pills ── */}
      {state.assets.length > 0 && (
        <FabFilterBar
          assets={state.assets}
          typeFilter={state.typeFilter}
          typeLabels={TYPE_LABELS}
          onFilterChange={state.setTypeFilter}
        />
      )}

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto pb-4">
        <FabTabContent
          folderPath={state.folderPath}
          loading={state.loading}
          filtered={state.filtered}
          searchQuery={state.searchQuery}
          viewMode={state.viewMode}
          onPickFolder={state.handlePickFolder}
        />
      </div>
    </div>
  )
}

export default FabTab

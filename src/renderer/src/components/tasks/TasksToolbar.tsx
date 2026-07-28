// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import React, { useRef, useEffect } from 'react'
import { Activity, RefreshCw, Search, X, Trash2 } from 'lucide-react'
import type { ProcessFilterType } from '../../types'
import { Tabs } from '../ui/Tabs'

interface TasksToolbarProps {
  tabs: Array<{ id: ProcessFilterType; label: string; icon?: React.ReactNode }>
  currentTab: ProcessFilterType
  searchOpen: boolean
  searchQuery: string
  refreshing: boolean
  onTabClick: (tab: ProcessFilterType) => void
  onToggleSearch: () => void
  onSearchChange: (value: string) => void
  onRefresh: () => void
  autoRefresh: boolean
  onAutoRefreshToggle: () => void
  selectedCount: number
  onBulkKill: () => void
  onClearSelection: () => void
}

export default function TasksToolbar({
  tabs,
  currentTab,
  searchOpen,
  searchQuery,
  refreshing,
  onTabClick,
  onToggleSearch,
  onSearchChange,
  onRefresh,
  autoRefresh,
  onAutoRefreshToggle,
  selectedCount,
  onBulkKill,
  onClearSelection
}: TasksToolbarProps): React.ReactElement {
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus()
    }
  }, [searchOpen])

  return (
    <div
      className="flex items-center gap-3 py-3 border-b shrink-0 select-none"
      style={{ borderColor: 'var(--color-border)' }}
    >
      {/* Left: Tabs or selection bar */}
      <div className="flex items-center gap-2 shrink-0">
        {selectedCount > 0 ? (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
            <span
              className="text-xs font-medium px-2.5 py-1"
              style={{
                backgroundColor: 'color-mix(in srgb, #ef4444 15%, transparent)',
                color: '#f87171',
                border: '1px solid color-mix(in srgb, #ef4444 30%, transparent)',
                borderRadius: 'var(--radius)'
              }}
            >
              {selectedCount} selected
            </span>
            <button
              onClick={onBulkKill}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium cursor-pointer transition-all hover:opacity-90 text-white"
              style={{ borderRadius: 'var(--radius)', backgroundColor: '#dc2626' }}
            >
              <Trash2 size={12} />
              <span>Kill Selected</span>
            </button>
            <button
              onClick={onClearSelection}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium cursor-pointer transition-all border"
              style={{
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--color-surface-card)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-secondary)'
              }}
            >
              <X size={12} />
              <span>Clear</span>
            </button>
          </div>
        ) : (
          <>
            <Tabs tabs={tabs} activeTab={currentTab} onChange={onTabClick} />

            {/* Collapsible search */}
            {searchOpen && (
              <div
                className="flex items-center gap-2 px-2.5 py-1 text-xs w-44 transition-all shrink-0"
                style={{
                  borderRadius: 'var(--radius)',
                  backgroundColor: 'var(--color-surface-card)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <Search size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search processes..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="flex-1 bg-transparent border-0 outline-none text-[11px]"
                  style={{ color: 'var(--color-text-primary)' }}
                />
                {searchQuery && (
                  <button onClick={() => onSearchChange('')} className="cursor-pointer shrink-0">
                    <X size={10} style={{ color: 'var(--color-text-muted)' }} />
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Right: Controls */}
      <div className="flex items-center ml-auto gap-1.5 shrink-0">
        {selectedCount === 0 && (
          <>
            <button
              onClick={onToggleSearch}
              className="flex items-center p-1.5 cursor-pointer transition-colors border shrink-0"
              style={{
                borderRadius: 'var(--radius)',
                backgroundColor: searchOpen
                  ? 'color-mix(in srgb, var(--color-accent) 20%, transparent)'
                  : 'var(--color-surface-card)',
                color: searchOpen ? 'var(--color-accent)' : 'var(--color-text-muted)',
                borderColor: 'var(--color-border)'
              }}
              title="Search processes"
            >
              <Search size={13} />
            </button>

            <button
              onClick={onAutoRefreshToggle}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer border shrink-0 whitespace-nowrap"
              style={{
                borderRadius: 'var(--radius)',
                backgroundColor: autoRefresh
                  ? 'color-mix(in srgb, var(--color-accent) 15%, var(--color-surface-card))'
                  : 'var(--color-surface-card)',
                borderColor: autoRefresh ? 'var(--color-accent)' : 'var(--color-border)',
                color: autoRefresh ? 'var(--color-accent)' : 'var(--color-text-secondary)'
              }}
              title={`${autoRefresh ? 'Disable' : 'Enable'} auto-refresh every 4 seconds`}
            >
              <Activity
                size={12}
                style={{ color: autoRefresh ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
              />
              <span>Auto Refresh</span>
            </button>
          </>
        )}

        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium cursor-pointer transition-all disabled:opacity-50 border shrink-0 whitespace-nowrap"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-surface-card)',
            color: 'var(--color-text-secondary)',
            borderColor: 'var(--color-border)'
          }}
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          <span>Scan System</span>
        </button>
      </div>
    </div>
  )
}

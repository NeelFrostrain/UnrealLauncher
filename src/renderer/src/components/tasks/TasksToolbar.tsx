// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useRef, useEffect } from 'react'
import {
  Activity,
  RefreshCw,
  Search,
  X
} from 'lucide-react'
import type { ProcessFilterType } from '../../types'

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
}

function AutoRefreshToggle({
  enabled,
  onToggle
}: {
  enabled: boolean
  onToggle: () => void
}): React.ReactElement {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer"
      aria-label={`Auto-refresh: ${enabled ? 'enabled' : 'disabled'}`}
      style={{
        borderRadius: 'var(--radius)',
        backgroundColor: enabled
          ? 'color-mix(in srgb, var(--color-accent) 15%, var(--color-surface-card))'
          : 'var(--color-surface-card)',
        border: `1px solid ${enabled ? 'var(--color-accent)' : 'var(--color-border)'}`,
        color: enabled ? 'var(--color-accent)' : 'var(--color-text-secondary)'
      }}
      title={`${enabled ? 'Disable' : 'Enable'} auto-refresh every 4 seconds`}
    >
      <Activity
        size={12}
        style={{ color: enabled ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
      />
      <span>Auto</span>
    </button>
  )
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
  onAutoRefreshToggle
}: TasksToolbarProps): React.ReactElement {
  const searchRef = useRef<HTMLInputElement>(null)

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus()
    }
  }, [searchOpen])

  return (
    <div
      className="flex items-center justify-between px-6 py-3 border-b shrink-0 select-none"
      style={{
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-surface)'
      }}
    >
      {/* Left: Tab Navigation */}
      <div className="flex items-center">
        <div
          className="flex items-center rounded-lg overflow-hidden"
          style={{
            backgroundColor: 'var(--color-surface-card)',
            border: '1px solid var(--color-border)'
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabClick(tab.id)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-all cursor-pointer relative"
              style={{
                backgroundColor: currentTab === tab.id ? 'var(--color-accent)' : 'transparent',
                color:
                  currentTab === tab.id
                    ? 'white'
                    : currentTab === tab.id
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-secondary)'
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2.5">
        {/* Search */}
        {searchOpen ? (
          <div
            className="flex items-center gap-2 px-3 py-1.5 w-64 transition-all focus-within:border-blue-500/50"
            style={{
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--color-surface-card)',
              border: '1px solid var(--color-border)',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
            }}
          >
            <Search size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search processes, PIDs, paths..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="flex-1 bg-transparent border-0 outline-none text-xs focus:ring-0 focus:outline-none"
              style={{ color: 'var(--color-text-primary)' }}
            />
            <button
              onClick={onToggleSearch}
              className="p-1 hover:bg-white/10 transition-colors"
              style={{ borderRadius: 'var(--radius)' }}
            >
              <X size={12} style={{ color: 'var(--color-text-muted)' }} />
            </button>
          </div>
        ) : (
          <button
            onClick={onToggleSearch}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer hover:bg-white/5"
            style={{
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--color-surface-card)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)'
            }}
          >
            <Search size={12} style={{ color: 'var(--color-text-muted)' }} />
            <span>Search</span>
          </button>
        )}

        {/* Auto Refresh Toggle */}
        <AutoRefreshToggle enabled={autoRefresh} onToggle={onAutoRefreshToggle} />

        {/* Refresh */}
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium cursor-pointer transition-all hover:brightness-110 active:scale-95 disabled:opacity-60"
          style={{
            backgroundColor: 'var(--color-surface-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            color: 'var(--color-text-secondary)'
          }}
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          Scan System
        </button>
      </div>
    </div>
  )
}
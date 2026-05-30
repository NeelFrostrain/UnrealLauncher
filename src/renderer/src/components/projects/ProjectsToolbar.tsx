// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import type { FC } from 'react'
import { useRef, useState, useEffect } from 'react'
import {
  Plus,
  RefreshCw,
  Search,
  X,
  LayoutGrid,
  LayoutList,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check
} from 'lucide-react'
import type { TabType } from '../../types'
import type { SortConfig, SortKey } from './projectUtils'
import { SORT_OPTIONS } from './projectUtils'

export type ViewMode = 'list' | 'grid'

interface ProjectsToolbarProps {
  tabs: Array<{ id: TabType; label: string; icon?: React.ReactNode }>
  currentTab: TabType
  searchOpen: boolean
  searchQuery: string
  refreshing: boolean
  backgroundScanning: boolean
  calculatingSizes: boolean
  addingProject: boolean
  viewMode: ViewMode
  sortConfig: SortConfig
  onTabClick: (tab: TabType) => void
  onToggleSearch: () => void
  onSearchChange: (value: string) => void
  onAddProject: () => void
  onRefresh: () => void
  onViewChange: (mode: ViewMode) => void
  onSortChange: (config: SortConfig) => void
}

const ProjectsToolbar: FC<ProjectsToolbarProps> = ({
  tabs,
  currentTab,
  searchOpen,
  searchQuery,
  refreshing,
  backgroundScanning,
  addingProject,
  viewMode,
  sortConfig,
  onTabClick,
  onToggleSearch,
  onSearchChange,
  onAddProject,
  onRefresh,
  onViewChange,
  onSortChange
}) => {
  const [sortOpen, setSortOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!sortOpen) return
    const handler = (e: MouseEvent): void => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [sortOpen])

  const handleSortKey = (key: SortKey): void => {
    if (sortConfig.key === key) {
      // Same key — flip direction
      onSortChange({ key, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })
    } else {
      // New key — sensible defaults: dates desc, name/version asc, size desc
      const defaultDir = key === 'name' || key === 'version' ? 'asc' : 'desc'
      onSortChange({ key, direction: defaultDir })
    }
    setSortOpen(false)
  }

  const activeLabel = SORT_OPTIONS.find((o) => o.key === sortConfig.key)?.label ?? 'Sort'
  const DirIcon = sortConfig.direction === 'asc' ? ArrowUp : ArrowDown

  return (
    <div
      className="flex items-center gap-3 py-3 shrink-0 border-b"
      style={{ borderColor: 'var(--color-border)' }}
    >
      {/* Tab switcher */}
      <div
        className="flex items-center gap-0.5 px-1 py-1 rounded-lg"
        style={{
          backgroundColor: 'var(--color-surface-card)',
          border: '1px solid var(--color-border)'
        }}
      >
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabClick(tab.id)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer"
              style={{
                color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                backgroundColor: isActive
                  ? 'color-mix(in srgb, var(--color-accent) 18%, var(--color-surface-elevated))'
                  : 'transparent',
                boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.3)' : 'none'
              }}
            >
              {tab.icon && (
                <span
                  style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
                >
                  {tab.icon}
                </span>
              )}
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Search input inline */}
      {searchOpen && (
        <div
          className="flex items-center gap-2 px-3 py-1.5 text-xs w-48"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-surface-card)',
            border: '1px solid var(--color-border)'
          }}
        >
          <Search size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <input
            autoFocus
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search projects…"
            className="flex-1 bg-transparent outline-none"
            style={{ color: 'var(--color-text-primary)' }}
          />
          {searchQuery && (
            <button onClick={() => onSearchChange('')} className="cursor-pointer shrink-0">
              <X size={11} style={{ color: 'var(--color-text-muted)' }} />
            </button>
          )}
        </div>
      )}

      <div className="flex-1" />

      <div className="flex items-center gap-1.5">
        {/* ── Sort dropdown ─────────────────────────────────────────── */}
        <div ref={sortRef} className="relative">
          <button
            onClick={() => setSortOpen((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer"
            style={{
              borderRadius: 'var(--radius)',
              backgroundColor: sortOpen
                ? 'color-mix(in srgb, var(--color-accent) 15%, var(--color-surface-card))'
                : 'var(--color-surface-card)',
              border: `1px solid ${sortOpen ? 'var(--color-accent)' : 'var(--color-border)'}`,
              color: 'var(--color-text-secondary)'
            }}
            title="Sort projects"
          >
            <ArrowUpDown
              size={12}
              style={{ color: sortOpen ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
            />
            {/* Electron runs at large min-width; make sort label always visible */}
            <span>{activeLabel}</span>
            <DirIcon size={10} style={{ color: 'var(--color-text-muted)' }} />
          </button>

          {sortOpen && (
            <div
              className="absolute right-0 top-full mt-1.5 z-50 py-1.5 w-44"
              style={{
                backgroundColor: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                fontSize: '12px'
              }}
            >
              {/* Direction toggle */}
              <div
                className="flex items-center gap-1 mx-2 mb-1.5 p-0.5 rounded"
                style={{ backgroundColor: 'var(--color-surface-card)' }}
              >
                {(['asc', 'desc'] as const).map((dir) => (
                  <button
                    key={dir}
                    onClick={() => onSortChange({ ...sortConfig, direction: dir })}
                    className="flex-1 flex items-center justify-center gap-1 py-0.5 rounded cursor-pointer transition-all"
                    style={{
                      fontSize: '11px',
                      fontWeight: sortConfig.direction === dir ? 600 : 400,
                      backgroundColor:
                        sortConfig.direction === dir
                          ? 'color-mix(in srgb, var(--color-accent) 20%, var(--color-surface-elevated))'
                          : 'transparent',
                      color:
                        sortConfig.direction === dir
                          ? 'var(--color-accent)'
                          : 'var(--color-text-muted)'
                    }}
                  >
                    {dir === 'asc' ? <ArrowUp size={9} /> : <ArrowDown size={9} />}
                    {dir === 'asc' ? 'Asc' : 'Desc'}
                  </button>
                ))}
              </div>

              <div
                className="mx-2 mb-1"
                style={{ height: '1px', backgroundColor: 'var(--color-border)' }}
              />

              {/* Sort key options */}
              {SORT_OPTIONS.map((opt) => {
                const isActive = sortConfig.key === opt.key
                return (
                  <button
                    key={opt.key}
                    onClick={() => handleSortKey(opt.key)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-1 transition-colors cursor-pointer"
                    style={{
                      fontSize: '12px',
                      color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                      backgroundColor: isActive
                        ? 'color-mix(in srgb, var(--color-accent) 8%, transparent)'
                        : 'transparent'
                    }}
                  >
                    <span>{opt.label}</span>
                    {isActive && (
                      <Check size={11} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* View toggle */}
        <div
          className="flex items-center overflow-hidden"
          style={{ borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}
        >
          <button
            onClick={() => onViewChange('list')}
            className="flex items-center p-1.5 cursor-pointer transition-colors"
            style={{
              backgroundColor:
                viewMode === 'list' ? 'var(--color-accent)' : 'var(--color-surface-card)',
              color: viewMode === 'list' ? 'var(--color-text-primary)' : 'var(--color-text-muted)'
            }}
            title="List view"
          >
            <LayoutList size={13} />
          </button>
          <button
            onClick={() => onViewChange('grid')}
            className="flex items-center p-1.5 cursor-pointer transition-colors"
            style={{
              backgroundColor:
                viewMode === 'grid' ? 'var(--color-accent)' : 'var(--color-surface-card)',
              color: viewMode === 'grid' ? 'var(--color-text-primary)' : 'var(--color-text-muted)'
            }}
            title="Grid view"
          >
            <LayoutGrid size={13} />
          </button>
        </div>

        {/* Search toggle */}
        <button
          onClick={onToggleSearch}
          className="flex items-center p-1.5 cursor-pointer transition-colors"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: searchOpen
              ? 'color-mix(in srgb, var(--color-accent) 20%, transparent)'
              : 'var(--color-surface-card)',
            color: searchOpen ? 'var(--color-accent)' : 'var(--color-text-muted)',
            border: '1px solid var(--color-border)'
          }}
          title="Search"
        >
          <Search size={13} />
        </button>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-surface-card)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)'
          }}
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing…' : backgroundScanning ? 'Scanning…' : 'Refresh'}
        </button>

        {/* Add Project */}
        <button
          onClick={onAddProject}
          disabled={addingProject}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-text-primary)'
          }}
        >
          <Plus size={12} />
          Add Project
        </button>
      </div>
    </div>
  )
}

export default ProjectsToolbar

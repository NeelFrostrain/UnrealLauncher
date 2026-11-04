// Copyright (c) 2026 NeelFrostrain. All rights reserved.

import { useEffect, useRef, useState, type FC } from 'react'
import { Plus, RefreshCw, Search, LayoutGrid, LayoutList, History, Filter } from 'lucide-react'
import type { TabType } from '../../types'
import type { SortConfig, EngineVersionFilter } from './projectUtils'
import { SortDropdown } from './toolbar/SortDropdown'

import { Tabs } from '../ui/Tabs'

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
  onOpenHistory: () => void
  onViewChange: (mode: ViewMode) => void
  onSortChange: (config: SortConfig) => void
  engineVersionFilter: EngineVersionFilter
  engineVersionOptions: Array<{ value: string; label: string }>
  onEngineVersionChange: (value: EngineVersionFilter) => void
}

function EngineVersionDropdown({
  value,
  options,
  onChange
}: {
  value: EngineVersionFilter
  options: Array<{ value: string; label: string }>
  onChange: (value: EngineVersionFilter) => void
}): React.ReactElement {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const activeOption = options.find((option) => option.value === value)
  const activeLabel = activeOption?.label ?? 'All'
  const displayLabel = value === 'all' ? 'All' : activeLabel

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((current) => !current)}
        className="h-7 flex items-center gap-1 px-2 text-xs font-medium transition-all cursor-pointer whitespace-nowrap"
        aria-label={`Filter by engine version: ${activeLabel}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          borderRadius: 'var(--radius)',
          backgroundColor: open
            ? 'color-mix(in srgb, var(--color-accent) 15%, var(--color-surface-card))'
            : 'var(--color-surface-card)',
          border: `1px solid ${open ? 'var(--color-accent)' : 'var(--color-border)'}`,
          color: 'var(--color-text-secondary)'
        }}
        title={`Filter projects by engine version (${activeLabel})`}
      >
        <Filter
          size={11}
          style={{ color: open ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
        />
        <span className="max-w-20 truncate">{displayLabel}</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 z-50 py-1.5 px-1 w-48"
          style={{
            backgroundColor: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
            fontSize: '12px'
          }}
        >
          {options.map((option) => {
            if (option.value === '__divider__') {
              return (
                <div
                  key="__divider__"
                  className="my-1 mx-2"
                  style={{ borderTop: '1px solid var(--color-border)' }}
                />
              )
            }
            const isBroken = option.value === 'broken'
            const isActive = value === (option.value as EngineVersionFilter)
            return (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value as EngineVersionFilter)
                  setOpen(false)
                }}
                className="w-full flex items-center justify-between gap-2 px-3 py-1.5 transition-colors cursor-pointer"
                style={{
                  color: isActive
                    ? 'var(--color-accent)'
                    : isBroken
                      ? 'color-mix(in srgb, #f87171 80%, var(--color-text-muted))'
                      : 'var(--color-text-secondary)',
                  backgroundColor: isActive
                    ? 'color-mix(in srgb, var(--color-accent) 8%, transparent)'
                    : 'transparent',
                  fontSize: '12px'
                }}
              >
                <span>{option.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

const ProjectsToolbar: FC<ProjectsToolbarProps> = ({
  tabs,
  currentTab,
  searchOpen,
  refreshing,
  backgroundScanning,
  calculatingSizes,
  addingProject,
  viewMode,
  sortConfig,
  onTabClick,
  onToggleSearch,
  onAddProject,
  onRefresh,
  onOpenHistory,
  onViewChange,
  onSortChange,
  engineVersionFilter,
  engineVersionOptions,
  onEngineVersionChange
}) => {
  return (
    <div
      className="flex items-center gap-3 py-3 shrink-0 border-b"
      style={{ borderColor: 'var(--color-border)' }}
    >
      {/* Left: Tabs */}
      <div className="flex items-center gap-2 min-w-0">
        <Tabs tabs={tabs} activeTab={currentTab} onChange={onTabClick} />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center ml-auto gap-1 shrink-0">
        <SortDropdown sortConfig={sortConfig} onSortChange={onSortChange} />
        <EngineVersionDropdown
          value={engineVersionFilter}
          options={engineVersionOptions}
          onChange={onEngineVersionChange}
        />

        {/* View Mode Toggle */}
        <div
          className="h-7 flex items-center overflow-hidden"
          style={{
            borderRadius: 'var(--radius)',
            border: '1px solid var(--color-border)'
          }}
        >
          <button
            onClick={() => onViewChange('list')}
            aria-label="List view"
            aria-pressed={viewMode === 'list'}
            className="h-full px-1.5 flex items-center justify-center cursor-pointer transition-colors"
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
            aria-label="Grid view"
            aria-pressed={viewMode === 'grid'}
            className="h-full px-1.5 flex items-center justify-center cursor-pointer transition-colors"
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

        {/* Project History */}
        <button
          onClick={onOpenHistory}
          aria-label="Open project history"
          className="h-7 w-7 flex items-center justify-center cursor-pointer transition-colors"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-surface-card)',
            color: 'var(--color-text-muted)',
            border: '1px solid var(--color-border)'
          }}
          title="Project history"
        >
          <History size={13} />
        </button>

        {/* Search */}
        <button
          onClick={onToggleSearch}
          aria-label={searchOpen ? 'Close search' : 'Open search'}
          aria-pressed={searchOpen}
          className="h-7 w-7 flex items-center justify-center cursor-pointer transition-colors"
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
        <div className="relative">
          <button
            onClick={onRefresh}
            disabled={refreshing || backgroundScanning}
            className="h-7 flex items-center gap-1 px-2 text-xs font-medium transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
            style={{
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--color-surface-card)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)'
            }}
            title="Refresh project list"
          >
            <RefreshCw
              size={11}
              className={refreshing || backgroundScanning ? 'animate-spin' : ''}
            />
            <span>
              {refreshing
                ? 'Refreshing…'
                : calculatingSizes
                  ? 'Calculating…'
                  : backgroundScanning
                    ? 'Scanning…'
                    : 'Refresh'}
            </span>
          </button>
          {calculatingSizes && (
            <span
              className="absolute -top-2 -right-2 px-1.5 py-0.2 text-[10px] font-semibold rounded-full pointer-events-none"
              style={{
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-text-primary)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.35)'
              }}
            >
              Sizes
            </span>
          )}
        </div>

        {/* Add Project */}
        <button
          onClick={onAddProject}
          disabled={addingProject}
          className="h-7 flex items-center gap-1 px-2.5 text-xs font-semibold text-white transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-accent)'
          }}
          title="Add Project"
        >
          <Plus size={12} />
          <span>Add Project</span>
        </button>
      </div>
    </div>
  )
}

export default ProjectsToolbar

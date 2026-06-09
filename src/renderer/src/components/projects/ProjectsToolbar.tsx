// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import type { FC } from 'react'
import { Plus, RefreshCw, Search, X, LayoutGrid, LayoutList } from 'lucide-react'
import type { TabType } from '../../types'
import type { SortConfig } from './projectUtils'
import { SortDropdown } from './toolbar/SortDropdown'

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
  calculatingSizes,
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
}) => (
  <div
    className="flex items-center gap-3 py-3 shrink-0 border-b"
    style={{ borderColor: 'var(--color-border)' }}
  >
    {/* Tab switcher */}
    <div
      role="tablist"
      aria-label="Project tabs"
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
            role="tab"
            aria-selected={isActive}
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
              <span style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
                {tab.icon}
              </span>
            )}
            {tab.label}
          </button>
        )
      })}
    </div>

    {/* Inline search */}
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
      {/* Sort */}
      <SortDropdown sortConfig={sortConfig} onSortChange={onSortChange} />

      {/* View toggle */}
      <div
        className="flex items-center overflow-hidden"
        style={{ borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}
      >
        <button
          onClick={() => onViewChange('list')}
          aria-label="List view"
          aria-pressed={viewMode === 'list'}
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
          aria-label="Grid view"
          aria-pressed={viewMode === 'grid'}
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
        aria-label={searchOpen ? 'Close search' : 'Open search'}
        aria-pressed={searchOpen}
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
      <div className="relative">
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
          {refreshing
            ? 'Refreshing…'
            : calculatingSizes
              ? 'Calculating sizes…'
              : backgroundScanning
                ? 'Scanning…'
                : 'Refresh'}
        </button>
        {calculatingSizes && (
          <span
            className="absolute -top-2 -right-2 px-2 py-0.5 text-[10px] font-semibold rounded-full"
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

export default ProjectsToolbar

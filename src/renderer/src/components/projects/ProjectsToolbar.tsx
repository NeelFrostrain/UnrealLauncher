import type { FC } from 'react'
import { Plus, RefreshCw, Search, X, LayoutGrid, LayoutList } from 'lucide-react'
import type { TabType } from '../../types'

export type ViewMode = 'list' | 'grid'

interface ProjectsToolbarProps {
  tabs: Array<{ id: TabType; label: string; icon?: React.ReactNode }>
  currentTab: TabType
  searchOpen: boolean
  searchQuery: string
  refreshing: boolean
  calculatingSizes: boolean
  addingProject: boolean
  viewMode: ViewMode
  onTabClick: (tab: TabType) => void
  onToggleSearch: () => void
  onSearchChange: (value: string) => void
  onAddProject: () => void
  onRefresh: () => void
  onViewChange: (mode: ViewMode) => void
}

const ProjectsToolbar: FC<ProjectsToolbarProps> = ({
  tabs,
  currentTab,
  searchOpen,
  searchQuery,
  refreshing,
  addingProject,
  viewMode,
  onTabClick,
  onToggleSearch,
  onSearchChange,
  onAddProject,
  onRefresh,
  onViewChange
}) => {
  return (
    <div
      className="flex items-center gap-3 py-3 shrink-0 border-b"
      style={{ borderColor: 'var(--color-border)' }}
    >
      {/* Page identity */}
      {/* <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent) 15%, transparent)' }}
        >
          <FolderOpen size={14} style={{ color: 'var(--color-accent)' }} />
        </div>
      </div> */}

      {/* Tab switcher — same style as EnginesPage */}
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
          {refreshing ? 'Refreshing…' : 'Refresh'}
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

        {/* Sizing indicator */}
        {/* {calculatingSizes && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5"
            style={{
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--color-surface-card)',
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border)'
            }}
          >
            <HardDrive size={12} className="animate-pulse" style={{ color: 'var(--color-accent)' }} />
            <span className="text-[11px]">Sizing…</span>
          </div>
        )} */}
      </div>
    </div>
  )
}

export default ProjectsToolbar

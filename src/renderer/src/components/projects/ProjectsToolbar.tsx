import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Plus, RefreshCw, Search, List, Grid3X3, HardDrive } from 'lucide-react'
import type { TabType } from '../../types'

export type ViewMode = 'list' | 'grid'

interface ProjectsToolbarProps {
  tabs: Array<{ id: TabType; label: string }>
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
  calculatingSizes,
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
    <motion.div
      className="flex items-center gap-2 px-2 pt-3 pb-2"
      style={{ borderBottom: '1px solid var(--color-border)' }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabClick(tab.id)}
          className="px-4 py-2 rounded-t-md font-medium text-sm transition-colors cursor-pointer"
          style={{
            backgroundColor:
              currentTab === tab.id ? 'var(--color-accent)' : 'var(--color-surface-card)',
            color: currentTab === tab.id ? 'white' : 'var(--color-text-muted)'
          }}
        >
          {tab.label}
        </button>
      ))}

      {searchOpen && (
        <div
          className="flex min-w-0 h-full items-center gap-2 px-3 rounded-md text-sm max-w-65 transition-all"
          style={{
            backgroundColor: 'var(--color-surface-card)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-secondary)'
          }}
        >
          <Search size={16} style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search projects"
            className="min-w-0 w-full bg-transparent text-sm outline-none placeholder:text-white/30"
            style={{ color: 'var(--color-text-primary)' }}
          />
        </div>
      )}

      <div className="flex-1" />

      {/* View toggle */}
      <div
        className="flex items-center rounded-md overflow-hidden"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <button
          onClick={() => onViewChange('list')}
          className="flex p-2 cursor-pointer transition-colors"
          style={{
            backgroundColor:
              viewMode === 'list' ? 'var(--color-accent)' : 'var(--color-surface-card)',
            color: viewMode === 'list' ? 'white' : 'var(--color-text-muted)'
          }}
          title="List view"
        >
          <List size={16} />
        </button>
        <button
          onClick={() => onViewChange('grid')}
          className="flex p-2 cursor-pointer transition-colors"
          style={{
            backgroundColor:
              viewMode === 'grid' ? 'var(--color-accent)' : 'var(--color-surface-card)',
            color: viewMode === 'grid' ? 'white' : 'var(--color-text-muted)'
          }}
          title="Grid view"
        >
          <Grid3X3 size={16} />
        </button>
      </div>

      <button
        onClick={onToggleSearch}
        className="flex items-center gap-2 px-3 py-2 rounded-md transition-all cursor-pointer"
        style={{
          backgroundColor: searchOpen
            ? 'color-mix(in srgb, var(--color-accent) 20%, transparent)'
            : 'var(--color-surface-card)',
          color: searchOpen ? 'var(--color-accent)' : 'var(--color-text-muted)',
          border: '1px solid var(--color-border)'
        }}
        title="Search projects"
      >
        <Search size={16} />
      </button>

      <button
        onClick={onAddProject}
        disabled={addingProject}
        className="flex items-center gap-2 px-3 py-2 rounded-md text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        style={{ backgroundColor: 'var(--color-accent)' }}
        title="Add Project"
      >
        <Plus size={16} />
      </button>

      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="flex items-center gap-2 px-3 py-2 rounded-md transition-all disabled:opacity-50 cursor-pointer"
        style={{
          backgroundColor: 'var(--color-surface-card)',
          color: 'var(--color-text-muted)',
          border: '1px solid var(--color-border)'
        }}
        title="Refresh"
      >
        <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
      </button>

      {calculatingSizes && (
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded-md"
          style={{
            backgroundColor: 'var(--color-surface-card)',
            color: 'var(--color-text-muted)',
            border: '1px solid var(--color-border)'
          }}
          title="Calculating project sizes…"
        >
          <HardDrive size={13} className="animate-pulse" style={{ color: 'var(--color-accent)' }} />
          <span className="text-[10px]">Sizing…</span>
        </div>
      )}
    </motion.div>
  )
}

export default ProjectsToolbar

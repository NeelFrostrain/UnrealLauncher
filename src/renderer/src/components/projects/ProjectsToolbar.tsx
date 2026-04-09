import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Plus, RefreshCw, Search, List, Grid3X3 } from 'lucide-react'
import type { TabType } from '../../types'

export type ViewMode = 'list' | 'grid'

interface ProjectsToolbarProps {
  tabs: Array<{ id: TabType; label: string }>
  currentTab: TabType
  searchOpen: boolean
  searchQuery: string
  refreshing: boolean
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
  tabs, currentTab, searchOpen, searchQuery, refreshing, addingProject, viewMode,
  onTabClick, onToggleSearch, onSearchChange, onAddProject, onRefresh, onViewChange
}) => {
  return (
    <motion.div
      className="flex items-center gap-2 px-2 pt-3 pb-2 border-b border-white/10"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabClick(tab.id)}
          className={`px-4 py-2 rounded-t-md font-medium text-sm transition-colors ${
            currentTab === tab.id
              ? 'bg-blue-600 text-white'
              : 'bg-white/5 text-white/50'
          }`}
        >
          {tab.label}
        </button>
      ))}

      {searchOpen && (
        <div className="flex min-w-0 h-full items-center gap-2 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-white/80 max-w-65 transition-all">
          <Search size={16} className="text-white/70" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search projects"
            className="min-w-0 w-full bg-transparent text-sm outline-none text-white placeholder:text-white/40"
          />
        </div>
      )}

      <div className="flex-1" />

      {/* View toggle */}
      <div className="flex items-center bg-white/5 border border-white/10 rounded-md overflow-hidden">
        <button
          onClick={() => onViewChange('list')}
          className={`flex p-2 cursor-pointer transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-white/40'}`}
          title="List view"
        >
          <List size={16} />
        </button>
        <button
          onClick={() => onViewChange('grid')}
          className={`flex p-2 cursor-pointer transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-white/40'}`}
          title="Grid view"
        >
          <Grid3X3 size={16} />
        </button>
      </div>

      <button
        onClick={onToggleSearch}
        className={`flex items-center gap-2 px-3 py-2 rounded-md ${
          searchOpen ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
        } transition-all`}
        title="Search projects"
      >
        <Search size={16} />
      </button>

      <button
        onClick={onAddProject}
        disabled={addingProject}
        className="flex items-center gap-2 px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        title="Add Project"
      >
        <Plus size={16} />
      </button>

      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="flex items-center gap-2 px-3 py-2 rounded-md bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all disabled:opacity-50"
        title="Refresh"
      >
        <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
      </button>
    </motion.div>
  )
}

export default ProjectsToolbar

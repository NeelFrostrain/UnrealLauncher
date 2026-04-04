import { motion } from 'framer-motion'
import type { FC } from 'react'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import type { TabType } from '../types'

interface ProjectsToolbarProps {
  tabs: Array<{ id: TabType; label: string }>
  currentTab: TabType
  searchOpen: boolean
  searchQuery: string
  refreshing: boolean
  addingProject: boolean
  onTabClick: (tab: TabType) => void
  onToggleSearch: () => void
  onSearchChange: (value: string) => void
  onAddProject: () => void
  onRefresh: () => void
}

const ProjectsToolbar: FC<ProjectsToolbarProps> = ({
  tabs,
  currentTab,
  searchOpen,
  searchQuery,
  refreshing,
  addingProject,
  onTabClick,
  onToggleSearch,
  onSearchChange,
  onAddProject,
  onRefresh
}) => {
  return (
    <motion.div
      className="flex items-center gap-2 px-2 pt-3 pb-2 border-b border-white/10"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {tabs.map((tab) => (
        <motion.button
          key={tab.id}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onTabClick(tab.id)}
          className={`px-4 py-2 rounded-t-md font-medium text-sm transition-all ${
            currentTab === tab.id
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'bg-white/5 text-white/70 hover:bg-white/10'
          }`}
        >
          {tab.label}
        </motion.button>
      ))}

      {searchOpen && (
        <div className="flex min-w-0 h-full items-center gap-2 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-white/80 max-w-65 transition-all">
          <SearchIcon sx={{ fontSize: 16 }} className="text-white/70" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search projects"
            className="min-w-0 w-full bg-transparent text-sm outline-none text-white placeholder:text-white/40"
          />
        </div>
      )}

      <div className="flex-1" />
      <button
        onClick={onToggleSearch}
        className={`flex items-center gap-2 px-3 py-2 rounded-md ${
          searchOpen
            ? 'bg-blue-600 text-white'
            : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
        } transition-all`}
        title="Search projects by name"
      >
        <SearchIcon sx={{ fontSize: 16 }} />
      </button>
      <button
        onClick={onAddProject}
        disabled={addingProject}
        className="flex items-center gap-2 px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        title="Add Project"
      >
        <AddIcon sx={{ fontSize: 16 }} />
      </button>
      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="flex items-center gap-2 px-3 py-2 rounded-md bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all disabled:opacity-50"
        title="Refresh projects for this tab"
      >
        <RefreshIcon sx={{ fontSize: 16 }} className={refreshing ? 'animate-spin' : ''} />
      </button>
    </motion.div>
  )
}

export default ProjectsToolbar

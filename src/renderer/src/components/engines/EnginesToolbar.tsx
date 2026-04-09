import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Plus, RefreshCw } from 'lucide-react'

interface EnginesToolbarProps {
  scanning: boolean
  addingEngine: boolean
  onAddEngine: () => void
  onScan: () => void
}

const EnginesToolbar: FC<EnginesToolbarProps> = ({
  scanning,
  addingEngine,
  onAddEngine,
  onScan
}) => {
  return (
    <motion.div
      className="flex items-center gap-2 px-2 py-1 border-b border-white/10"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div>
        <h1 className="font-semibold text-xl">Engines</h1>
        <p className="text-sm mt-px text-white/50">Installed Unreal Engine versions</p>
      </div>

      <div className="flex-1" />
      <motion.button
        onClick={onAddEngine}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        disabled={addingEngine}
        className="flex items-center gap-2 px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        title="Add Engine"
      >
        <Plus size={16} />
      </motion.button>
      <motion.button
        onClick={onScan}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        disabled={scanning}
        className="flex items-center gap-2 px-3 py-2 rounded-md bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all disabled:opacity-50"
        title="Scan for engines"
      >
        <RefreshCw size={16} className={scanning ? 'animate-spin' : ''} />
      </motion.button>
    </motion.div>
  )
}

export default EnginesToolbar

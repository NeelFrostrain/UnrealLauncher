import { useEffect, useState, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Project } from '../../types'
import { Play, FolderOpen, Trash2, Star, Clock, Database } from 'lucide-react'
import { resolveAsset } from '../../utils/resolveAsset'

const formatVersion = (v: string): string => {
  if (!v || v === 'Unknown') return '?'
  if (v.startsWith('{') || v.length > 12) return 'Custom'
  return v
}

const formatDate = (d: string): string => {
  try {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch {
    return d
  }
}

const ProjectCardGrid = memo(
  ({
    createdAt,
    lastOpenedAt,
    name,
    size,
    version,
    thumbnail,
    projectPath,
    isFavorite,
    onToggleFavorite,
    onLaunch,
    onOpenDir,
    onDelete
  }: Project & {
    isFavorite: boolean
    onToggleFavorite: (p: string) => void
    onLaunch: (p: string) => void
    onOpenDir: (p: string) => void
    onDelete: (p: string) => void
  }) => {
    const [launching, setLaunching] = useState(false)
    const [currentSize, setCurrentSize] = useState(size)
    const [hovered, setHovered] = useState(false)

    const imageSrc = thumbnail
      ? `local-asset:///${thumbnail.replace(/\\/g, '/')}`
      : resolveAsset(undefined)

    useEffect(() => {
      setCurrentSize(size)
    }, [size])

    const handleLaunch = (): void => {
      if (!projectPath) return
      setLaunching(true)
      onLaunch(projectPath)
      setTimeout(() => setLaunching(false), 3000)
    }

    const dateLabel = lastOpenedAt ? formatDate(lastOpenedAt) : createdAt
    const dateType = lastOpenedAt ? 'Opened' : 'Created'
    const versionLabel = formatVersion(version)

    return (
      <motion.div
        className="relative w-full h-48 overflow-hidden cursor-pointer select-none bg-[#111] border-2 border-transparent hover:border-none transition-all duration-300"
        style={{ borderRadius: 'var(--radius)' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
      >
        {/* Thumbnail */}
        <img
          src={imageSrc}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover bg-center"
          onError={(e) => {
            e.currentTarget.src = resolveAsset(undefined)
          }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-2.5 inset-x-2.5 z-10 flex items-center justify-between">
          <div className="bg-black/65 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded-md text-[10px] font-mono text-blue-400 tracking-wider">
            UE {versionLabel}
          </div>
          <motion.button
            whileTap={{ scale: 0.82 }}
            onClick={() => projectPath && onToggleFavorite(projectPath)}
            className="flex p-1.5 rounded-md bg-black/50 backdrop-blur-md border border-white/10 hover:bg-black/70 transition-colors"
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorite ? (
              <Star size={14} fill="currentColor" className="text-yellow-400" />
            ) : (
              <Star size={14} className="text-white/40" />
            )}
          </motion.button>
        </div>

        {/* Launching overlay */}
        <AnimatePresence>
          {launching && (
            <motion.div
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin mb-2" />
              <p className="text-xs text-white/70 tracking-wide">Launching…</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hover overlay — slides up from bottom only */}
        <AnimatePresence>
          {hovered && !launching && (
            <motion.div
              className="absolute bottom-0 inset-x-0 z-20 flex items-center justify-between px-4 gap-2 bg-gradient-to-t from-black/80 to-transparent py-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={handleLaunch}
                className="flex w-full justify-center items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-xs font-bold shadow-lg shadow-blue-600/40 transition-colors cursor-pointer"
              >
                <Play size={14} />
                Launch
              </motion.button>

              <div className="flex gap-1.5">
                <motion.button
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => projectPath && onOpenDir(projectPath)}
                  className="flex p-2 rounded-md bg-white/10 hover:bg-white/20 border border-white/20 transition-colors cursor-pointer"
                  title="Open Folder"
                >
                  <FolderOpen size={14} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => projectPath && onDelete(projectPath)}
                  className="flex p-2 rounded-md bg-white/10 hover:bg-red-500/30 border border-white/20 hover:border-red-500/40 transition-colors cursor-pointer text-white/60 hover:text-red-400"
                  title="Remove from list"
                >
                  <Trash2 size={14} />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom info — hidden on hover */}
        <div
          className={`absolute bottom-0 inset-x-0 z-10 px-3 py-2.5 transition-opacity duration-150 ${hovered ? 'opacity-0' : 'opacity-100'}`}
        >
          <p className="text-sm font-semibold text-white truncate mb-1.5" title={name}>
            {name}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-white/45">
              <Clock size={10} />
              <span className="text-[10px]">
                {dateType} {dateLabel}
              </span>
            </div>
            <div className="flex items-center gap-1 text-white/45">
              <Database size={10} />
              <span className="text-[10px] font-mono">{currentSize}</span>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }
)

ProjectCardGrid.displayName = 'ProjectCardGrid'
export default ProjectCardGrid

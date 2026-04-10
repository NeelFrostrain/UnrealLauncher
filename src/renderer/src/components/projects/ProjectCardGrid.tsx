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
        className="relative w-full h-48 overflow-hidden cursor-pointer select-none border-2 transition-all duration-300"
        style={{
          borderRadius: 'var(--radius)',
          backgroundColor: 'var(--color-surface-card)',
          borderColor: hovered ? 'var(--color-accent)' : 'transparent'
        }}
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
        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-2.5 inset-x-2.5 z-10 flex items-center justify-between">
          <div className="bg-black/65 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono tracking-wider"
            style={{ borderRadius: 'calc(var(--radius) * 0.5)', border: '1px solid rgba(255,255,255,0.12)', color: 'color-mix(in srgb, var(--color-accent) 90%, white)' }}>
            UE {versionLabel}
          </div>
          <motion.button
            whileTap={{ scale: 0.82 }}
            onClick={() => projectPath && onToggleFavorite(projectPath)}
            className="flex p-1.5 bg-black/50 backdrop-blur-md transition-colors cursor-pointer"
            style={{ borderRadius: 'calc(var(--radius) * 0.5)', border: '1px solid rgba(255,255,255,0.12)' }}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorite
              ? <Star size={14} fill="currentColor" className="text-yellow-400" />
              : <Star size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />}
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
              className="absolute bottom-0 inset-x-0 z-20 flex items-center justify-between px-4 gap-2 bg-linear-to-t from-black/80 to-transparent py-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={handleLaunch}
                className="flex w-full justify-center items-center gap-1.5 px-4 py-2 bg-blue-600 text-xs font-bold shadow-lg shadow-blue-600/40 transition-colors cursor-pointer"
                style={{
                  borderRadius: 'var(--radius)',
                  backgroundColor: 'var(--color-surface-card)',
                  borderColor: hovered ? 'var(--color-accent)' : 'transparent'
                }}
              >
                <Play size={14} />
                Launch
              </motion.button>

              <div className="flex gap-1.5">
                <motion.button
                  whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                  onClick={() => projectPath && onOpenDir(projectPath)}
                  className="flex p-2 transition-colors cursor-pointer"
                  style={{ borderRadius: 'calc(var(--radius) * 0.6)', backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }}
                  title="Open Folder"
                >
                  <FolderOpen size={14} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                  onClick={() => projectPath && onDelete(projectPath)}
                  className="flex p-2 hover:bg-red-500/30 hover:border-red-500/40 hover:text-red-400 transition-colors cursor-pointer"
                  style={{ borderRadius: 'calc(var(--radius) * 0.6)', backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}
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
          <p className="text-sm font-semibold text-white truncate mb-1.5" title={name}>{name}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <Clock size={10} />
              <span className="text-[10px]">{dateType} {dateLabel}</span>
            </div>
            <div className="flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
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

import { useEffect, useState, useRef, memo } from 'react'
import { motion } from 'framer-motion'
import type { Project } from '../../types'
import { Play, FolderOpen, Trash2, Star, Clock, Database, MoreVertical } from 'lucide-react'
import DropdownPortal from '../ui/DropdownPortal'

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

const ProjectCard = memo(
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
    const [menuOpen, setMenuOpen] = useState(false)
    const menuBtnRef = useRef<HTMLButtonElement>(null)

    // Convert absolute disk path → local-asset:// URL directly in the renderer.
    // No IPC round-trip, no base64 — the protocol handler serves the file.
    const imageSrc = thumbnail ? `local-asset:///${thumbnail.replace(/\\/g, '/')}` : null

    useEffect(() => {
      setCurrentSize(size)
    }, [size])

    const handleLaunch = async (): Promise<void> => {
      if (!projectPath) return
      setLaunching(true)
      onLaunch(projectPath)
      setTimeout(() => setLaunching(false), 3000)
    }

    const dateLabel = lastOpenedAt ? formatDate(lastOpenedAt) : createdAt
    const dateType = lastOpenedAt ? 'Opened' : 'Created'

    return (
      <motion.div
        className="w-full bg-[#161616] border border-white/10 rounded-sm hover:bg-black/50 hover:border-white/20 transition-colors"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <div className="flex items-center gap-3 px-3 py-2.5 min-h-18">
          {/* Thumbnail */}
          <div className="w-16 h-16 shrink-0 rounded-md overflow-hidden bg-white/5 border border-white/8 flex items-center justify-center">
            {imageSrc ? (
              <img src={imageSrc} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white/15 text-2xl font-black overflow-hidden">
                {name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-white/90 truncate" title={name}>
                {name}
              </p>
              <span className="shrink-0 text-[10px] font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-px rounded">
                UE {formatVersion(version)}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-white/40">
                <Clock size={11} />
                <span className="text-[10px]">
                  {dateType} {dateLabel}
                </span>
              </div>
              <div className="flex items-center gap-1 text-white/40">
                <Database size={11} />
                <span className="text-[10px] font-mono">{currentSize}</span>
              </div>
            </div>
          </div>

          {/* Launch + 3-dot menu */}
          <div className="shrink-0 flex items-center gap-2 pl-3 border-l border-white/8">
            {/* Launch button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLaunch}
              disabled={launching}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                launching ? 'bg-green-600/70 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'
              }`}
            >
              <Play size={13} className={launching ? 'animate-pulse' : ''} />
              {launching ? 'Launching…' : 'Launch'}
            </motion.button>

            {/* 3-dot dropdown */}
            <div className="relative">
              <motion.button
                ref={menuBtnRef}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setMenuOpen((p) => !p)}
                className="flex p-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white/80 transition-colors cursor-pointer"
                title="More options"
              >
                <MoreVertical size={16} />
              </motion.button>

              <DropdownPortal
                open={menuOpen}
                anchorRef={menuBtnRef}
                onClose={() => setMenuOpen(false)}
              >
                <button
                  onClick={() => {
                    projectPath && onToggleFavorite(projectPath)
                    setMenuOpen(false)
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-white/70 hover:bg-white/8 hover:text-white transition-colors cursor-pointer"
                >
                  {isFavorite ? (
                    <Star size={15} fill="currentColor" className="text-yellow-400" />
                  ) : (
                    <Star size={15} className="text-white/40" />
                  )}
                  {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                </button>
                <button
                  onClick={() => {
                    projectPath && onOpenDir(projectPath)
                    setMenuOpen(false)
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-white/70 hover:bg-white/8 hover:text-white transition-colors cursor-pointer"
                >
                  <FolderOpen size={15} className="text-white/40" />
                  Open Folder
                </button>
                <div className="h-px bg-white/8 mx-2" />
                <button
                  onClick={() => {
                    projectPath && onDelete(projectPath)
                    setMenuOpen(false)
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer"
                >
                  <Trash2 size={15} />
                  Remove from List
                </button>
              </DropdownPortal>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }
)

ProjectCard.displayName = 'ProjectCard'
export default ProjectCard

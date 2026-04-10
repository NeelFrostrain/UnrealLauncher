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
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return d }
}

const ProjectCard = memo(
  ({
    createdAt, lastOpenedAt, name, size, version, thumbnail, projectPath,
    isFavorite, onToggleFavorite, onLaunch, onOpenDir, onDelete
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

    const imageSrc = thumbnail ? `local-asset:///${thumbnail.replace(/\\/g, '/')}` : null

    useEffect(() => { setCurrentSize(size) }, [size])

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
        className="w-full transition-colors"
        style={{
          backgroundColor: 'var(--color-surface-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)'
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <div className="flex items-center gap-3 px-3 py-2.5 min-h-18">
          {/* Thumbnail */}
          <div className="w-16 h-16 shrink-0 overflow-hidden flex items-center justify-center"
            style={{ borderRadius: 'var(--radius)', backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }}>
            {imageSrc ? (
              <img src={imageSrc} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-black" style={{ color: 'var(--color-border)' }}>
                {name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }} title={name}>
                {name}
              </p>
              <span className="shrink-0 text-[10px] font-mono px-1.5 py-px"
                style={{ color: 'color-mix(in srgb, var(--color-accent) 90%, white)', backgroundColor: 'color-mix(in srgb, var(--color-accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)', borderRadius: 'calc(var(--radius) * 0.5)' }}>
                UE {formatVersion(version)}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                <Clock size={11} />
                <span className="text-[10px]">{dateType} {dateLabel}</span>
              </div>
              <div className="flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                <Database size={11} />
                <span className="text-[10px] font-mono">{currentSize}</span>
              </div>
            </div>
          </div>

          {/* Launch + 3-dot menu */}
          <div className="shrink-0 flex items-center gap-2 pl-3" style={{ borderLeft: '1px solid var(--color-border)' }}>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handleLaunch} disabled={launching}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${launching ? 'bg-green-600/70 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'}`}
              style={{ borderRadius: 'var(--radius)', color: 'var(--color-text-primary)' }}
            >
              <Play size={13} className={launching ? 'animate-pulse' : ''} />
              {launching ? 'Launching…' : 'Launch'}
            </motion.button>

            <div className="relative">
              <motion.button
                ref={menuBtnRef}
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                onClick={() => setMenuOpen((p) => !p)}
                className="flex p-1.5 transition-colors cursor-pointer"
                style={{ borderRadius: 'var(--radius)', backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
                title="More options"
              >
                <MoreVertical size={16} />
              </motion.button>

              <DropdownPortal open={menuOpen} anchorRef={menuBtnRef} onClose={() => setMenuOpen(false)}>
                <button
                  onClick={() => { projectPath && onToggleFavorite(projectPath); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors cursor-pointer"
                  style={{ color: 'var(--color-text-secondary)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-card)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {isFavorite
                    ? <Star size={15} fill="currentColor" className="text-yellow-400" />
                    : <Star size={15} style={{ color: 'var(--color-text-muted)' }} />}
                  {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                </button>
                <button
                  onClick={() => { projectPath && onOpenDir(projectPath); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors cursor-pointer"
                  style={{ color: 'var(--color-text-secondary)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-card)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <FolderOpen size={15} style={{ color: 'var(--color-text-muted)' }} />
                  Open Folder
                </button>
                <div className="h-px mx-2" style={{ backgroundColor: 'var(--color-border)' }} />
                <button
                  onClick={() => { projectPath && onDelete(projectPath); setMenuOpen(false) }}
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

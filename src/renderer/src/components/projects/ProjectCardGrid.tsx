import { useEffect, useState, useRef, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import type { Project } from '../../types'
import {
  FolderOpen, Trash2, Star, Clock, Database,
  GitBranch, ScrollText, GitMerge
} from 'lucide-react'
import { resolveAsset } from '../../utils/resolveAsset'
import ProjectLogDialog from './ProjectLogDialog'

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

// ── Context menu ──────────────────────────────────────────────────────────────
interface CtxMenuProps {
  x: number; y: number; name: string
  isFavorite: boolean; gitInitialized: boolean; gitBranch: string
  onFavorite: () => void; onOpenDir: () => void; onDelete: () => void
  onViewLogs: () => void; onGitInit: () => void; onClose: () => void
}

function ContextMenu(p: CtxMenuProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: p.y, left: p.x })

  useEffect(() => {
    if (ref.current) {
      const { offsetWidth: w, offsetHeight: h } = ref.current
      setPos({ top: Math.min(p.y, window.innerHeight - h - 8), left: Math.min(p.x, window.innerWidth - w - 8) })
    }
  }, [p.x, p.y])

  useEffect(() => {
    const t = setTimeout(() => {
      const h = (e: PointerEvent): void => { if (ref.current && !ref.current.contains(e.target as Node)) p.onClose() }
      document.addEventListener('pointerdown', h)
      return () => document.removeEventListener('pointerdown', h)
    }, 50)
    return () => clearTimeout(t)
  }, [p.onClose])

  const Item = ({ icon, label, onClick, danger = false, disabled = false }: {
    icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean; disabled?: boolean
  }): React.ReactElement => (
    <button
      onClick={() => { if (!disabled) { onClick(); p.onClose() } }}
      disabled={disabled}
      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs cursor-pointer transition-all disabled:opacity-40 disabled:cursor-default"
      style={{ color: danger ? '#f87171' : 'var(--color-text-secondary)' }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = danger ? 'rgba(248,113,113,0.1)' : 'var(--color-surface-card)' }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
    >
      <span className="shrink-0">{icon}</span>{label}
    </button>
  )

  const Sep = (): React.ReactElement => <div className="h-px mx-3 my-1" style={{ backgroundColor: 'var(--color-border)' }} />
  const Label = ({ text }: { text: string }): React.ReactElement => (
    <p className="px-3 pt-2 pb-0.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>{text}</p>
  )

  return createPortal(
    <motion.div ref={ref} className="fixed z-9999 w-56 overflow-hidden select-none"
      style={{ top: pos.top, left: pos.left, backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}
      initial={{ opacity: 0, scale: 0.96, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.12 }}
    >
      {/* Header */}
      <div className="px-3 py-2.5" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{p.name}</p>
        {p.gitInitialized && (
          <div className="flex items-center gap-1 mt-0.5">
            <GitBranch size={10} style={{ color: '#34d399' }} />
            <span className="text-[10px] font-mono" style={{ color: '#34d399' }}>{p.gitBranch}</span>
          </div>
        )}
      </div>
      <div className="py-1">
        <Label text="Project" />
        <Item icon={<Star size={13} fill={p.isFavorite ? '#facc15' : 'none'} style={{ color: p.isFavorite ? '#facc15' : 'var(--color-text-muted)' }} />}
          label={p.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'} onClick={p.onFavorite} />
        <Item icon={<FolderOpen size={13} style={{ color: 'var(--color-text-muted)' }} />} label="Open in Explorer" onClick={p.onOpenDir} />
        <Sep />
        <Label text="Tools" />
        <Item icon={<ScrollText size={13} style={{ color: 'var(--color-accent)' }} />} label="View Logs" onClick={p.onViewLogs} />
        {p.gitInitialized
          ? <Item icon={<GitBranch size={13} style={{ color: '#34d399' }} />} label={`Git: ${p.gitBranch}`} onClick={() => {}} disabled />
          : <Item icon={<GitMerge size={13} style={{ color: '#a78bfa' }} />} label="Initialize Git Repo" onClick={p.onGitInit} />}
        <Sep />
        <Item icon={<Trash2 size={13} />} label="Remove from List" onClick={p.onDelete} danger />
      </div>
    </motion.div>,
    document.body
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────
const ProjectCardGrid = memo(
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
    const [hovered, setHovered] = useState(false)
    const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null)
    const [showLogs, setShowLogs] = useState(false)
    const [git, setGit] = useState<{ initialized: boolean; branch: string }>({ initialized: false, branch: '' })

    const imageSrc = thumbnail
      ? `local-asset:///${thumbnail.replace(/\\/g, '/')}`
      : resolveAsset(undefined)

    useEffect(() => { setCurrentSize(size) }, [size])
    useEffect(() => {
      if (projectPath) window.electronAPI.projectGitStatus(projectPath).then(s => setGit({ initialized: s.initialized, branch: s.branch }))
    }, [projectPath])

    const handleClick = useCallback((): void => {
      if (!projectPath || launching) return
      setLaunching(true)
      onLaunch(projectPath)
      setTimeout(() => setLaunching(false), 3000)
    }, [projectPath, launching, onLaunch])

    const handleContextMenu = useCallback((e: React.MouseEvent): void => {
      e.preventDefault()
      setCtxMenu({ x: e.clientX, y: e.clientY })
    }, [])

    const handleGitInit = useCallback(async (): Promise<void> => {
      if (!projectPath) return
      const r = await window.electronAPI.projectGitInit(projectPath)
      if (r.success) setGit({ initialized: true, branch: 'main' })
    }, [projectPath])

    const dateLabel = lastOpenedAt ? formatDate(lastOpenedAt) : createdAt
    const dateType = lastOpenedAt ? 'Opened' : 'Created'

    return (
      <>
        {/* ── Original full-bleed card style, enhanced ── */}
        <motion.div
          className="relative w-full h-48 overflow-hidden cursor-pointer select-none border-2"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-surface-card)',
            borderColor: hovered ? 'var(--color-accent)' : 'transparent',
            transition: 'border-color 150ms ease'
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
        >
          {/* Thumbnail */}
          <img src={imageSrc} alt={name}
            className="absolute inset-0 w-full h-full object-cover bg-center"
            style={{ transform: hovered ? 'scale(1.04)' : 'scale(1)', transition: 'transform 400ms ease' }}
            onError={(e) => { e.currentTarget.src = resolveAsset(undefined) }} />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent" />

          {/* Top badges */}
          <div className="absolute top-2.5 inset-x-2.5 z-10 flex items-center justify-between">
              {/* UE version */}
              <div className="bg-black/65 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono tracking-wider"
                style={{ borderRadius: 'calc(var(--radius) * 0.5)', border: '1px solid rgba(255,255,255,0.12)', color: 'color-mix(in srgb, var(--color-accent) 90%, white)' }}>
                UE {formatVersion(version)}
              </div>
              {/* Git badge */}
              {git.initialized && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-black/65 backdrop-blur-md"
                  style={{ borderRadius: 'calc(var(--radius) * 0.5)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399' }}>
                  <GitBranch size={9} />
                  <span className="text-[9px] font-mono">{git.branch}</span>
                </div>
              )}
   
            {/* Favorite */}
            {/* <motion.button
              whileTap={{ scale: 0.82 }}
              onClick={(e) => { e.stopPropagation(); projectPath && onToggleFavorite(projectPath) }}
              className="flex p-1.5 bg-black/50 backdrop-blur-md cursor-pointer"
              style={{ borderRadius: 'calc(var(--radius) * 0.5)', border: `1px solid ${isFavorite ? 'rgba(250,204,21,0.5)' : 'rgba(255,255,255,0.1)'}` }}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star size={14} fill={isFavorite ? '#facc15' : 'none'} style={{ color: isFavorite ? '#facc15' : 'rgba(255,255,255,0.4)' }} />
            </motion.button> */}
          </div>

          {/* Launching overlay */}
          <AnimatePresence>
            {launching && (
              <motion.div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="w-8 h-8 rounded-full border-2 animate-spin mb-2"
                  style={{ borderColor: 'color-mix(in srgb, var(--color-accent) 30%, transparent)', borderTopColor: 'var(--color-accent)' }} />
                <p className="text-xs tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>Launching…</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hover overlay — slides up from bottom */}
          <AnimatePresence>
            {hovered && !launching && (
              <motion.div
                className="absolute bottom-0 inset-x-0 z-20 flex items-center justify-between px-3 gap-2 py-3 bg-linear-to-t from-black/85 to-transparent"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <p className='w-full h-fit text-center text-xs opacity-60'>L-Click: Launch | R-Click: Options</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom info — hidden on hover */}
          <div className={`absolute bottom-0 inset-x-0 z-10 px-3 py-2.5 transition-opacity duration-150 ${hovered ? 'opacity-0' : 'opacity-100'}`}>
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

        {ctxMenu && (
          <ContextMenu
            x={ctxMenu.x} y={ctxMenu.y} name={name}
            isFavorite={isFavorite} gitInitialized={git.initialized} gitBranch={git.branch}
            onFavorite={() => projectPath && onToggleFavorite(projectPath)}
            onOpenDir={() => projectPath && onOpenDir(projectPath)}
            onDelete={() => projectPath && onDelete(projectPath)}
            onViewLogs={() => setShowLogs(true)}
            onGitInit={handleGitInit}
            onClose={() => setCtxMenu(null)}
          />
        )}

        {showLogs && projectPath && (
          <ProjectLogDialog projectName={name} projectPath={projectPath} onClose={() => setShowLogs(false)} />
        )}
      </>
    )
  }
)

ProjectCardGrid.displayName = 'ProjectCardGrid'
export default ProjectCardGrid

import { useEffect, useState, useRef, memo } from 'react'
import { motion } from 'framer-motion'
import type { Project } from '../../types'
import {
  Play,
  FolderOpen,
  Trash2,
  Star,
  Clock,
  Database,
  MoreVertical,
  Gamepad2,
  ScrollText,
  Copy,
  GitMerge,
  GitBranch
} from 'lucide-react'
import DropdownPortal from '../ui/DropdownPortal'
import { formatVersion, formatDate, showErrorToast } from './projectUtils'
import ProjectLogDialog from './ProjectLogDialog'
import { getGitStatus } from '../../hooks/useGitStatus'

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
    const [showLogs, setShowLogs] = useState(false)
    const [git, setGit] = useState<{ initialized: boolean; branch: string }>({
      initialized: false,
      branch: ''
    })
    const menuBtnRef = useRef<HTMLButtonElement>(null)

    const imageSrc = thumbnail ? `local-asset:///${thumbnail.replace(/\\/g, '/')}` : null

    useEffect(() => {
      setCurrentSize(size)
    }, [size])
    useEffect(() => {
      if (projectPath) getGitStatus(projectPath).then((s) => setGit(s))
    }, [projectPath])

    const handleLaunch = async (): Promise<void> => {
      if (!projectPath) return
      setLaunching(true)
      onLaunch(projectPath)
      setTimeout(() => setLaunching(false), 3000)
    }

    const handleLaunchGame = async (): Promise<void> => {
      if (!projectPath) return
      const result = await window.electronAPI.projectLaunchGame(projectPath)
      if (!result.success) showErrorToast(result.error ?? 'Failed to launch as game')
    }

    const handleGitInit = async (): Promise<void> => {
      if (!projectPath) return
      const r = await window.electronAPI.projectGitInit(projectPath)
      if (r.success) setGit({ initialized: true, branch: 'main' })
    }

    const dateLabel = lastOpenedAt ? formatDate(lastOpenedAt) : createdAt
    const dateType = lastOpenedAt ? 'Opened' : 'Created'

    const MenuItem = ({
      icon,
      label,
      onClick,
      danger = false
    }: {
      icon: React.ReactNode
      label: string
      onClick: () => void
      danger?: boolean
    }): React.ReactElement => (
      <button
        onClick={() => {
          onClick()
          setMenuOpen(false)
        }}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors cursor-pointer"
        style={{ color: danger ? '#f87171' : 'var(--color-text-secondary)' }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = danger
            ? 'rgba(248,113,113,0.08)'
            : 'var(--color-surface-card)')
        }
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        {icon}
        {label}
      </button>
    )

    return (
      <>
        <motion.div
          className="w-full"
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
            <div
              className="w-16 h-16 shrink-0 overflow-hidden flex items-center justify-center"
              style={{
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border)'
              }}
            >
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
              <div className="flex items-center gap-2 flex-wrap">
                <p
                  className="text-sm font-semibold truncate"
                  style={{ color: 'var(--color-text-primary)' }}
                  title={name}
                >
                  {name}
                </p>
                <span
                  className="shrink-0 text-[10px] font-mono px-1.5 py-px"
                  style={{
                    color: 'color-mix(in srgb, var(--color-accent) 90%, white)',
                    backgroundColor: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)',
                    borderRadius: 'calc(var(--radius) * 0.5)'
                  }}
                >
                  UE {formatVersion(version)}
                </span>
                {git.initialized && (
                  <span
                    className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-px shrink-0"
                    style={{
                      borderRadius: 'calc(var(--radius) * 0.4)',
                      backgroundColor: 'rgba(52,211,153,0.1)',
                      border: '1px solid rgba(52,211,153,0.25)',
                      color: '#34d399'
                    }}
                  >
                    <GitBranch size={9} />
                    {git.branch}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div
                  className="flex items-center gap-1"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <Clock size={11} />
                  <span className="text-[10px]">
                    {dateType} {dateLabel}
                  </span>
                </div>
                <div
                  className="flex items-center gap-1"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <Database size={11} />
                  <span className="text-[10px] font-mono">{currentSize}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div
              className="shrink-0 flex items-center gap-2 pl-3"
              style={{ borderLeft: '1px solid var(--color-border)' }}
            >
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={handleLaunchGame}
                className="flex items-center p-1.5 cursor-pointer"
                style={{
                  borderRadius: 'var(--radius)',
                  backgroundColor: 'rgba(74,222,128,0.1)',
                  border: '1px solid rgba(74,222,128,0.25)',
                  color: '#4ade80'
                }}
                title="Launch as Game"
              >
                <Gamepad2 size={14} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLaunch}
                disabled={launching}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${launching ? 'bg-green-600/70 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'}`}
                style={{ borderRadius: 'var(--radius)', color: 'var(--color-text-primary)' }}
              >
                <Play size={13} className={launching ? 'animate-pulse' : ''} />
                {launching ? 'Launching…' : 'Launch'}
              </motion.button>

              <div className="relative">
                <motion.button
                  ref={menuBtnRef}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex p-1.5 cursor-pointer"
                  style={{
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-muted)'
                  }}
                >
                  <MoreVertical size={16} />
                </motion.button>

                <DropdownPortal
                  open={menuOpen}
                  anchorRef={menuBtnRef}
                  onClose={() => setMenuOpen(false)}
                >
                  <MenuItem
                    icon={
                      <Star
                        size={14}
                        fill={isFavorite ? '#facc15' : 'none'}
                        style={{ color: isFavorite ? '#facc15' : 'var(--color-text-muted)' }}
                      />
                    }
                    label={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                    onClick={() => projectPath && onToggleFavorite(projectPath)}
                  />
                  <MenuItem
                    icon={<FolderOpen size={14} style={{ color: 'var(--color-text-muted)' }} />}
                    label="Open in Explorer"
                    onClick={() => projectPath && onOpenDir(projectPath)}
                  />
                  <MenuItem
                    icon={<Copy size={14} style={{ color: 'var(--color-text-muted)' }} />}
                    label="Copy Path"
                    onClick={() => navigator.clipboard.writeText(projectPath ?? '')}
                  />
                  <div
                    className="h-px mx-2 my-1"
                    style={{ backgroundColor: 'var(--color-border)' }}
                  />
                  <MenuItem
                    icon={<ScrollText size={14} style={{ color: 'var(--color-accent)' }} />}
                    label="View Logs"
                    onClick={() => setShowLogs(true)}
                  />
                  {git.initialized ? (
                    <MenuItem
                      icon={<GitBranch size={14} style={{ color: '#34d399' }} />}
                      label={`Git: ${git.branch}`}
                      onClick={() => {}}
                    />
                  ) : (
                    <MenuItem
                      icon={<GitMerge size={14} style={{ color: '#a78bfa' }} />}
                      label="Initialize Git Repo"
                      onClick={handleGitInit}
                    />
                  )}
                  <div
                    className="h-px mx-2 my-1"
                    style={{ backgroundColor: 'var(--color-border)' }}
                  />
                  <MenuItem
                    icon={<Trash2 size={14} />}
                    label="Remove from List"
                    onClick={() => projectPath && onDelete(projectPath)}
                    danger
                  />
                </DropdownPortal>
              </div>
            </div>
          </div>
        </motion.div>

        {showLogs && projectPath && (
          <ProjectLogDialog
            projectName={name}
            projectPath={projectPath}
            onClose={() => setShowLogs(false)}
          />
        )}
      </>
    )
  }
)

ProjectCard.displayName = 'ProjectCard'
export default ProjectCard

// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useEffect, useState, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Project } from '../../types'
import { Clock, Database, GitBranch } from 'lucide-react'
import { resolveAsset } from '../../utils/resolveAsset'
import { formatVersion, formatDate, showErrorToast } from './projectUtils'
import ProjectContextMenu from './ProjectContextMenu'
import ProjectLogDialog from './ProjectLogDialog'
import GitCommitDialog from './GitCommitDialog'
import GitBranchDialog from './GitBranchDialog'
import { getGitStatus, clearGitCacheForPath } from '../../hooks/useGitStatus'
import { useToast } from '../ui/ToastContext'

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
    scanEpoch,
    onToggleFavorite,
    onLaunch,
    onOpenDir,
    onDelete
  }: Project & {
    isFavorite: boolean
    scanEpoch?: number
    onToggleFavorite: (p: string) => void
    onLaunch: (p: string) => void
    onOpenDir: (p: string) => void
    onDelete: (p: string) => void
  }) => {
    const [launching, setLaunching] = useState(false)
    const [hovered, setHovered] = useState(false)
    const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null)
    const [showLogs, setShowLogs] = useState(false)
    const [showCommitDialog, setShowCommitDialog] = useState(false)
    const [showBranchDialog, setShowBranchDialog] = useState(false)
    const [git, setGit] = useState<{ initialized: boolean; branch: string; remoteUrl: string }>({
      initialized: false,
      branch: '',
      remoteUrl: ''
    })
    const { addToast } = useToast()

    const displayName = name || projectPath!.split(/[/\\]/).pop() || 'Unknown Project'
    // Append scanEpoch as cache-buster so Chromium re-fetches the image after a refresh
    const imageSrc = thumbnail
      ? `local-asset:///${thumbnail.replace(/\\/g, '/')}?t=${scanEpoch ?? 0}`
      : resolveAsset(undefined)

    useEffect(() => {
      if (projectPath)
        getGitStatus(projectPath).then((s) =>
          setGit({ initialized: s.initialized, branch: s.branch, remoteUrl: s.remoteUrl ?? '' })
        )
    }, [projectPath, scanEpoch])

    const handleClick = useCallback(async (): Promise<void> => {
      if (!projectPath || launching) return
      setLaunching(true)
      try {
        await onLaunch(projectPath)
      } finally {
        setLaunching(false)
      }
    }, [projectPath, launching, onLaunch])

    const handleContextMenu = useCallback((e: React.MouseEvent): void => {
      e.preventDefault()
      setCtxMenu({ x: e.clientX, y: e.clientY })
    }, [])

    const handleGitInit = useCallback(async (): Promise<void> => {
      if (!projectPath) return
      const r = await window.electronAPI.projectGitInit(projectPath)
      if (r.success) {
        clearGitCacheForPath(projectPath)
        setGit({ initialized: true, branch: 'main', remoteUrl: '' })
        if (!r.lfsAvailable) {
          addToast(
            'Git repo initialized. Git LFS not found — install it to track large assets.',
            'warning'
          )
        } else {
          addToast('Git repo initialized with LFS and .gitattributes', 'success')
        }
      } else {
        addToast(r.error ?? 'Failed to initialize git repo', 'error')
      }
    }, [projectPath, addToast])

    const handleBranchChanged = useCallback(
      (newBranch: string): void => {
        if (!projectPath) return
        setGit((prev) => ({ ...prev, branch: newBranch }))
        clearGitCacheForPath(projectPath)
        getGitStatus(projectPath).then((s) =>
          setGit({ initialized: s.initialized, branch: s.branch, remoteUrl: s.remoteUrl ?? '' })
        )
      },
      [projectPath]
    )

    const handleLaunchGame = useCallback(async (): Promise<void> => {
      if (!projectPath) return
      setLaunching(true)
      try {
        const result = await window.electronAPI.projectLaunchGame(projectPath)
        if (!result.success) showErrorToast(result.error ?? 'Failed to launch as game')
      } finally {
        setLaunching(false)
      }
    }, [projectPath])

    const dateLabel = lastOpenedAt ? formatDate(lastOpenedAt) : createdAt
    const dateType = lastOpenedAt ? 'Opened' : 'Created'

    return (
      <>
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
          <img
            src={imageSrc}
            alt={displayName}
            className="absolute inset-0 w-full h-full object-cover bg-center"
            style={{
              transform: hovered ? 'scale(1.04)' : 'scale(1)',
              transition: 'transform 400ms ease'
            }}
            onError={(e) => {
              e.currentTarget.src = resolveAsset(undefined)
            }}
          />

          {/* Gradient */}
          <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent" />

          {/* Top badges */}
          <div className="absolute top-2.5 inset-x-2.5 z-10 flex items-center justify-between">
            <div
              className="bg-black/65 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono tracking-wider"
              style={{
                borderRadius: 'calc(var(--radius) * 0.5)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'color-mix(in srgb, var(--color-accent) 90%, white)'
              }}
            >
              UE {formatVersion(version)}
            </div>
            {git.initialized && (
              <div
                className="flex items-center gap-1 px-1.5 py-0.5 bg-black/65 backdrop-blur-md"
                style={{
                  borderRadius: 'calc(var(--radius) * 0.5)',
                  border: '1px solid rgba(52,211,153,0.3)',
                  color: '#34d399'
                }}
              >
                <GitBranch size={9} />
                <span className="text-[9px] font-mono">{git.branch}</span>
              </div>
            )}
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
                <div
                  className="w-8 h-8 rounded-full border-2 animate-spin mb-2"
                  style={{
                    borderColor: 'color-mix(in srgb, var(--color-accent) 30%, transparent)',
                    borderTopColor: 'var(--color-accent)'
                  }}
                />
                <p
                  className="text-xs tracking-wide"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Launching…
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hover overlay */}
          <AnimatePresence>
            {hovered && !launching && (
              <motion.div
                className="absolute bottom-0 inset-x-0 z-20 flex items-center justify-between px-3 gap-2 py-3 bg-linear-to-t from-black/85 to-transparent"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <p className="w-full text-center text-xs opacity-60">
                  L-Click: Launch | R-Click: Options
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom info */}
          <div
            className={`absolute bottom-0 inset-x-0 z-10 px-3 py-2.5 transition-opacity duration-150 ${hovered ? 'opacity-0' : 'opacity-100'}`}
          >
            <p className="text-sm font-semibold text-white truncate mb-1.5" title={displayName}>
              {displayName}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
                <Clock size={10} />
                <span className="text-[10px]">
                  {dateType} {dateLabel}
                </span>
              </div>
              <div className="flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
                <Database size={10} />
                <span className="text-[10px] font-mono">{size}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {ctxMenu && (
          <ProjectContextMenu
            x={ctxMenu.x}
            y={ctxMenu.y}
            name={name}
            projectPath={projectPath ?? ''}
            projectVersion={version}
            isFavorite={isFavorite}
            gitInitialized={git.initialized}
            gitBranch={git.branch}
            gitRemoteUrl={git.remoteUrl}
            onLaunch={handleClick}
            onLaunchGame={handleLaunchGame}
            onFavorite={() => projectPath && onToggleFavorite(projectPath)}
            onOpenDir={() => projectPath && onOpenDir(projectPath)}
            onDelete={() => projectPath && onDelete(projectPath)}
            onViewLogs={() => setShowLogs(true)}
            onGitInit={handleGitInit}
            onOpenCommitDialog={() => setShowCommitDialog(true)}
            onOpenBranchDialog={() => setShowBranchDialog(true)}
            onClose={() => setCtxMenu(null)}
          />
        )}

        {showLogs && projectPath && (
          <ProjectLogDialog
            projectName={name}
            projectPath={projectPath}
            onClose={() => setShowLogs(false)}
          />
        )}

        {showCommitDialog && projectPath && (
          <GitCommitDialog
            projectName={name}
            projectPath={projectPath}
            onClose={() => setShowCommitDialog(false)}
          />
        )}

        {showBranchDialog && projectPath && (
          <GitBranchDialog
            projectName={name}
            projectPath={projectPath}
            currentBranch={git.branch}
            onBranchChanged={handleBranchChanged}
            onClose={() => setShowBranchDialog(false)}
          />
        )}
      </>
    )
  }
)

ProjectCardGrid.displayName = 'ProjectCardGrid'
export default ProjectCardGrid

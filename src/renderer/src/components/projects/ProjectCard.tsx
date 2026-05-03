// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { memo } from 'react'
import { motion } from 'framer-motion'
import type { Project } from '../../types'
import { Play, Gamepad2, MoreVertical, Clock, Database, GitBranch } from 'lucide-react'
import { formatVersion, formatDate } from './projectUtils'
import { useProjectCardState } from './card/projectCardState'
import { useProjectCardHandlers } from './card/projectCardHandlers'
import { ProjectCardDialogs } from './card/projectCardDialogs'

// ── Card ──────────────────────────────────────────────────────────────────────

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
    const state = useProjectCardState(projectPath, scanEpoch)
    const handlers = useProjectCardHandlers(
      projectPath,
      onLaunch,
      state.setLaunching,
      state.setCtxMenu,
      state.setGit,
      state.setShowCommitDialog,
      state.setShowBranchDialog
    )

    const displayName = name || projectPath!.split(/[/\\]/).pop() || 'Unknown Project'
    const imageSrc = thumbnail
      ? `local-asset:///${thumbnail.replace(/\\/g, '/')}?t=${scanEpoch ?? 0}`
      : null
    const dateLabel = lastOpenedAt ? formatDate(lastOpenedAt) : createdAt
    const dateType = lastOpenedAt ? 'Opened' : 'Created'

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
          onContextMenu={handlers.handleContextMenu}
        >
          <div className="flex items-center gap-3 px-3 py-2.5">
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
                <img src={imageSrc} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-black" style={{ color: 'var(--color-border)' }}>
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <p
                  className="text-sm font-semibold truncate"
                  style={{ color: 'var(--color-text-primary)' }}
                  title={displayName}
                >
                  {displayName}
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
                {state.git.initialized && (
                  <span
                    className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-px shrink-0"
                    style={{
                      borderRadius: 'calc(var(--radius) * 0.4)',
                      backgroundColor: 'color-mix(in srgb, #34d399 10%, transparent)',
                      border: '1px solid color-mix(in srgb, #34d399 25%, transparent)',
                      color: '#34d399'
                    }}
                  >
                    <GitBranch size={9} />
                    {state.git.branch}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                  <Clock size={11} />
                  <span className="text-[10px]">{dateType} {dateLabel}</span>
                </div>
                <div className="flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                  <Database size={11} />
                  <span className="text-[10px] font-mono">{size}</span>
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
                onClick={handlers.handleLaunchGame}
                className="flex items-center p-1.5 cursor-pointer"
                style={{
                  borderRadius: 'var(--radius)',
                  backgroundColor: 'color-mix(in srgb, #4ade80 10%, transparent)',
                  border: '1px solid color-mix(in srgb, #4ade80 25%, transparent)',
                  color: '#4ade80'
                }}
                title="Launch as Game"
              >
                <Gamepad2 size={14} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlers.handleClick}
                disabled={state.launching}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold cursor-pointer disabled:opacity-60"
                style={{
                  borderRadius: 'var(--radius)',
                  backgroundColor: 'var(--color-accent)',
                  color: 'var(--color-text-primary)',
                  boxShadow: state.launching
                    ? 'none'
                    : '0 2px 8px color-mix(in srgb, var(--color-accent) 30%, transparent)'
                }}
              >
                <Play size={13} className={state.launching ? 'animate-pulse' : ''} />
                {state.launching ? 'Launching…' : 'Launch'}
              </motion.button>

              {/* ⋮ button — opens the same context menu as right-click */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={(e) => {
                  e.stopPropagation()
                  const rect = e.currentTarget.getBoundingClientRect()
                  state.setCtxMenu({ x: rect.left, y: rect.bottom + 4 })
                }}
                className="flex p-1.5 cursor-pointer"
                style={{
                  borderRadius: 'var(--radius)',
                  backgroundColor: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)'
                }}
                title="More options"
              >
                <MoreVertical size={16} />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Same full dialog set as the grid card */}
        <ProjectCardDialogs
          ctxMenu={state.ctxMenu}
          showLogs={state.showLogs}
          showCommitDialog={state.showCommitDialog}
          showBranchDialog={state.showBranchDialog}
          projectPath={projectPath}
          projectName={name}
          projectVersion={version}
          isFavorite={isFavorite}
          gitInitialized={state.git.initialized}
          gitBranch={state.git.branch}
          gitRemoteUrl={state.git.remoteUrl}
          onLaunch={handlers.handleClick}
          onLaunchGame={handlers.handleLaunchGame}
          onFavorite={() => projectPath && onToggleFavorite(projectPath)}
          onOpenDir={() => projectPath && onOpenDir(projectPath)}
          onDelete={() => projectPath && onDelete(projectPath)}
          onViewLogs={() => state.setShowLogs(true)}
          onGitInit={handlers.handleGitInit}
          onOpenCommitDialog={() => state.setShowCommitDialog(true)}
          onOpenBranchDialog={() => state.setShowBranchDialog(true)}
          onBranchChanged={state.handleBranchChanged}
          onCloseCtxMenu={() => state.setCtxMenu(null)}
          onCloseLogs={() => state.setShowLogs(false)}
          onCloseCommitDialog={() => state.setShowCommitDialog(false)}
          onCloseBranchDialog={() => state.setShowBranchDialog(false)}
        />
      </>
    )
  }
)

ProjectCard.displayName = 'ProjectCard'
export default ProjectCard

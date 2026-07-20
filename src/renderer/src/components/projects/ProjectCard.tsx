// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { memo, useState, useEffect } from 'react'
import type { Project } from '../../types'
import { Play, Gamepad2, MoreVertical, Clock, Database, GitBranch, Heart } from 'lucide-react'
import { formatVersion, formatDate, getProjectActivitySummary } from './projectUtils'
import { useProjectCardState } from './card/projectCardState'
import { useProjectCardHandlers } from './card/projectCardHandlers'
import { ProjectCardDialogs } from './card/projectCardDialogs'
import { toLocalAssetUrl } from '../../utils/resolveAsset'
import { useEngineCompatibility } from '../../hooks/useEngineCompatibility'

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
    isHidden,
    // Use a per-project thumbnailKey so only cards with changed thumbnails re-render
    thumbnailKey,
    onToggleFavorite,
    onLaunch,
    onOpenDir,
    onHide
  }: Project & {
    isFavorite: boolean
    isHidden: boolean
    thumbnailKey?: string
    index?: number
    onToggleFavorite: (p: string) => void
    onLaunch: (p: string) => void
    onOpenDir: (p: string) => void
    onHide: (p: string) => void
  }) => {
    const state = useProjectCardState(projectPath)
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
    // Use thumbnailKey as a cache-busting token for the per-project thumbnail
    const imageSrc = thumbnail ? toLocalAssetUrl(thumbnail, thumbnailKey) : null
    const dateLabel = lastOpenedAt ? formatDate(lastOpenedAt) : createdAt
    const dateType = lastOpenedAt ? 'Opened' : 'Created'
    const compatibility = useEngineCompatibility(version)
    const activitySummary = projectPath
      ? getProjectActivitySummary(projectPath)
      : 'No recent activity'

    const [health, setHealth] = useState<{
      score: number
      status: 'healthy' | 'warning' | 'critical'
    } | null>(null)

    useEffect(() => {
      if (!projectPath) return
      const loadHealth = (): void => {
        window.electronAPI
          .projectCheckHealth(projectPath)
          .then((h) => {
            setHealth({ score: h.score, status: h.status })
          })
          .catch(() => {})
      }
      loadHealth()

      const handler = (ev: Event): void => {
        try {
          const detail = (ev as CustomEvent).detail
          if (detail && detail.projectPath === projectPath) {
            loadHealth()
          }
        } catch {
          /* ignore */
        }
      }
      window.addEventListener('project-health-updated', handler as EventListener)
      return (): void => {
        window.removeEventListener('project-health-updated', handler as EventListener)
      }
    }, [projectPath])

    return (
      <>
        <div
          className="w-full transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
          style={{
            backgroundColor: 'var(--color-surface-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)'
          }}
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
                <img
                  src={imageSrc}
                  alt={displayName}
                  width={64}
                  height={64}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
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
                    color: 'var(--color-engine-version-text)',
                    backgroundColor:
                      'color-mix(in srgb, var(--color-engine-version-text) 10%, transparent)',
                    border:
                      '1px solid color-mix(in srgb, var(--color-engine-version-text) 20%, transparent)',
                    borderRadius: 'calc(var(--radius) * 0.5)'
                  }}
                >
                  UE {formatVersion(version)}
                </span>
                <span
                  className="shrink-0 text-[10px] px-1.5 py-px"
                  style={{
                    color:
                      compatibility.status === 'matched'
                        ? '#34d399'
                        : compatibility.status === 'partial'
                          ? '#f59e0b'
                          : compatibility.status === 'missing'
                            ? '#f87171'
                            : 'var(--color-text-secondary)',
                    backgroundColor:
                      compatibility.status === 'matched'
                        ? 'color-mix(in srgb, #34d399 12%, transparent)'
                        : compatibility.status === 'partial'
                          ? 'color-mix(in srgb, #f59e0b 12%, transparent)'
                          : compatibility.status === 'missing'
                            ? 'color-mix(in srgb, #f87171 12%, transparent)'
                            : 'color-mix(in srgb, var(--color-text-muted) 12%, transparent)',
                    border: '1px solid color-mix(in srgb, currentColor 24%, transparent)',
                    borderRadius: 'calc(var(--radius) * 0.5)'
                  }}
                  title={compatibility.tooltip}
                >
                  {compatibility.status === 'matched'
                    ? 'Ready'
                    : compatibility.status === 'partial'
                      ? 'Compatible'
                      : compatibility.status === 'missing'
                        ? 'Engine Missing'
                        : 'Unknown'}
                </span>
                {health && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      window.dispatchEvent(
                        new CustomEvent('open-project-health-report', {
                          detail: { projectPath }
                        })
                      )
                    }}
                    className="shrink-0 text-[10px] px-1.5 py-px flex items-center gap-1 cursor-pointer transition-all hover:brightness-110 active:scale-95"
                    style={{
                      color:
                        health.status === 'healthy'
                          ? '#34d399'
                          : health.status === 'warning'
                            ? '#f59e0b'
                            : '#f87171',
                      backgroundColor:
                        health.status === 'healthy'
                          ? 'color-mix(in srgb, #34d399 12%, transparent)'
                          : health.status === 'warning'
                            ? 'color-mix(in srgb, #f59e0b 12%, transparent)'
                            : 'color-mix(in srgb, #f87171 12%, transparent)',
                      border: '1px solid color-mix(in srgb, currentColor 24%, transparent)',
                      borderRadius: 'calc(var(--radius) * 0.5)'
                    }}
                    title={`Project Health: ${health.score}/100. Click to view detailed health report.`}
                  >
                    <Heart size={10} fill="currentColor" />
                    <span>{health.score}%</span>
                  </button>
                )}
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
              <div className="flex items-center gap-4 flex-wrap">
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
                  <span className="text-[10px] font-mono">{size}</span>
                </div>
                <div
                  className="flex items-center gap-1"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <Clock size={11} />
                  <span className="text-[10px] truncate" title={activitySummary}>
                    {activitySummary}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div
              className="shrink-0 flex items-center gap-2 pl-3"
              style={{ borderLeft: '1px solid var(--color-border)' }}
            >
              <button
                onClick={handlers.handleLaunchGame}
                className="flex items-center p-1.5 cursor-pointer"
                style={{
                  borderRadius: 'var(--radius)',
                  backgroundColor: 'color-mix(in srgb, #4ade80 10%, transparent)',
                  border: '1px solid color-mix(in srgb, #4ade80 25%, transparent)',
                  color: '#4ade80'
                }}
                title="Launch as Game"
                aria-label="Launch as Game"
              >
                <Gamepad2 size={14} />
              </button>

              <button
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
              </button>

              {/* ⋮ button — opens the same context menu as right-click */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  const rect = e.currentTarget.getBoundingClientRect()
                  state.setCtxMenu({ x: rect.left, y: rect.bottom + 4 })
                }}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  state.setCtxMenu({ x: rect.left, y: rect.bottom + 4 })
                }}
                className="flex p-1.5 cursor-pointer transition-colors duration-200 hover:bg-white/[0.015] hover:text-[var(--color-text-primary)]"
                style={{
                  borderRadius: 'var(--radius)',
                  backgroundColor: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)'
                }}
                title="More options"
                aria-label="More options"
                aria-haspopup="menu"
              >
                <MoreVertical size={16} />
              </button>
            </div>
          </div>
        </div>

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
          isHidden={isHidden}
          gitInitialized={state.git.initialized}
          gitBranch={state.git.branch}
          gitRemoteUrl={state.git.remoteUrl}
          onLaunch={handlers.handleClick}
          onLaunchGame={handlers.handleLaunchGame}
          onLaunchWithConfig={() => {
            // open dialog via parent handlers if provided; fallback to sending IPC
            setTimeout(() => {
              // Trigger the same dialog used elsewhere by emitting a window event
              const e = new CustomEvent('open-project-launch-config', { detail: { projectPath } })
              window.dispatchEvent(e)
            }, 0)
          }}
          onFavorite={() => projectPath && onToggleFavorite(projectPath)}
          onOpenDir={() => projectPath && onOpenDir(projectPath)}
          onHide={() => projectPath && onHide(projectPath)}
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

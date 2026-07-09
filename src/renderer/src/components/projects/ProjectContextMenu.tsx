// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Play,
  Gamepad2,
  Star,
  GitMerge,
  Wrench,
  AlertTriangle,
  GitBranch,
  Settings2,
  EyeOff
} from 'lucide-react'
import {
  MenuItem,
  MenuSeparator,
  MenuCategory,
  SubMenuTrigger,
  MENU_STYLE
} from './contextMenu/contextMenuComponents'
import { OrganizeSubMenu } from './contextMenu/OrganizeSubMenu'
import { ProjectToolsSubMenu } from './contextMenu/ProjectToolsSubMenu'
import { GitSubMenu } from './contextMenu/GitSubMenu'

export interface ProjectContextMenuProps {
  x: number
  y: number
  name: string
  projectPath: string
  projectVersion: string
  isFavorite: boolean
  isHidden: boolean
  gitInitialized: boolean
  gitBranch: string
  gitRemoteUrl: string
  onLaunch: () => void
  onLaunchGame: () => void
  onLaunchWithConfig: () => void
  onFavorite: () => void
  onOpenDir: () => void
  onHide: () => void
  onViewLogs: () => void
  onGitInit: () => void
  onClose: () => void
  onOpenCommitDialog: () => void
  onOpenBranchDialog: () => void
  onOpenFileEditor: (mode: 'config' | 'uproject') => void
  onOpenPlugins: () => void
}

export default function ProjectContextMenu(p: ProjectContextMenuProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null)
  const organizeTriggerRef = useRef<HTMLButtonElement>(null)
  const toolsTriggerRef = useRef<HTMLButtonElement>(null)
  const gitTriggerRef = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState({ top: p.y, left: p.x, width: 248 })
  const [activeSub, setActiveSub] = useState<'organize' | 'tools' | 'git' | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Position menu within viewport bounds
  useEffect(() => {
    if (ref.current) {
      const { offsetWidth: w, offsetHeight: h } = ref.current
      setPos({
        top: Math.min(p.y, window.innerHeight - h - 8),
        left: Math.min(p.x, window.innerWidth - w - 8),
        width: w
      })
    }
  }, [p.x, p.y])

  // Close menu on outside click or Escape key; Arrow keys navigate items
  useEffect(() => {
    const keyHandler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        p.onClose()
        return
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const menu = ref.current
        if (!menu) return
        const items = Array.from(menu.querySelectorAll<HTMLButtonElement>('button:not([disabled])'))
        const current = document.activeElement as HTMLElement
        const idx = items.indexOf(current as HTMLButtonElement)
        if (e.key === 'ArrowDown') {
          const next = items[(idx + 1) % items.length]
          next?.focus()
        } else {
          const prev = items[(idx - 1 + items.length) % items.length]
          prev?.focus()
        }
      }
    }
    document.addEventListener('keydown', keyHandler)

    const t = setTimeout(() => {
      const handler = (e: PointerEvent): void => {
        const target = e.target as Element | null
        if (!target) return
        if (target.closest('[data-menu-panel]')) return
        p.onClose()
      }
      document.addEventListener('pointerdown', handler)
      return () => document.removeEventListener('pointerdown', handler)
    }, 50)

    return () => {
      document.removeEventListener('keydown', keyHandler)
      clearTimeout(t)
    }
  }, [p])

  const openSub = useCallback((sub: 'organize' | 'tools' | 'git') => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setActiveSub(sub)
  }, [])

  const closeSub = useCallback(() => {
    closeTimer.current = setTimeout(() => setActiveSub(null), 120)
  }, [])

  const keepSub = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }, [])

  const handleOpenCommit = useCallback(() => {
    setActiveSub(null)
    p.onClose()
    p.onOpenCommitDialog()
  }, [p])

  const handleOpenBranch = useCallback(() => {
    setActiveSub(null)
    p.onClose()
    p.onOpenBranchDialog()
  }, [p])

  return createPortal(
    <>
      <div
        ref={ref}
        data-menu-panel
        role="menu"
        aria-label={`${p.name} context menu`}
        className="fixed z-9999 select-none"
        style={{ ...MENU_STYLE, top: pos.top, left: pos.left, width: 248 }}
      >
        {/* Header */}
        <div
          className="px-3 py-2.5"
          style={{
            borderBottom: '1px solid var(--color-border)',
            background: 'linear-gradient(180deg, color-mix(in srgb, var(--color-accent) 8%, transparent) 0%, transparent 100%)'
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                {p.name}
              </p>
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                <span
                  className="text-[9px] font-mono px-1.5 py-px"
                  style={{
                    borderRadius: 'calc(var(--radius) * 0.4)',
                    backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                    color: 'color-mix(in srgb, var(--color-accent) 90%, white)',
                    border: '1px solid color-mix(in srgb, var(--color-accent) 22%, transparent)'
                  }}
                >
                  UE {p.projectVersion}
                </span>
                {p.isFavorite && (
                  <span
                    className="flex items-center gap-1 rounded-full px-1.5 py-px text-[9px]"
                    style={{
                      backgroundColor: 'color-mix(in srgb, #facc15 12%, transparent)',
                      color: '#facc15',
                      border: '1px solid color-mix(in srgb, #facc15 24%, transparent)'
                    }}
                  >
                    <Star size={9} fill="currentColor" />
                    Favorite
                  </span>
                )}
                {p.isHidden && (
                  <span
                    className="flex items-center gap-1 rounded-full px-1.5 py-px text-[9px]"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-text-muted) 12%, transparent)',
                      color: 'var(--color-text-secondary)',
                      border: '1px solid color-mix(in srgb, var(--color-border) 80%, transparent)'
                    }}
                  >
                    <EyeOff size={9} />
                    Hidden
                  </span>
                )}
                {p.gitInitialized && (
                  <span
                    className="flex items-center gap-1 rounded-full px-1.5 py-px text-[9px]"
                    style={{
                      backgroundColor: 'color-mix(in srgb, #34d399 12%, transparent)',
                      color: '#34d399',
                      border: '1px solid color-mix(in srgb, #34d399 24%, transparent)'
                    }}
                  >
                    <GitBranch size={9} />
                    Git
                  </span>
                )}
              </div>
            </div>
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-accent) 14%, transparent)',
                borderColor: 'color-mix(in srgb, var(--color-accent) 24%, transparent)',
                color: 'var(--color-accent)'
              }}
            >
              <Play size={13} fill="currentColor" />
            </div>
          </div>
        </div>

        <div className="py-1">
          {/* Launch */}
          <MenuCategory label="Launch" />
          <MenuItem
            icon={<Play size={11} style={{ color: 'var(--color-accent)' }} />}
            label="Open in Editor"
            sub="Launch Unreal Editor"
            onClick={p.onLaunch}
            onClose={p.onClose}
          />
          <MenuItem
            icon={<Gamepad2 size={11} style={{ color: '#4ade80' }} />}
            label="Launch as Game"
            sub="Run in -game mode"
            onClick={p.onLaunchGame}
            onClose={p.onClose}
          />
          <MenuItem
            icon={<Settings2 size={11} style={{ color: 'var(--color-text-muted)' }} />}
            label="Launch with Config"
            sub="Choose rendering profile"
            onClick={p.onLaunchWithConfig}
            noClose
            onClose={p.onClose}
          />

          <MenuSeparator />

          {/* Organize — submenu trigger */}
          <MenuCategory label="Organize" />
          <SubMenuTrigger
            triggerRef={organizeTriggerRef}
            icon={
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  color: activeSub === 'organize' ? '#f59e0b' : 'var(--color-text-muted)'
                }}
              >
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            }
            label="Quick Access"
            isOpen={activeSub === 'organize'}
            onOpen={() => openSub('organize')}
            onLeave={closeSub}
          />
          <MenuItem
            icon={
              <Star
                size={11}
                fill={p.isFavorite ? '#facc15' : 'none'}
                style={{ color: p.isFavorite ? '#facc15' : 'var(--color-text-muted)' }}
              />
            }
            label={p.isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
            sub={p.isFavorite ? 'Unpin from Favorites tab' : 'Pin to Favorites tab'}
            onClick={p.onFavorite}
            onClose={p.onClose}
          />

          <MenuSeparator />

          {/* Tools */}
          <MenuCategory label="Tools" />
          <SubMenuTrigger
            triggerRef={gitTriggerRef}
            icon={
              <GitMerge
                size={11}
                style={{ color: activeSub === 'git' ? '#a78bfa' : 'var(--color-text-muted)' }}
              />
            }
            label="Git Tools"
            isOpen={activeSub === 'git'}
            onOpen={() => openSub('git')}
            onLeave={closeSub}
          />
          <SubMenuTrigger
            triggerRef={toolsTriggerRef}
            icon={
              <Wrench
                size={11}
                style={{
                  color: activeSub === 'tools' ? 'var(--color-accent)' : 'var(--color-text-muted)'
                }}
              />
            }
            label="Project Tools"
            isOpen={activeSub === 'tools'}
            onOpen={() => openSub('tools')}
            onLeave={closeSub}
          />

          <MenuSeparator />

          <MenuItem
            icon={<AlertTriangle size={11} />}
            label={p.isHidden ? 'Unhide from List' : 'Hide from List'}
            sub={p.isHidden ? 'Restore to main list' : 'Move to Hidden tab'}
            onClick={p.onHide}
            danger
            onClose={p.onClose}
          />
        </div>
      </div>

      <>
        {activeSub === 'organize' && (
          <OrganizeSubMenu
            projectPath={p.projectPath}
            gitInitialized={p.gitInitialized}
            anchorRef={organizeTriggerRef}
            parentLeft={pos.left}
            parentWidth={pos.width}
            onOpenDir={p.onOpenDir}
            onClose={p.onClose}
            onMouseEnter={keepSub}
            onMouseLeave={closeSub}
          />
        )}
        {activeSub === 'tools' && (
          <ProjectToolsSubMenu
            projectPath={p.projectPath}
            projectName={p.name}
            anchorRef={toolsTriggerRef}
            parentLeft={pos.left}
            parentWidth={pos.width}
            onViewLogs={p.onViewLogs}
            onOpenFileEditor={p.onOpenFileEditor}
            onOpenPlugins={p.onOpenPlugins}
            onClose={p.onClose}
            onMouseEnter={keepSub}
            onMouseLeave={closeSub}
          />
        )}
        {activeSub === 'git' && (
          <GitSubMenu
            projectPath={p.projectPath}
            gitInitialized={p.gitInitialized}
            gitBranch={p.gitBranch}
            gitRemoteUrl={p.gitRemoteUrl}
            anchorRef={gitTriggerRef}
            parentLeft={pos.left}
            parentWidth={pos.width}
            onGitInit={p.onGitInit}
            onOpenCommit={handleOpenCommit}
            onOpenBranch={handleOpenBranch}
            onClose={p.onClose}
            onMouseEnter={keepSub}
            onMouseLeave={closeSub}
          />
        )}
      </>
    </>,
    document.body
  )
}

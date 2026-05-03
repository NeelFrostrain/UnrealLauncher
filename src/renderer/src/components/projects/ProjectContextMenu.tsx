// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Gamepad2, Star, GitMerge, Wrench, AlertTriangle, GitBranch } from 'lucide-react'
import { useToast } from '../ui/ToastContext'
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
  gitInitialized: boolean
  gitBranch: string
  gitRemoteUrl: string
  onLaunch: () => void
  onLaunchGame: () => void
  onFavorite: () => void
  onOpenDir: () => void
  onDelete: () => void
  onViewLogs: () => void
  onGitInit: () => void
  onClose: () => void
  onOpenCommitDialog: () => void
  onOpenBranchDialog: () => void
}

export default function ProjectContextMenu(p: ProjectContextMenuProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null)
  const organizeTriggerRef = useRef<HTMLButtonElement>(null)
  const toolsTriggerRef = useRef<HTMLButtonElement>(null)
  const gitTriggerRef = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState({ top: p.y, left: p.x, width: 220 })
  const [activeSub, setActiveSub] = useState<'organize' | 'tools' | 'git' | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { addToast } = useToast()

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

  // Close menu on outside click
  useEffect(() => {
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
    return () => clearTimeout(t)
  }, [p.onClose])

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

  // Suppress unused warning
  void addToast

  return createPortal(
    <>
      <motion.div
        ref={ref}
        data-menu-panel
        className="fixed z-9999 select-none"
        style={{ ...MENU_STYLE, top: pos.top, left: pos.left, width: 220 }}
        initial={{ opacity: 0, scale: 0.95, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.1 }}
      >
        {/* Header */}
        <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <p
            className="text-xs font-semibold truncate"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {p.name}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span
              className="text-[9px] font-mono px-1 py-px"
              style={{
                borderRadius: 'calc(var(--radius) * 0.4)',
                backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                color: 'color-mix(in srgb, var(--color-accent) 90%, white)',
                border: '1px solid color-mix(in srgb, var(--color-accent) 22%, transparent)'
              }}
            >
              UE {p.projectVersion}
            </span>
            {p.gitInitialized && (
              <span className="flex items-center gap-1">
                <GitBranch size={9} style={{ color: '#34d399' }} />
                <span className="text-[9px] font-mono" style={{ color: '#34d399' }}>
                  {p.gitBranch}
                </span>
              </span>
            )}
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
            label="Remove from List"
            sub="Does not delete files"
            onClick={p.onDelete}
            danger
            onClose={p.onClose}
          />
        </div>
      </motion.div>

      <AnimatePresence>
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
            anchorRef={toolsTriggerRef}
            parentLeft={pos.left}
            parentWidth={pos.width}
            onViewLogs={p.onViewLogs}
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
      </AnimatePresence>
    </>,
    document.body
  )
}

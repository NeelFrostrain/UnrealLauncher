// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Gamepad2, Star, FolderOpen, Copy, GitBranch, GitMerge, Globe,
  FileCode2, Settings2, ScrollText, Trash2, AlertTriangle, Wrench,
  ChevronRight, GitCommit, RefreshCw, FileText, Database, Plus
} from 'lucide-react'
import { useToast } from '../ui/ToastContext'

export interface ProjectContextMenuProps {
  x: number; y: number; name: string; projectPath: string; projectVersion: string
  isFavorite: boolean; gitInitialized: boolean; gitBranch: string; gitRemoteUrl: string
  onLaunch: () => void; onLaunchGame: () => void; onFavorite: () => void
  onOpenDir: () => void; onDelete: () => void; onViewLogs: () => void
  onGitInit: () => void; onClose: () => void
}

const MENU_STYLE: React.CSSProperties = {
  backgroundColor: 'var(--color-surface-elevated)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.55)'
}

// -- Item ----------------------------------------------------------------------
// noClose=true means the item toggles an inline panel � don't close the menu
const Item = ({ icon, label, hint, onClick, danger = false, disabled = false,
  noClose = false, onHoverIn, onHoverOut, onClose }: {
  icon: React.ReactNode; label: string; hint?: string; onClick?: () => void
  danger?: boolean; disabled?: boolean; noClose?: boolean
  onHoverIn?: () => void; onHoverOut?: () => void; onClose: () => void
}): React.ReactElement => (
  <button
    onClick={() => { if (!disabled && onClick) { onClick(); if (!noClose) onClose() } }}
    disabled={disabled}
    onMouseEnter={(e) => {
      if (!disabled) e.currentTarget.style.backgroundColor = danger ? 'rgba(248,113,113,0.1)' : 'var(--color-surface-card)'
      onHoverIn?.()
    }}
    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; onHoverOut?.() }}
    className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-default rounded-sm"
    style={{ color: danger ? '#f87171' : 'var(--color-text-secondary)', width: 'calc(100% - 8px)', margin: '0 4px' }}
  >
    <span className="shrink-0 w-3.5 flex items-center justify-center">{icon}</span>
    <span className="flex-1 text-left whitespace-nowrap">{label}</span>
    {hint && <span className="text-[9px] font-mono shrink-0 ml-2" style={{ color: 'var(--color-text-muted)' }}>{hint}</span>}
  </button>
)

const Sep = (): React.ReactElement => (
  <div className="h-px my-1" style={{ backgroundColor: 'var(--color-border)' }} />
)
const Cat = ({ label }: { label: string }): React.ReactElement => (
  <p className="px-2.5 pt-2 pb-0.5 text-[9px] font-semibold uppercase tracking-widest select-none"
    style={{ color: 'var(--color-text-muted)', opacity: 0.6 }}>{label}</p>
)

// -- Submenu position hook � useLayoutEffect so dimensions are ready -----------
// ── Submenu position hook ─────────────────────────────────────────────────────
// Calculates once on mount then recalculates on resize via ResizeObserver.
// Avoids the infinite loop that useLayoutEffect without deps would cause.
function useSubPos(
  anchorRef: React.RefObject<HTMLButtonElement | null>,
  subRef: React.RefObject<HTMLDivElement | null>,
  parentLeft: number, parentWidth: number
): { top: number; left: number } {
  const [pos, setPos] = useState({ top: -9999, left: -9999 })

  const recalc = useCallback(() => {
    if (!anchorRef.current || !subRef.current) return
    const anchor = anchorRef.current.getBoundingClientRect()
    const subH = subRef.current.offsetHeight
    const subW = subRef.current.offsetWidth
    let t = anchor.top
    if (t + subH > window.innerHeight - 8) t = window.innerHeight - subH - 8
    let l = parentLeft + parentWidth - 4
    if (l + subW > window.innerWidth - 8) l = parentLeft - subW + 4
    setPos((prev) => (prev.top === t && prev.left === l ? prev : { top: t, left: l }))
  }, [anchorRef, subRef, parentLeft, parentWidth])

  useLayoutEffect(() => {
    recalc()
    if (!subRef.current) return
    const ro = new ResizeObserver(recalc)
    ro.observe(subRef.current)
    return () => ro.disconnect()
  }, [recalc])

  return pos
}

// -- Project Tools submenu -----------------------------------------------------
const ProjectToolsSubMenu = ({ projectPath, anchorRef, parentLeft, parentWidth, onViewLogs, onClose, onMouseEnter, onMouseLeave }: {
  projectPath: string; anchorRef: React.RefObject<HTMLButtonElement | null>
  parentLeft: number; parentWidth: number; onViewLogs: () => void; onClose: () => void
  onMouseEnter?: () => void; onMouseLeave?: () => void
}): React.ReactElement => {
  const subRef = useRef<HTMLDivElement>(null)
  const pos = useSubPos(anchorRef, subRef, parentLeft, parentWidth)
  const [cleaning, setCleaning] = useState(false)
  const { addToast } = useToast()

  const handleClean = useCallback(async () => {
    setCleaning(true)
    const r = await window.electronAPI.projectCleanIntermediate(projectPath)
    setCleaning(false)
    if (r.cleaned.length > 0) addToast(`Cleaned ${r.cleaned.length} item${r.cleaned.length !== 1 ? 's' : ''}`, 'success')
    else addToast('Nothing to clean', 'info')
    onClose()
  }, [projectPath, addToast, onClose])

  return createPortal(
    <motion.div ref={subRef} data-menu-panel className="fixed z-10000 select-none"
      style={{ ...MENU_STYLE, top: pos.top, left: pos.left, width: 210 }}
      onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}
      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
      transition={{ duration: 0.1 }}>
      <div className="py-1">
        <Item icon={<Settings2 size={11} style={{ color: '#94a3b8' }} />} label="Edit Default Config" hint="DefaultEngine.ini"
          onClick={() => window.electronAPI.projectOpenDefaultConfig(projectPath)} onClose={onClose} />
        <Item icon={<FileCode2 size={11} style={{ color: 'var(--color-accent)' }} />} label="Edit .uproject File"
          onClick={() => window.electronAPI.projectOpenUproject(projectPath)} onClose={onClose} />
        <Item icon={<ScrollText size={11} style={{ color: '#f59e0b' }} />} label="View Logs"
          onClick={onViewLogs} onClose={onClose} />
        <Sep />
        <Item icon={<Trash2 size={11} style={{ color: '#f87171' }} />}
          label={cleaning ? 'Cleaning�' : 'Clean Project'} hint={cleaning ? undefined : 'Intermediate, Build�'}
          onClick={handleClean} disabled={cleaning} danger noClose onClose={onClose} />
      </div>
    </motion.div>,
    document.body
  )
}

// -- Git submenu ---------------------------------------------------------------
const GitSubMenu = ({ projectPath, gitInitialized, gitBranch, gitRemoteUrl,
  anchorRef, parentLeft, parentWidth, onGitInit, onClose, onMouseEnter, onMouseLeave }: {
  projectPath: string; gitInitialized: boolean; gitBranch: string; gitRemoteUrl: string
  anchorRef: React.RefObject<HTMLButtonElement | null>
  parentLeft: number; parentWidth: number; onGitInit: () => void; onClose: () => void
  onMouseEnter?: () => void; onMouseLeave?: () => void
}): React.ReactElement => {
  const subRef = useRef<HTMLDivElement>(null)
  const pos = useSubPos(anchorRef, subRef, parentLeft, parentWidth)
  const { addToast } = useToast()

  // File status � checked via IPC so we don't use Node fs in renderer
  const [hasGitignore, setHasGitignore] = useState(false)
  const [hasGitattributes, setHasGitattributes] = useState(false)
  useEffect(() => {
    window.electronAPI.projectGitFileStatus(projectPath).then((s) => {
      setHasGitignore(s.hasGitignore)
      setHasGitattributes(s.hasGitattributes)
    })
  }, [projectPath])

  // Commit panel
  const [showCommitPanel, setShowCommitPanel] = useState(false)
  const [commitMsg, setCommitMsg] = useState('')
  const [changesSummary, setChangesSummary] = useState('')
  const [committing, setCommitting] = useState(false)

  // Branch panel
  const [showBranchPanel, setShowBranchPanel] = useState(false)
  const [branches, setBranches] = useState<string[]>([])
  const [newBranch, setNewBranch] = useState('')
  const [loadingBranches, setLoadingBranches] = useState(false)

  const loadChanges = useCallback(async () => {
    const r = await window.electronAPI.projectGitHasChanges(projectPath)
    setChangesSummary(r.summary)
    setShowCommitPanel(true)
    setShowBranchPanel(false)
  }, [projectPath])

  const loadBranches = useCallback(async () => {
    setLoadingBranches(true)
    setShowBranchPanel(true)
    setShowCommitPanel(false)
    const r = await window.electronAPI.projectGitBranches(projectPath)
    setBranches(r.branches)
    setLoadingBranches(false)
  }, [projectPath])

  const handleCommit = useCallback(async () => {
    if (!commitMsg.trim()) return
    setCommitting(true)
    const r = await window.electronAPI.projectGitCommit(projectPath, commitMsg.trim())
    setCommitting(false)
    if (r.success) { addToast('Changes committed', 'success'); onClose() }
    else addToast(r.error ?? 'Commit failed', 'error')
  }, [projectPath, commitMsg, addToast, onClose])

  const handleSwitchBranch = useCallback(async (branch: string) => {
    const r = await window.electronAPI.projectGitSwitchBranch(projectPath, branch, false)
    if (r.success) { addToast(`Switched to ${branch}`, 'success'); onClose() }
    else addToast(r.error ?? 'Failed to switch branch', 'error')
  }, [projectPath, addToast, onClose])

  const handleCreateBranch = useCallback(async () => {
    if (!newBranch.trim()) return
    const r = await window.electronAPI.projectGitSwitchBranch(projectPath, newBranch.trim(), true)
    if (r.success) { addToast(`Created and switched to ${newBranch.trim()}`, 'success'); onClose() }
    else addToast(r.error ?? 'Failed to create branch', 'error')
  }, [projectPath, newBranch, addToast, onClose])

  const handleInitLfs = useCallback(async () => {
    const r = await window.electronAPI.projectGitInitLfs(projectPath)
    if (r.success) { addToast('Git LFS initialized', 'success'); setHasGitattributes(true) }
    else addToast(r.error ?? 'LFS init failed � install git-lfs first', 'error')
  }, [projectPath, addToast])

  const handleWriteGitignore = useCallback(async () => {
    const r = await window.electronAPI.projectGitWriteGitignore(projectPath)
    if (r.success) { addToast(r.existed ? '.gitignore reset to UE template' : '.gitignore created', 'success'); setHasGitignore(true) }
    else addToast(r.error ?? 'Failed to write .gitignore', 'error')
  }, [projectPath, addToast])

  const handleReinit = useCallback(async () => {
    const r = await window.electronAPI.projectGitReinit(projectPath)
    if (r.success) addToast('Git repo reinitialized', 'success')
    else addToast(r.error ?? 'Reinit failed', 'error')
    onClose()
  }, [projectPath, addToast, onClose])

  return createPortal(
    <motion.div ref={subRef} data-menu-panel className="fixed z-10000 select-none"
      style={{ ...MENU_STYLE, top: pos.top, left: pos.left, width: 240 }}
      onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}
      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
      transition={{ duration: 0.1 }}>
      <div className="py-1 max-h-[80vh] overflow-y-auto">

        {/* Repository */}
        <Cat label="Repository" />
        {!gitInitialized ? (
          <Item icon={<GitMerge size={11} style={{ color: '#a78bfa' }} />}
            label="Initialize Repo" hint="+ LFS + .gitignore"
            onClick={onGitInit} onClose={onClose} />
        ) : (
          <Item icon={<RefreshCw size={11} style={{ color: '#94a3b8' }} />}
            label="Reinitialize Repo" onClick={handleReinit} noClose onClose={onClose} />
        )}

        <Sep />

        {/* Config Files */}
        <Cat label="Config Files" />
        <Item icon={<FileText size={11} style={{ color: '#60a5fa' }} />}
          label={hasGitignore ? 'Reset .gitignore' : 'Add .gitignore'} hint="UE template"
          onClick={handleWriteGitignore} noClose onClose={onClose} />
        <Item icon={<Database size={11} style={{ color: '#34d399' }} />}
          label={hasGitattributes ? 'Reinit Git LFS' : 'Init Git LFS'} hint=".gitattributes"
          onClick={handleInitLfs} noClose onClose={onClose} />

        {gitInitialized && (
          <>
            <Sep />

            {/* Changes / Commit */}
            <Cat label="Changes" />
            {!showCommitPanel ? (
              <Item icon={<GitCommit size={11} style={{ color: '#f59e0b' }} />}
                label="Commit Changes" onClick={loadChanges} noClose onClose={onClose} />
            ) : (
              <div className="px-2.5 pb-2">
                {changesSummary && (
                  <p className="text-[9px] mb-1.5 px-0.5" style={{ color: 'var(--color-text-muted)' }}>{changesSummary}</p>
                )}
                <input autoFocus type="text" placeholder="Commit message�"
                  value={commitMsg} onChange={(e) => setCommitMsg(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCommit(); if (e.key === 'Escape') setShowCommitPanel(false) }}
                  className="w-full text-[11px] px-2 py-1 rounded outline-none mb-1.5"
                  style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
                <div className="flex gap-1">
                  <button onClick={handleCommit} disabled={!commitMsg.trim() || committing}
                    className="flex-1 text-[10px] py-1 rounded cursor-pointer disabled:opacity-40"
                    style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}>
                    {committing ? 'Committing�' : 'Commit'}
                  </button>
                  <button onClick={() => setShowCommitPanel(false)}
                    className="px-2 text-[10px] py-1 rounded cursor-pointer"
                    style={{ backgroundColor: 'var(--color-surface-card)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
                    ?
                  </button>
                </div>
              </div>
            )}

            <Sep />

            {/* Branch */}
            <Cat label="Branch" />
            <div className="px-2.5 py-1 text-[10px] flex items-center gap-1.5" style={{ color: '#34d399' }}>
              <GitBranch size={10} />
              <span className="font-mono">{gitBranch}</span>
            </div>
            {!showBranchPanel ? (
              <Item icon={<ChevronRight size={11} style={{ color: 'var(--color-text-muted)' }} />}
                label="Switch / New Branch" onClick={loadBranches} noClose onClose={onClose} />
            ) : (
              <div className="px-2.5 pb-2">
                {loadingBranches ? (
                  <p className="text-[10px] py-1" style={{ color: 'var(--color-text-muted)' }}>Loading�</p>
                ) : (
                  <>
                    {branches.filter(b => b !== gitBranch).length === 0 && (
                      <p className="text-[10px] py-0.5 mb-1" style={{ color: 'var(--color-text-muted)' }}>No other branches</p>
                    )}
                    {branches.filter(b => b !== gitBranch).map(b => (
                      <button key={b} onClick={() => handleSwitchBranch(b)}
                        className="w-full text-left text-[11px] px-2 py-1 rounded cursor-pointer mb-0.5 flex items-center gap-1.5"
                        style={{ color: 'var(--color-text-secondary)' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-card)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <GitBranch size={9} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                        {b}
                      </button>
                    ))}
                    <div className="flex gap-1 mt-1.5">
                      <input type="text" placeholder="New branch�"
                        value={newBranch} onChange={(e) => setNewBranch(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleCreateBranch() }}
                        className="flex-1 text-[11px] px-2 py-1 rounded outline-none"
                        style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
                      <button onClick={handleCreateBranch} disabled={!newBranch.trim()}
                        className="px-2 py-1 rounded cursor-pointer disabled:opacity-40 flex items-center"
                        style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}>
                        <Plus size={11} />
                      </button>
                    </div>
                  </>
                )}
                <button onClick={() => setShowBranchPanel(false)}
                  className="mt-1 text-[9px] cursor-pointer" style={{ color: 'var(--color-text-muted)' }}>
                  ? back
                </button>
              </div>
            )}

            {gitRemoteUrl && (
              <>
                <Sep />
                <Cat label="Remote" />
                <Item icon={<Globe size={11} style={{ color: '#60a5fa' }} />} label="Open Remote"
                  onClick={() => window.electronAPI.projectOpenRemote(gitRemoteUrl)} onClose={onClose} />
                <Item icon={<Copy size={11} style={{ color: 'var(--color-text-muted)' }} />} label="Copy Remote URL"
                  onClick={() => navigator.clipboard.writeText(gitRemoteUrl)} onClose={onClose} />
              </>
            )}
          </>
        )}
      </div>
    </motion.div>,
    document.body
  )
}

// -- Submenu trigger -----------------------------------------------------------
const SubTrigger = ({ triggerRef, icon, label, isOpen, onOpen, onLeave }: {
  triggerRef: React.RefObject<HTMLButtonElement | null>; icon: React.ReactNode
  label: string; isOpen: boolean; onOpen: () => void; onLeave: () => void
}): React.ReactElement => (
  <button ref={triggerRef} onMouseEnter={onOpen} onMouseLeave={onLeave}
    className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] cursor-pointer transition-colors rounded-sm"
    style={{ color: isOpen ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
      backgroundColor: isOpen ? 'var(--color-surface-card)' : 'transparent',
      width: 'calc(100% - 8px)', margin: '0 4px' }}>
    <span className="shrink-0 w-3.5 flex items-center justify-center">{icon}</span>
    <span className="flex-1 text-left whitespace-nowrap">{label}</span>
    <ChevronRight size={10} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
  </button>
)

// -- Main menu -----------------------------------------------------------------
export default function ProjectContextMenu(p: ProjectContextMenuProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null)
  const toolsTriggerRef = useRef<HTMLButtonElement>(null)
  const gitTriggerRef = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState({ top: p.y, left: p.x, width: 220 })
  const [activeSub, setActiveSub] = useState<'tools' | 'git' | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (ref.current) {
      const { offsetWidth: w, offsetHeight: h } = ref.current
      setPos({ top: Math.min(p.y, window.innerHeight - h - 8), left: Math.min(p.x, window.innerWidth - w - 8), width: w })
    }
  }, [p.x, p.y])

  // Outside-click: close only if click is outside all menu elements
  // We use a data attribute so portaled submenus are also covered
  useEffect(() => {
    const t = setTimeout(() => {
      const handler = (e: PointerEvent): void => {
        const target = e.target as Element | null
        if (!target) return
        // Any element inside a menu panel has data-menu-panel attribute on an ancestor
        if (target.closest('[data-menu-panel]')) return
        p.onClose()
      }
      document.addEventListener('pointerdown', handler)
      return () => document.removeEventListener('pointerdown', handler)
    }, 50)
    return () => clearTimeout(t)
  }, [p.onClose])

  const openSub = useCallback((sub: 'tools' | 'git') => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setActiveSub(sub)
  }, [])
  const closeSub = useCallback(() => {
    closeTimer.current = setTimeout(() => setActiveSub(null), 120)
  }, [])
  const keepSub = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }, [])

  return createPortal(
    <>
      <motion.div ref={ref} data-menu-panel className="fixed z-9999 select-none"
        style={{ ...MENU_STYLE, top: pos.top, left: pos.left, width: 220 }}
        initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.1 }}>

        {/* Header */}
        <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{p.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[9px] font-mono px-1 py-px"
              style={{ borderRadius: 'calc(var(--radius) * 0.4)',
                backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                color: 'color-mix(in srgb, var(--color-accent) 90%, white)',
                border: '1px solid color-mix(in srgb, var(--color-accent) 22%, transparent)' }}>
              UE {p.projectVersion}
            </span>
            {p.gitInitialized && (
              <span className="flex items-center gap-1">
                <GitBranch size={9} style={{ color: '#34d399' }} />
                <span className="text-[9px] font-mono" style={{ color: '#34d399' }}>{p.gitBranch}</span>
              </span>
            )}
          </div>
        </div>

        <div className="py-1">
          <Cat label="Open" />
          <Item icon={<Play size={11} style={{ color: 'var(--color-accent)' }} />} label="Open in Editor" onClick={p.onLaunch} onClose={p.onClose} />
          <Item icon={<Gamepad2 size={11} style={{ color: '#4ade80' }} />} label="Launch as Game" onClick={p.onLaunchGame} onClose={p.onClose} />
          <Sep />
          <Cat label="Organize" />
          <Item icon={<Star size={11} fill={p.isFavorite ? '#facc15' : 'none'} style={{ color: p.isFavorite ? '#facc15' : 'var(--color-text-muted)' }} />}
            label={p.isFavorite ? 'Remove Favorite' : 'Add to Favorites'} onClick={p.onFavorite} onClose={p.onClose} />
          <Item icon={<FolderOpen size={11} style={{ color: 'var(--color-text-muted)' }} />} label="Open Folder" onClick={p.onOpenDir} onClose={p.onClose} />
          <Item icon={<Copy size={11} style={{ color: 'var(--color-text-muted)' }} />} label="Copy Path"
            onClick={() => navigator.clipboard.writeText(p.projectPath)} onClose={p.onClose} />
          <Sep />
          <Cat label="Tools" />
          <SubTrigger triggerRef={toolsTriggerRef}
            icon={<Wrench size={11} style={{ color: activeSub === 'tools' ? 'var(--color-accent)' : 'var(--color-text-muted)' }} />}
            label="Project Tools" isOpen={activeSub === 'tools'} onOpen={() => openSub('tools')} onLeave={closeSub} />
          <SubTrigger triggerRef={gitTriggerRef}
            icon={<GitMerge size={11} style={{ color: activeSub === 'git' ? '#a78bfa' : 'var(--color-text-muted)' }} />}
            label="Git" isOpen={activeSub === 'git'} onOpen={() => openSub('git')} onLeave={closeSub} />
          <Sep />
          <Item icon={<AlertTriangle size={11} />} label="Remove from List" onClick={p.onDelete} danger onClose={p.onClose} />
        </div>
      </motion.div>

      <AnimatePresence>
        {activeSub === 'tools' && (
          <ProjectToolsSubMenu projectPath={p.projectPath} anchorRef={toolsTriggerRef}
            parentLeft={pos.left} parentWidth={pos.width} onViewLogs={p.onViewLogs} onClose={p.onClose}
            onMouseEnter={keepSub} onMouseLeave={closeSub} />
        )}
        {activeSub === 'git' && (
          <GitSubMenu projectPath={p.projectPath} gitInitialized={p.gitInitialized}
            gitBranch={p.gitBranch} gitRemoteUrl={p.gitRemoteUrl} anchorRef={gitTriggerRef}
            parentLeft={pos.left} parentWidth={pos.width} onGitInit={p.onGitInit} onClose={p.onClose}
            onMouseEnter={keepSub} onMouseLeave={closeSub} />
        )}
      </AnimatePresence>
    </>,
    document.body
  )
}

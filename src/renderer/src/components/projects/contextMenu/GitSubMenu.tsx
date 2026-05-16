// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { GitMerge, GitBranch, FileText, Database, GitCommit, Globe, Copy } from 'lucide-react'
import { useToast } from '../../ui/ToastContext'
import { MenuItem, MenuSeparator, MENU_STYLE } from './contextMenuComponents'
import { useContextMenuPosition } from './useContextMenuPosition'

export const GitSubMenu = ({
  projectPath,
  gitInitialized,
  gitBranch,
  gitRemoteUrl,
  anchorRef,
  parentLeft,
  parentWidth,
  onGitInit,
  onOpenCommit,
  onOpenBranch,
  onClose,
  onMouseEnter,
  onMouseLeave
}: {
  projectPath: string
  gitInitialized: boolean
  gitBranch: string
  gitRemoteUrl: string
  anchorRef: React.RefObject<HTMLButtonElement | null>
  parentLeft: number
  parentWidth: number
  onGitInit: () => void
  onOpenCommit: () => void
  onOpenBranch: () => void
  onClose: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}): React.ReactElement => {
  const subRef = useRef<HTMLDivElement>(null)
  const pos = useContextMenuPosition(anchorRef, subRef, parentLeft, parentWidth)
  const { addToast } = useToast()
  const [hasGitignore, setHasGitignore] = useState(false)
  const [hasGitattributes, setHasGitattributes] = useState(false)

  useEffect(() => {
    window.electronAPI.projectGitFileStatus(projectPath).then((s) => {
      setHasGitignore(s.hasGitignore)
      setHasGitattributes(s.hasGitattributes)
    })
  }, [projectPath])

  const handleInitLfs = useCallback(async () => {
    const r = await window.electronAPI.projectGitInitLfs(projectPath)
    if (r.success) {
      addToast('Git LFS initialized', 'success')
      setHasGitattributes(true)
    } else addToast(r.error ?? 'LFS init failed — install git-lfs first', 'error')
  }, [projectPath, addToast])

  const handleWriteGitignore = useCallback(async () => {
    const r = await window.electronAPI.projectGitWriteGitignore(projectPath)
    if (r.success) {
      addToast(r.existed ? '.gitignore reset' : '.gitignore created', 'success')
      setHasGitignore(true)
    } else addToast(r.error ?? 'Failed to write .gitignore', 'error')
  }, [projectPath, addToast])

  return createPortal(
    <motion.div
      ref={subRef}
      data-menu-panel
      className="fixed z-10000 select-none"
      style={{ ...MENU_STYLE, top: pos.top, left: pos.left, width: 250 }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -6 }}
      transition={{ duration: 0.1 }}
    >
      <div className="py-1">
        {/* Repo init — only show when not yet initialized */}
        {!gitInitialized && (
          <MenuItem
            icon={<GitMerge size={11} style={{ color: '#a78bfa' }} />}
            label="Initialize Repo"
            sub="git init + LFS + .gitignore"
            onClick={onGitInit}
            onClose={onClose}
          />
        )}
        {gitInitialized && (
          /* Repo status info row — not clickable */
          <div className="flex items-center gap-2 px-2.5 py-1.5 mx-1">
            <span className="shrink-0 w-3.5 flex items-center justify-center">
              <GitBranch size={11} style={{ color: '#34d399' }} />
            </span>
            <span className="flex-1 min-w-0">
              <span
                className="block text-[11px] leading-tight"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Git Initialized
              </span>
              <span
                className="block text-[9px] leading-tight mt-0.5 font-mono"
                style={{ color: '#34d399' }}
              >
                {gitBranch}
              </span>
            </span>
          </div>
        )}
        <MenuSeparator />
        {/* Config files */}
        <MenuItem
          icon={<FileText size={11} style={{ color: '#60a5fa' }} />}
          label={hasGitignore ? 'Reset .gitignore' : 'Add .gitignore'}
          sub="UE template — ignores Binaries, Saved, etc."
          onClick={handleWriteGitignore}
          noClose
          onClose={onClose}
        />
        <MenuItem
          icon={<Database size={11} style={{ color: '#34d399' }} />}
          label={hasGitattributes ? 'Reinit Git LFS' : 'Init Git LFS'}
          sub="Track .uasset, .umap, textures with LFS"
          onClick={handleInitLfs}
          noClose
          onClose={onClose}
        />
        {gitInitialized && (
          <>
            <MenuSeparator />
            {/* Commit */}
            <MenuItem
              icon={<GitCommit size={11} style={{ color: '#f59e0b' }} />}
              label="Commit Changes"
              sub="Stage all and commit"
              onClick={onOpenCommit}
              onClose={onClose}
            />
            {/* Branch */}
            <MenuItem
              icon={<GitBranch size={11} style={{ color: '#34d399' }} />}
              label="Switch / New Branch"
              sub={`Current: ${gitBranch}`}
              onClick={onOpenBranch}
              onClose={onClose}
            />
            {/* Remote */}
            {gitRemoteUrl && (
              <>
                <MenuSeparator />
                <MenuItem
                  icon={<Globe size={11} style={{ color: '#60a5fa' }} />}
                  label="Open Remote"
                  sub={gitRemoteUrl
                    .replace(/^git@([^:]+):/, 'https://$1/')
                    .replace(/\.git$/, '')}
                  onClick={() => window.electronAPI.projectOpenRemote(gitRemoteUrl)}
                  onClose={onClose}
                />
                <MenuItem
                  icon={<Copy size={11} style={{ color: 'var(--color-text-muted)' }} />}
                  label="Copy Remote URL"
                  sub="Copy to clipboard"
                  onClick={() => navigator.clipboard.writeText(gitRemoteUrl)}
                  onClose={onClose}
                />
              </>
            )}
          </>
        )}
      </div>
    </motion.div>,
    document.body
  )
}

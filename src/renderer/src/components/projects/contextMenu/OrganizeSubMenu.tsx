// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { FolderOpen, Terminal, ExternalLink, Copy } from 'lucide-react'
import { useToast } from '../../ui/ToastContext'
import { MenuItem, MenuSeparator, MENU_STYLE } from './contextMenuComponents'
import { useContextMenuPosition } from './useContextMenuPosition'

const IS_WIN = window.electronAPI?.platform === 'win32'
const IS_MAC = window.electronAPI?.platform === 'darwin'
const HAS_GITHUB_DESKTOP = IS_WIN || IS_MAC

export const OrganizeSubMenu = ({
  projectPath,
  gitInitialized,
  anchorRef,
  parentLeft,
  parentWidth,
  onOpenDir,
  onClose,
  onMouseEnter,
  onMouseLeave
}: {
  projectPath: string
  gitInitialized: boolean
  anchorRef: React.RefObject<HTMLButtonElement | null>
  parentLeft: number
  parentWidth: number
  onOpenDir: () => void
  onClose: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}): React.ReactElement => {
  const subRef = useRef<HTMLDivElement>(null)
  const pos = useContextMenuPosition(anchorRef, subRef, parentLeft, parentWidth)
  const { addToast } = useToast()

  return createPortal(
    <motion.div
      ref={subRef}
      data-menu-panel
      className="fixed z-10000 select-none"
      style={{ ...MENU_STYLE, top: pos.top, left: pos.left, width: 230 }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -6 }}
      transition={{ duration: 0.1 }}
    >
      <div className="py-1">
        <MenuItem
          icon={<FolderOpen size={11} style={{ color: '#f59e0b' }} />}
          label="Open Folder"
          sub="Open in file explorer"
          onClick={onOpenDir}
          onClose={onClose}
        />
        <MenuItem
          icon={<Terminal size={11} style={{ color: '#a78bfa' }} />}
          label="Open in Terminal"
          sub="Open project folder in terminal"
          onClick={() =>
            window.electronAPI.projectOpenTerminal(projectPath).then((r) => {
              if (!r.success) addToast(r.error ?? 'Could not open terminal', 'error')
            })
          }
          onClose={onClose}
        />
        {gitInitialized && HAS_GITHUB_DESKTOP && (
          <MenuItem
            icon={<ExternalLink size={11} style={{ color: '#60a5fa' }} />}
            label="Open in GitHub Desktop"
            sub="View repo in GitHub Desktop app"
            onClick={() =>
              window.electronAPI.projectOpenGithub(projectPath).then((r) => {
                if (!r.success) addToast(r.error ?? 'GitHub Desktop not found', 'error')
              })
            }
            onClose={onClose}
          />
        )}
        <MenuSeparator />
        <MenuItem
          icon={<Copy size={11} style={{ color: '#94a3b8' }} />}
          label="Copy Path"
          sub={projectPath.split(/[\\/]/).slice(-2).join('/')}
          onClick={() => navigator.clipboard.writeText(projectPath)}
          onClose={onClose}
        />
      </div>
    </motion.div>,
    document.body
  )
}

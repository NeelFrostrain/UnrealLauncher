// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useCallback, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { Settings2, FileCode2, ScrollText, Trash2 } from 'lucide-react'
import { useToast } from '../../ui/ToastContext'
import { MenuItem, MenuSeparator, MENU_STYLE } from './contextMenuComponents'
import { useContextMenuPosition } from './useContextMenuPosition'

export const ProjectToolsSubMenu = ({
  projectPath,
  anchorRef,
  parentLeft,
  parentWidth,
  onViewLogs,
  onClose,
  onMouseEnter,
  onMouseLeave
}: {
  projectPath: string
  anchorRef: React.RefObject<HTMLButtonElement | null>
  parentLeft: number
  parentWidth: number
  onViewLogs: () => void
  onClose: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}): React.ReactElement => {
  const subRef = useRef<HTMLDivElement>(null)
  const pos = useContextMenuPosition(anchorRef, subRef, parentLeft, parentWidth)
  const [cleaning, setCleaning] = useState(false)
  const { addToast } = useToast()

  const handleClean = useCallback(async () => {
    setCleaning(true)
    const r = await window.electronAPI.projectCleanIntermediate(projectPath)
    setCleaning(false)
    if (r.cleaned.length > 0)
      addToast(`Cleaned ${r.cleaned.length} item${r.cleaned.length !== 1 ? 's' : ''}`, 'success')
    else addToast('Nothing to clean', 'info')
    onClose()
  }, [projectPath, addToast, onClose])

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
          icon={<Settings2 size={11} style={{ color: '#94a3b8' }} />}
          label="Edit Default Config"
          sub="DefaultEngine.ini"
          onClick={() => window.electronAPI.projectOpenDefaultConfig(projectPath)}
          onClose={onClose}
        />
        <MenuItem
          icon={<FileCode2 size={11} style={{ color: 'var(--color-accent)' }} />}
          label="Edit .uproject File"
          sub="Open project descriptor"
          onClick={() => window.electronAPI.projectOpenUproject(projectPath)}
          onClose={onClose}
        />
        <MenuItem
          icon={<ScrollText size={11} style={{ color: '#f59e0b' }} />}
          label="View Logs"
          sub="Tail latest Saved/Logs file"
          onClick={onViewLogs}
          onClose={onClose}
        />
        <MenuSeparator />
        <MenuItem
          icon={<Trash2 size={11} style={{ color: '#f87171' }} />}
          label={cleaning ? 'Cleaning...' : 'Clean Project'}
          sub={cleaning ? 'Removing generated files...' : 'Intermediate, Binaries, Build, Saved'}
          onClick={handleClean}
          disabled={cleaning}
          danger
          noClose
          onClose={onClose}
        />
      </div>
    </motion.div>,
    document.body
  )
}

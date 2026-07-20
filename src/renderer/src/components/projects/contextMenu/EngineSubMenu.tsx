// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { Check } from 'lucide-react'
import { MenuItem, MENU_STYLE } from './contextMenuComponents'
import { useContextMenuPosition } from './useContextMenuPosition'

export const EngineSubMenu = ({
  engines,
  currentVersion,
  anchorRef,
  parentLeft,
  parentWidth,
  onSelectEngine,
  onClose,
  onMouseEnter,
  onMouseLeave
}: {
  engines: Array<{ version: string; alias?: string }>
  currentVersion: string
  anchorRef: React.RefObject<HTMLButtonElement | null>
  parentLeft: number
  parentWidth: number
  onSelectEngine: (version: string) => void
  onClose: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}): React.ReactElement => {
  const subRef = useRef<HTMLDivElement>(null)
  const pos = useContextMenuPosition(anchorRef, subRef, parentLeft, parentWidth)

  return createPortal(
    <div
      ref={subRef}
      data-menu-panel
      role="menu"
      aria-label="Change Engine Version"
      className="fixed z-10000 select-none"
      style={{ ...MENU_STYLE, top: pos.top, left: pos.left, width: 230 }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="py-1 max-h-[250px] overflow-y-auto">
        {engines.length === 0 ? (
          <div className="px-3 py-2 text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
            No Unreal Engines added
          </div>
        ) : (
          engines.map((e) => {
            const isActive = e.version === currentVersion
            return (
              <MenuItem
                key={e.version}
                icon={isActive ? <Check size={11} style={{ color: 'var(--color-accent)' }} /> : undefined}
                label={e.alias || `Unreal Engine ${e.version}`}
                sub={`Version: ${e.version}`}
                onClick={() => onSelectEngine(e.version)}
                onClose={onClose}
              />
            )
          })
        )}
      </div>
    </div>,
    document.body
  )
}

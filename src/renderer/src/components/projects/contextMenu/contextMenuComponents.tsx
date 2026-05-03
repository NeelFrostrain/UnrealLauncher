// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { ChevronRight } from 'lucide-react'

export const MENU_STYLE: React.CSSProperties = {
  backgroundColor: 'var(--color-surface-elevated)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.55)'
}

/**
 * Menu item component - compact single-line row
 */
export const MenuItem = ({
  icon,
  label,
  sub,
  onClick,
  danger = false,
  disabled = false,
  noClose = false,
  onHoverIn,
  onHoverOut,
  onClose
}: {
  icon: React.ReactNode
  label: string
  sub?: string
  onClick?: () => void
  danger?: boolean
  disabled?: boolean
  noClose?: boolean
  onHoverIn?: () => void
  onHoverOut?: () => void
  onClose: () => void
}): React.ReactElement => (
  <button
    onClick={() => {
      if (!disabled && onClick) {
        onClick()
        if (!noClose) onClose()
      }
    }}
    disabled={disabled}
    onMouseEnter={(e) => {
      if (!disabled)
        e.currentTarget.style.backgroundColor = danger
          ? 'rgba(248,113,113,0.08)'
          : 'var(--color-surface-card)'
      onHoverIn?.()
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'transparent'
      onHoverOut?.()
    }}
    className="flex items-center gap-2 px-2.5 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-default rounded-sm"
    style={{
      color: danger ? '#f87171' : 'var(--color-text-secondary)',
      width: 'calc(100% - 8px)',
      margin: '0 4px',
      paddingTop: sub ? '5px' : '4px',
      paddingBottom: sub ? '5px' : '4px'
    }}
  >
    <span className="shrink-0 w-3.5 flex items-center justify-center self-start mt-px">
      {icon}
    </span>
    <span className="flex-1 text-left min-w-0">
      <span className="block text-[11px] leading-tight truncate">{label}</span>
      {sub && (
        <span
          className="block text-[9px] leading-tight mt-0.5 truncate"
          style={{ color: danger ? 'rgba(248,113,113,0.6)' : 'var(--color-text-muted)' }}
        >
          {sub}
        </span>
      )}
    </span>
  </button>
)

/**
 * Menu separator line
 */
export const MenuSeparator = (): React.ReactElement => (
  <div className="h-px my-1" style={{ backgroundColor: 'var(--color-border)' }} />
)

/**
 * Menu category label
 */
export const MenuCategory = ({ label }: { label: string }): React.ReactElement => (
  <p
    className="px-2.5 pt-1.5 pb-0.5 text-[9px] font-semibold uppercase tracking-widest select-none"
    style={{ color: 'var(--color-text-muted)', opacity: 0.5 }}
  >
    {label}
  </p>
)

/**
 * Submenu trigger row with chevron
 */
export const SubMenuTrigger = ({
  triggerRef,
  icon,
  label,
  isOpen,
  onOpen,
  onLeave
}: {
  triggerRef: React.RefObject<HTMLButtonElement | null>
  icon: React.ReactNode
  label: string
  isOpen: boolean
  onOpen: () => void
  onLeave: () => void
}): React.ReactElement => (
  <button
    ref={triggerRef}
    onMouseEnter={onOpen}
    onMouseLeave={onLeave}
    className="flex items-center gap-2 px-2.5 py-1 text-[11px] cursor-pointer transition-colors rounded-sm"
    style={{
      color: isOpen ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
      backgroundColor: isOpen ? 'var(--color-surface-card)' : 'transparent',
      width: 'calc(100% - 8px)',
      margin: '0 4px'
    }}
  >
    <span className="shrink-0 w-3.5 flex items-center justify-center">{icon}</span>
    <span className="flex-1 text-left whitespace-nowrap">{label}</span>
    <ChevronRight size={10} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
  </button>
)

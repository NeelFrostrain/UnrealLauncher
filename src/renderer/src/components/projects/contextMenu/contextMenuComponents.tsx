// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { ChevronRight } from 'lucide-react'

export const MENU_STYLE: React.CSSProperties = {
  backgroundColor: 'var(--color-surface-elevated)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
  backdropFilter: 'blur(10px)',
  overflow: 'hidden'
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
    role="menuitem"
    aria-label={label}
    onClick={() => {
      if (!disabled && onClick) {
        onClick()
        if (!noClose) onClose()
      }
    }}
    disabled={disabled}
    onMouseEnter={(e) => {
      if (!disabled) {
        e.currentTarget.style.backgroundColor = danger
          ? 'color-mix(in srgb, #f87171 12%, transparent)'
          : 'rgba(255, 255, 255, 0.015)'
        e.currentTarget.style.borderColor = danger
          ? 'color-mix(in srgb, #f87171 26%, transparent)'
          : 'rgba(255, 255, 255, 0.04)'
      }
      onHoverIn?.()
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'transparent'
      e.currentTarget.style.borderColor = 'transparent'
      onHoverOut?.()
    }}
    className="flex items-center gap-2 px-2.5 py-1.5 cursor-pointer transition-all duration-150 disabled:opacity-40 rounded-md border border-transparent outline-none"
    style={{
      color: danger ? '#f87171' : 'var(--color-text-secondary)',
      width: 'calc(100% - 8px)',
      margin: '0 4px',
      paddingTop: sub ? '6px' : '5px',
      paddingBottom: sub ? '6px' : '5px'
    }}
  >
    {icon && (
      <span className="shrink-0 w-3.5 flex items-center justify-center self-start mt-px">{icon}</span>
    )}
    <span className="flex-1 text-left min-w-0">
      <span
        className="block text-[11px] leading-tight truncate"
        style={{ color: danger ? '#f87171' : 'var(--color-text-primary)' }}
      >
        {label}
      </span>
      {sub && (
        <span
          className="block text-[9px] leading-tight mt-0.5 truncate"
          style={{ color: danger ? 'rgba(248,113,113,0.7)' : 'var(--color-text-muted)' }}
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
    className="px-2.5 pt-2 pb-1 text-[9px] font-semibold uppercase tracking-[0.2em] select-none"
    style={{ color: 'color-mix(in srgb, var(--color-text-muted) 80%, var(--color-text-primary))' }}
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
    role="menuitem"
    aria-haspopup="menu"
    aria-expanded={isOpen}
    aria-label={label}
    onMouseEnter={onOpen}
    onMouseLeave={onLeave}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
        e.preventDefault()
        e.stopPropagation()
        onOpen()
      }
    }}
    className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] cursor-pointer transition-all duration-150 rounded-md border border-transparent outline-none focus:outline-none"
    style={{
      color: isOpen ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
      backgroundColor: isOpen ? 'rgba(255, 255, 255, 0.015)' : 'transparent',
      borderColor: isOpen ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
      width: 'calc(100% - 8px)',
      margin: '0 4px'
    }}
  >
    <span className="shrink-0 w-3.5 flex items-center justify-center">{icon}</span>
    <span className="flex-1 text-left whitespace-nowrap">{label}</span>
    <ChevronRight size={10} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
  </button>
)

// Copyright (c) 2026 NeelFrostrain. All rights reserved.
/** Sort dropdown component — extracted from ProjectsToolbar to keep it under 200 lines. */
import { useRef, useState, useEffect } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, Check } from 'lucide-react'
import type { SortConfig, SortKey } from '../projectUtils'
import { SORT_OPTIONS } from '../projectUtils'

interface Props {
  sortConfig: SortConfig
  onSortChange: (config: SortConfig) => void
}

export function SortDropdown({ sortConfig, onSortChange }: Props): React.ReactElement {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleKey = (key: SortKey): void => {
    if (sortConfig.key === key) {
      onSortChange({ key, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })
    } else {
      onSortChange({ key, direction: key === 'name' || key === 'version' ? 'asc' : 'desc' })
    }
    setOpen(false)
  }

  const activeLabel = SORT_OPTIONS.find((o) => o.key === sortConfig.key)?.label ?? 'Sort'
  const DirIcon = sortConfig.direction === 'asc' ? ArrowUp : ArrowDown

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer"
        aria-label={`Sort by ${activeLabel}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          borderRadius: 'var(--radius)',
          backgroundColor: open ? 'color-mix(in srgb, var(--color-accent) 15%, var(--color-surface-card))' : 'var(--color-surface-card)',
          border: `1px solid ${open ? 'var(--color-accent)' : 'var(--color-border)'}`,
          color: 'var(--color-text-secondary)'
        }}
        title="Sort projects"
      >
        <ArrowUpDown size={12} style={{ color: open ? 'var(--color-accent)' : 'var(--color-text-muted)' }} />
        <span>{activeLabel}</span>
        <DirIcon size={10} style={{ color: 'var(--color-text-muted)' }} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 z-50 py-1.5 w-44"
          style={{
            backgroundColor: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
            fontSize: '12px'
          }}
        >
          {/* Direction toggle */}
          <div className="flex items-center gap-1 mx-2 mb-1.5 p-0.5 rounded" style={{ backgroundColor: 'var(--color-surface-card)' }}>
            {(['asc', 'desc'] as const).map((dir) => (
              <button key={dir}
                onClick={() => onSortChange({ ...sortConfig, direction: dir })}
                className="flex-1 flex items-center justify-center gap-1 py-0.5 rounded cursor-pointer transition-all"
                style={{
                  fontSize: '11px',
                  fontWeight: sortConfig.direction === dir ? 600 : 400,
                  backgroundColor: sortConfig.direction === dir ? 'color-mix(in srgb, var(--color-accent) 20%, var(--color-surface-elevated))' : 'transparent',
                  color: sortConfig.direction === dir ? 'var(--color-accent)' : 'var(--color-text-muted)'
                }}>
                {dir === 'asc' ? <ArrowUp size={9} /> : <ArrowDown size={9} />}
                {dir === 'asc' ? 'Asc' : 'Desc'}
              </button>
            ))}
          </div>

          <div className="mx-2 mb-1" style={{ height: '1px', backgroundColor: 'var(--color-border)' }} />

          {SORT_OPTIONS.map((opt) => {
            const isActive = sortConfig.key === opt.key
            return (
              <button key={opt.key} onClick={() => handleKey(opt.key)}
                className="w-full flex items-center justify-between gap-2 px-3 py-1 transition-colors cursor-pointer"
                style={{
                  fontSize: '12px',
                  color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  backgroundColor: isActive ? 'color-mix(in srgb, var(--color-accent) 8%, transparent)' : 'transparent'
                }}>
                <span>{opt.label}</span>
                {isActive && <Check size={11} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

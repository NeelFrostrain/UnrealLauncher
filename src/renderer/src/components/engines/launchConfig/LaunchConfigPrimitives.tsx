// Copyright (c) 2026 NeelFrostrain. All rights reserved.
/** Small reusable UI primitives used exclusively by LaunchConfigDialog. */
import { ChevronDown } from 'lucide-react'

// ── Pill ──────────────────────────────────────────────────────────────────────
export function Pill({ label, color = 'var(--color-accent)' }: { label: string; color?: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full shrink-0"
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
        color
      }}
    >
      {label}
    </span>
  )
}

// ── Toggle ────────────────────────────────────────────────────────────────────
export function Toggle({
  on,
  onChange,
  disabled = false
}: {
  on: boolean
  onChange: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      role="switch"
      aria-checked={on}
      className="relative w-11 h-6 rounded-full transition-all duration-200 cursor-pointer focus:outline-none disabled:opacity-30 disabled:cursor-default shrink-0"
      style={{
        backgroundColor: on
          ? 'var(--color-accent)'
          : 'color-mix(in srgb, var(--color-border) 120%, transparent)',
        boxShadow: on
          ? '0 0 0 2px color-mix(in srgb, var(--color-accent) 30%, transparent)'
          : 'none'
      }}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow transition-transform duration-200 ${on ? 'translate-x-5' : 'translate-x-0'}`}
        style={{ backgroundColor: on ? 'white' : 'var(--color-text-secondary)' }}
      />
    </button>
  )
}

// ── Feature row ───────────────────────────────────────────────────────────────
export function FeatureRow({
  label,
  sub,
  value,
  onChange,
  disabled = false,
  warn = false
}: {
  label: string
  sub?: string
  value: boolean
  onChange: () => void
  disabled?: boolean
  warn?: boolean
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 px-4 py-3.5 transition-colors"
      style={{
        backgroundColor:
          !disabled && value && warn ? 'color-mix(in srgb, #f59e0b 5%, transparent)' : 'transparent'
      }}
    >
      <div className="min-w-0 flex-1">
        <p
          className="text-sm font-medium leading-snug"
          style={{ color: disabled ? 'var(--color-text-muted)' : 'var(--color-text-primary)' }}
        >
          {label}
        </p>
        {sub && (
          <p
            className="text-[11px] mt-0.5 font-mono leading-snug"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {sub}
          </p>
        )}
      </div>
      <Toggle on={value} onChange={onChange} disabled={disabled} />
    </div>
  )
}

// ── Section header ────────────────────────────────────────────────────────────
export function SectionHead({
  icon,
  label,
  accent = 'var(--color-accent)'
}: {
  icon: React.ReactNode
  label: string
  accent?: string
}) {
  return (
    <div className="flex items-center gap-2.5 px-1 mb-2.5 mt-6 first:mt-0">
      <div
        className="w-6 h-6 flex items-center justify-center shrink-0"
        style={{
          borderRadius: 'calc(var(--radius) * 0.5)',
          backgroundColor: `color-mix(in srgb, ${accent} 15%, transparent)`,
          border: `1px solid color-mix(in srgb, ${accent} 28%, transparent)`
        }}
      >
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <span
        className="text-[11px] font-semibold uppercase tracking-widest select-none"
        style={{ color: 'var(--color-text-muted)', opacity: 0.75 }}
      >
        {label}
      </span>
    </div>
  )
}

// ── Styled select ─────────────────────────────────────────────────────────────
export function StyledSelect({
  value,
  onChange,
  disabled,
  children
}: {
  value: string
  onChange: (v: string) => void
  disabled: boolean
  children: React.ReactNode
}) {
  return (
    <div className="relative shrink-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="appearance-none pl-3.5 pr-9 py-2 text-sm cursor-pointer outline-none disabled:opacity-50 disabled:cursor-default"
        style={{
          borderRadius: 'calc(var(--radius) * 0.7)',
          backgroundColor: 'var(--color-surface-card)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-primary)',
          minWidth: 172
        }}
      >
        {children}
      </select>
      <ChevronDown
        size={13}
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: 'var(--color-text-muted)' }}
      />
    </div>
  )
}

// Copyright (c) 2026 NeelFrostrain. All rights reserved.

export const SettingRow = ({
  label,
  description,
  children,
  last = false,
  className
}: {
  label: string
  description?: string
  children: React.ReactNode
  last?: boolean
  className?: string
}): React.ReactElement => (
  <div
    className={`flex items-center justify-between gap-6 px-5 py-4.5 transition-all duration-200 hover:bg-white/[0.01] ${className || ''}`}
    style={!last ? { borderBottom: '1px solid var(--color-border)' } : undefined}
  >
    <div className="max-w-sm flex-1 min-w-0">
      <p
        className="text-sm font-semibold tracking-wide"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {label}
      </p>
      {description && (
        <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          {description}
        </p>
      )}
    </div>
    <div className="flex justify-end items-center shrink-0">{children}</div>
  </div>
)

export const Toggle = ({
  on,
  onChange,
  color = 'blue'
}: {
  on: boolean
  onChange: () => void
  color?: 'blue' | 'green'
}): React.ReactElement => {
  const activeBg =
    color === 'green'
      ? 'linear-gradient(135deg, #4ade80, #22c55e)'
      : 'linear-gradient(135deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 80%, black))'

  return (
    <button
      onClick={onChange}
      className="relative w-12 h-6 rounded-full transition-all duration-300 cursor-pointer focus:outline-none select-none group border"
      style={{
        background: on ? activeBg : 'var(--color-surface-card)',
        borderColor: on ? 'transparent' : 'var(--color-border)',
        boxShadow: on
          ? `0 0 12px color-mix(in srgb, ${color === 'green' ? '#22c55e' : 'var(--color-accent)'} 30%, transparent)`
          : 'none'
      }}
      role="switch"
      aria-checked={on}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-md transition-all duration-300 ease-out group-hover:scale-105 ${
          on ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

export const SectionHeader = ({
  icon,
  label,
  accent
}: {
  icon: React.ReactNode
  label: string
  accent?: string
}): React.ReactElement => {
  const finalAccent = accent || 'var(--color-accent)'
  return (
    <div className="flex items-center gap-3 mb-3.5 mt-2 px-1 select-none">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300"
        style={{
          background: `color-mix(in srgb, ${finalAccent} 12%, var(--color-surface-elevated))`,
          border: `1px solid color-mix(in srgb, ${finalAccent} 25%, var(--color-border))`,
          color: finalAccent
        }}
      >
        {icon}
      </div>
      <span
        className="text-[11px] font-bold uppercase tracking-widest text-left"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {label}
      </span>
    </div>
  )
}

export const Card = ({ children }: { children: React.ReactNode }): React.ReactElement => (
  <div
    className="overflow-hidden transition-all duration-300"
    style={{
      background:
        'linear-gradient(180deg, var(--color-surface-elevated) 0%, var(--color-surface) 100%)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
    }}
  >
    {children}
  </div>
)

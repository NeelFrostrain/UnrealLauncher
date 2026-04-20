// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
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
    className={`flex items-center justify-between gap-6 px-5 py-4 ${className || ''}`}
    style={!last ? { borderBottom: '1px solid var(--color-border)' } : undefined}
  >
    <div className="min-w-0">
      <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
        {label}
      </p>
      {description && (
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          {description}
        </p>
      )}
    </div>
    <div className="shrink-0">{children}</div>
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
}): React.ReactElement => (
  <button
    onClick={onChange}
    className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer focus:outline-none ${
      on ? (color === 'green' ? 'bg-green-500' : 'bg-blue-600') : ''
    }`}
    style={!on ? { backgroundColor: 'var(--color-border)' } : undefined}
    role="switch"
    aria-checked={on}
  >
    <span
      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
        on ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
)

export const SectionHeader = ({
  icon,
  label,
  accent
}: {
  icon: React.ReactNode
  label: string
  accent: string
}): React.ReactElement => (
  <div className="flex items-center gap-2.5 mb-2 px-1">
    <div className={`w-6 h-6 rounded-md flex items-center justify-center ${accent}`}>{icon}</div>
    <span
      className="text-xs font-semibold uppercase tracking-widest"
      style={{ color: 'var(--color-text-muted)' }}
    >
      {label}
    </span>
  </div>
)

export const Card = ({ children }: { children: React.ReactNode }): React.ReactElement => (
  <div
    className={`overflow-hidden`}
    style={{
      backgroundColor: 'var(--color-surface-elevated)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius)'
    }}
  >
    {children}
  </div>
)

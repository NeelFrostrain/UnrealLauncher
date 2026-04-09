
export const SettingRow = ({
  label,
  description,
  children,
  last = false
}: {
  label: string
  description?: string
  children: React.ReactNode
  last?: boolean
}): React.ReactElement => (
  <div
    className={`flex items-center justify-between gap-6 px-5 py-4 ${!last ? 'border-b border-white/5' : ''}`}
  >
    <div className="min-w-0">
      <p className="text-sm font-medium text-white/85">{label}</p>
      {description && <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{description}</p>}
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
      on ? (color === 'green' ? 'bg-green-500' : 'bg-blue-600') : 'bg-white/15'
    }`}
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
    <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">{label}</span>
  </div>
)

export const Card = ({ children }: { children: React.ReactNode }): React.ReactElement => (
  <div
    className="border border-white/8 overflow-hidden"
    style={{ backgroundColor: 'var(--color-surface-elevated)', borderRadius: 'var(--radius)' }}
  >
    {children}
  </div>
)

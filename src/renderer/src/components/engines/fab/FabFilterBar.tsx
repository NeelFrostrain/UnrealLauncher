import type { FC } from 'react'

interface TypeMeta {
  label: string
  icon: React.ReactNode
  color: string
}

interface FabFilterBarProps {
  assets: FabAsset[]
  typeFilter: FabAsset['type'] | 'all'
  typeLabels: Record<FabAsset['type'], TypeMeta>
  onFilterChange: (filter: FabAsset['type'] | 'all') => void
}

const FabFilterBar: FC<FabFilterBarProps> = ({ assets, typeFilter, typeLabels, onFilterChange }) => {
  const counts = assets.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div
      className="flex items-center gap-1.5 px-4 py-2 shrink-0 overflow-x-auto"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <button
        onClick={() => onFilterChange('all')}
        className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer shrink-0"
        style={{
          borderRadius: 'var(--radius)',
          backgroundColor: typeFilter === 'all' ? 'var(--color-accent)' : 'var(--color-surface-card)',
          color: typeFilter === 'all' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          border: `1px solid ${typeFilter === 'all' ? 'var(--color-accent)' : 'var(--color-border)'}`
        }}
      >
        All <span style={{ opacity: 0.6 }}>({assets.length})</span>
      </button>
      {(Object.keys(typeLabels) as FabAsset['type'][]).map((t) => {
        if (!counts[t]) return null
        const { label, icon, color } = typeLabels[t]
        const isActive = typeFilter === t
        return (
          <button
            key={t}
            onClick={() => onFilterChange(t)}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer shrink-0"
            style={{
              borderRadius: 'var(--radius)',
              backgroundColor: isActive ? 'var(--color-surface-elevated)' : 'var(--color-surface-card)',
              color: isActive ? color : 'var(--color-text-secondary)',
              border: `1px solid ${isActive ? color : 'var(--color-border)'}`
            }}
          >
            <span style={{ color: isActive ? color : 'var(--color-text-muted)' }}>{icon}</span>
            {label} <span style={{ opacity: 0.6 }}>({counts[t]})</span>
          </button>
        )
      })}
    </div>
  )
}

export default FabFilterBar

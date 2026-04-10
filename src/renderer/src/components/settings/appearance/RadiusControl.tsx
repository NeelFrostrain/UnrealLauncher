import { type CSSProperties } from 'react'
import { applyRadius, persistRadius } from '../../../utils/theme'

interface RadiusControlProps {
  radius: number
  setRadius: (value: number) => void
}

const RadiusControl = ({ radius, setRadius }: RadiusControlProps): React.ReactElement => (
  <div className="p-5 border-t border-white/5">
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm font-medium text-white/85">Border radius</p>
      <span className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
        {radius}px
      </span>
    </div>
    <div className="flex items-center gap-3">
      <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
        Sharp
      </span>
      <input
        type="range"
        min={0}
        max={24}
        step={1}
        value={radius}
        onChange={(e) => {
          const v = Number(e.target.value)
          setRadius(v)
          applyRadius(v)
          persistRadius(v)
          e.currentTarget.style.setProperty('--range-pct', `${(v / 24) * 100}%`)
        }}
        className="flex-1 cursor-pointer"
        style={{ '--range-pct': `${(radius / 24) * 100}%` } as CSSProperties}
      />
      <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
        Round
      </span>
    </div>
    <div className="flex items-center gap-2 mt-3">
      {[0, 4, 8, 12, 16, 24].map((v) => (
        <button
          key={v}
          onClick={() => {
            setRadius(v)
            applyRadius(v)
            persistRadius(v)
          }}
          className="w-8 h-8 border transition-all cursor-pointer text-[10px] font-mono"
          style={{
            borderRadius: `${v}px`,
            borderColor: radius === v ? 'var(--color-accent)' : 'var(--color-border)',
            backgroundColor:
              radius === v
                ? 'color-mix(in srgb, var(--color-accent) 15%, transparent)'
                : 'var(--color-surface-card)',
            color: 'var(--color-text-muted)'
          }}
        >
          {v}
        </button>
      ))}
    </div>
  </div>
)

export default RadiusControl

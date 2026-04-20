// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { type CSSProperties, useEffect, useRef } from 'react'
import { applyRadius, persistRadius, applyScale, persistScale } from '../../../utils/theme'

interface RadiusControlProps {
  radius: number
  setRadius: (value: number) => void
  scale: number
  setScale: (value: number) => void
}

const SCALE_PRESETS = [0.8, 0.9, 1.0, 1.1, 1.2, 1.25]
const SCALE_MIN = 0.7
const SCALE_MAX = 1.5

function scalePct(v: number): string {
  return `${((v - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100}%`
}

const RadiusControl = ({
  radius,
  setRadius,
  scale,
  setScale
}: RadiusControlProps): React.ReactElement => {
  const scaleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    scaleRef.current?.style.setProperty('--range-pct', scalePct(scale))
  }, [scale])

  const handleScale = (v: number): void => {
    setScale(v)
    applyScale(v)
    persistScale(v)
    scaleRef.current?.style.setProperty('--range-pct', scalePct(v))
  }

  return (
    <>
      {/* Border radius */}
      <div className="p-5" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            Border radius
          </p>
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
              className="w-8 h-8 transition-all cursor-pointer text-[10px] font-mono"
              style={{
                borderRadius: `${v}px`,
                border: `1px solid ${radius === v ? 'var(--color-accent)' : 'var(--color-border)'}`,
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

      {/* UI Scale */}
      <div className="p-5" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              UI Scale
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Scale the entire interface — text, icons, spacing.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {Math.abs(scale - 1.0) > 0.01 && (
              <button
                onClick={() => handleScale(1.0)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium cursor-pointer transition-all"
                style={{
                  borderRadius: 'calc(var(--radius) * 0.6)',
                  backgroundColor: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
                  color: 'var(--color-accent)',
                  border: '1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)'
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    'color-mix(in srgb, var(--color-accent) 18%, transparent)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    'color-mix(in srgb, var(--color-accent) 10%, transparent)')
                }
              >
                ↺ Reset
              </button>
            )}
            <span className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
              {Math.round(scale * 100)}%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
            Smaller
          </span>
          <input
            ref={scaleRef}
            type="range"
            min={SCALE_MIN}
            max={SCALE_MAX}
            step={0.05}
            value={scale}
            onChange={(e) => handleScale(Number(e.target.value))}
            className="flex-1 cursor-pointer"
          />
          <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
            Bigger
          </span>
        </div>
        <div className="flex items-center gap-2">
          {SCALE_PRESETS.map((v) => (
            <button
              key={v}
              onClick={() => handleScale(v)}
              className="px-2 py-1 transition-all cursor-pointer text-[10px] font-mono"
              style={{
                borderRadius: 'calc(var(--radius) * 0.5)',
                border: `1px solid ${Math.abs(scale - v) < 0.01 ? 'var(--color-accent)' : 'var(--color-border)'}`,
                backgroundColor:
                  Math.abs(scale - v) < 0.01
                    ? 'color-mix(in srgb, var(--color-accent) 15%, transparent)'
                    : 'var(--color-surface-card)',
                color: 'var(--color-text-muted)'
              }}
            >
              {Math.round(v * 100)}%
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

export default RadiusControl

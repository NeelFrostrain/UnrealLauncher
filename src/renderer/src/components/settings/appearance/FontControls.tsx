// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { type CSSProperties } from 'react'
import { BUILT_IN_THEMES, type ThemeToken } from '../../../utils/theme'

const FONT_OPTIONS = [
  {
    id: 'inter',
    label: 'Inter',
    value: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
  {
    id: 'open-sans',
    label: 'Open Sans',
    value: "'Open Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
  {
    id: 'outfit',
    label: 'Outfit',
    value: "'Outfit', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
  {
    id: 'roboto',
    label: 'Roboto',
    value: "'Roboto', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
  {
    id: 'rubik',
    label: 'Rubik',
    value: "'Rubik', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
  {
    id: 'ubuntu',
    label: 'Ubuntu',
    value: "'Ubuntu', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  }
]

interface FontControlsProps {
  activeThemeId: string
  customOverrides: Partial<Record<ThemeToken, string>>
  setOverride: (token: ThemeToken, value: string) => void
}

const FontControls = ({
  activeThemeId,
  customOverrides,
  setOverride
}: FontControlsProps): React.ReactElement => {
  const activeThemeTokens = BUILT_IN_THEMES.find((t) => t.id === activeThemeId)?.tokens
  const currentFontFamily = customOverrides['font-family'] ?? activeThemeTokens?.['font-family']
  const currentFontSizeRaw =
    customOverrides['font-size'] ?? activeThemeTokens?.['font-size'] ?? '15px'
  const currentFontSize = Number(currentFontSizeRaw.replace('px', ''))

  return (
    <>
      {/* Font family */}
      <div className="p-5" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Font family
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Choose a font for sidebar, settings, and UI text.
            </p>
          </div>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {FONT_OPTIONS.find((o) => o.value === currentFontFamily)?.label || 'Custom'}
          </p>
        </div>
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}
        >
          {FONT_OPTIONS.map((option) => {
            const active =
              customOverrides['font-family'] === option.value ||
              (customOverrides['font-family'] === undefined &&
                activeThemeTokens?.['font-family'] === option.value)
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setOverride('font-family', option.value)}
                className="px-3 py-2 text-xs text-left transition-all cursor-pointer"
                style={{
                  borderRadius: 'var(--radius)',
                  fontFamily: option.value,
                  backgroundColor: active
                    ? 'color-mix(in srgb, var(--color-accent) 12%, transparent)'
                    : 'var(--color-surface-elevated)',
                  border: `1px solid ${active ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
                }}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Font size */}
      <div className="p-5" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Font size
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Adjust base UI text size for readability.
            </p>
          </div>
          <span className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
            {currentFontSize}px
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
            Smaller
          </span>
          <input
            type="range"
            min={12}
            max={20}
            step={1}
            value={currentFontSize}
            onInput={(e) => setOverride('font-size', `${(e.target as HTMLInputElement).value}px`)}
            onChange={(e) => setOverride('font-size', `${e.target.value}px`)}
            className="flex-1 cursor-pointer"
            style={{ '--range-pct': `${((currentFontSize - 12) / 8) * 100}%` } as CSSProperties}
          />
          <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
            Bigger
          </span>
        </div>
      </div>
    </>
  )
}

export default FontControls

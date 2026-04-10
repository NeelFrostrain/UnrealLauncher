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

const FontControls = ({ activeThemeId, customOverrides, setOverride }: FontControlsProps): React.ReactElement => {
  const activeThemeTokens = BUILT_IN_THEMES.find((t) => t.id === activeThemeId)?.tokens

  const currentFontFamily =
    customOverrides['font-family'] ?? activeThemeTokens?.['font-family']

  const currentFontSizeRaw =
    customOverrides['font-size'] ?? activeThemeTokens?.['font-size'] ?? '15px'
  const currentFontSize = Number(currentFontSizeRaw.replace('px', ''))

  return (
    <>
      <div className="p-5 border-t border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-white/85">Font family</p>
            <p className="text-xs text-white/50 mt-0.5">
              Choose a font for sidebar, settings, and UI text.
            </p>
          </div>
          <p className="text-xs text-white/30">
            {FONT_OPTIONS.find((option) => option.value === currentFontFamily)?.label || 'Custom'}
          </p>
        </div>
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
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
                className={`rounded-lg px-3 py-2 text-xs text-left transition-all border ${
                  active ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 bg-white/5'
                } hover:border-blue-400/70`}
                style={{ fontFamily: option.value }}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="p-5 border-t border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-white/85">Font size</p>
            <p className="text-xs text-white/50 mt-0.5">
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
            style={
              {
                '--range-pct': `${((currentFontSize - 12) / 8) * 100}%`
              } as CSSProperties
            }
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

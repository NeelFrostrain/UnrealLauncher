import { RotateCcw } from 'lucide-react'
import { BUILT_IN_THEMES, type ThemeToken } from '../../../utils/theme'

const COLOR_TOKENS: Array<{ token: ThemeToken; label: string }> = [
  { token: 'accent', label: 'Accent' },
  { token: 'border', label: 'Border' },
  { token: 'surface', label: 'Background' },
  { token: 'surface-card', label: 'Card' },
  { token: 'surface-elevated', label: 'Elevated' }
]

interface ColorOverridesProps {
  activeThemeId: string
  customOverrides: Partial<Record<ThemeToken, string>>
  hasOverrides: boolean
  setOverride: (token: ThemeToken, value: string) => void
  resetOverrides: () => void
}

const ColorOverrides = ({
  activeThemeId,
  customOverrides,
  hasOverrides,
  setOverride,
  resetOverrides
}: ColorOverridesProps): React.ReactElement => (
  <div className="p-5">
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm font-medium text-white/85">Custom colors</p>
      {hasOverrides && (
        <button
          onClick={resetOverrides}
          className="flex items-center gap-1 text-[11px] text-white/35 hover:text-white/65 transition-colors cursor-pointer"
        >
          <RotateCcw size={11} />
          Reset
        </button>
      )}
    </div>
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}
    >
      {COLOR_TOKENS.map(({ token, label }) => {
        const base =
          BUILT_IN_THEMES.find((t) => t.id === activeThemeId)?.tokens[token] ?? '#000000'
        const current = customOverrides[token] ?? base
        const isHex = current.startsWith('#')
        const pickerValue = isHex ? current : '#ffffff'
        const isOverridden = !!customOverrides[token]
        return (
          <label
            key={token}
            className="flex items-center gap-2.5 p-2.5 rounded-lg border border-white/6 cursor-pointer hover:border-white/12 transition-colors"
            style={{ backgroundColor: 'var(--color-surface-card)' }}
          >
            <div className="relative">
              <input
                type="color"
                value={pickerValue}
                onChange={(e) => setOverride(token, e.target.value)}
                className="w-8 h-8 rounded-md cursor-pointer opacity-0 absolute inset-0"
              />
              <div
                className="w-8 h-8 rounded-md border border-white/15 pointer-events-none"
                style={{ background: current }}
              />
              {isOverridden && (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-purple-400 border border-black" />
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-white/75">{label}</p>
              <p className="text-[10px] text-white/30 font-mono">{current.slice(0, 9)}</p>
            </div>
          </label>
        )
      })}
    </div>
  </div>
)

export default ColorOverrides

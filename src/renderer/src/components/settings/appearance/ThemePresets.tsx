import { Check } from 'lucide-react'
import { BUILT_IN_THEMES, type ThemeToken } from '../../../utils/theme'

interface ThemePresetsProps {
  activeThemeId: string
  hasOverrides: boolean
  setTheme: (id: string) => void
}

const ThemePresets = ({ activeThemeId, hasOverrides, setTheme }: ThemePresetsProps): React.ReactElement => (
  <div className="p-5 border-b border-white/5">
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm font-medium text-white/85">Theme Presets</p>
      {hasOverrides && (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/25">
          Custom active
        </span>
      )}
    </div>
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}
    >
      {BUILT_IN_THEMES.map((theme) => {
        const active = activeThemeId === theme.id
        return (
          <button
            key={theme.id}
            onClick={() => setTheme(theme.id)}
            className="relative rounded-lg p-2.5 border-2 transition-all cursor-pointer text-left group"
            style={{
              background: theme.tokens['surface'],
              borderColor: active ? theme.tokens['accent'] : 'rgba(255,255,255,0.08)'
            }}
          >
            <div className="flex gap-1 mb-2">
              {(['accent', 'surface-elevated', 'surface-card'] as ThemeToken[]).map((t) => (
                <div
                  key={t}
                  className="w-3 h-3 rounded-full"
                  style={{ background: theme.tokens[t] }}
                />
              ))}
            </div>
            <p
              className="text-[11px] font-medium leading-none"
              style={{ color: theme.tokens['text-secondary'] }}
            >
              {theme.name}
            </p>
            {active && (
              <div
                className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background: theme.tokens['accent'] }}
              >
                <Check size={9} className="text-white" />
              </div>
            )}
          </button>
        )
      })}
    </div>
  </div>
)

export default ThemePresets

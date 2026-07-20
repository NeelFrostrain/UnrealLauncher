// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { Check } from 'lucide-react'
import { BUILT_IN_THEMES, type ThemeToken } from '../../../utils/theme'

interface ThemePresetsProps {
  activeThemeId: string
  hasOverrides: boolean
  setTheme: (id: string) => void
}

const ThemePresets = ({
  activeThemeId,
  hasOverrides,
  setTheme
}: ThemePresetsProps): React.ReactElement => (
  <div className="p-5">
    <div className="flex items-center justify-between mb-4">
      <p
        className="text-sm font-semibold tracking-wide"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Theme Presets
      </p>
      {hasOverrides && (
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
            color: 'color-mix(in srgb, var(--color-accent) 95%, white)',
            border: '1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)'
          }}
        >
          Custom Overrides Active
        </span>
      )}
    </div>
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}
    >
      {BUILT_IN_THEMES.map((theme) => {
        const active = activeThemeId === theme.id
        return (
          <button
            key={theme.id}
            onClick={() => setTheme(theme.id)}
            className="relative p-3.5 border transition-all duration-300 cursor-pointer text-left overflow-hidden group hover:-translate-y-0.5 hover:shadow-lg"
            style={{
              borderRadius: 'var(--radius)',
              background: `linear-gradient(180deg, ${theme.tokens['surface-elevated']} 0%, ${theme.tokens['surface-card']} 100%)`,
              borderColor: active ? theme.tokens['accent'] : 'var(--color-border)',
              boxShadow: active
                ? `0 4px 14px color-mix(in srgb, ${theme.tokens['accent']} 20%, transparent)`
                : 'none'
            }}
          >
            {/* Visual Mini Mockup */}
            <div
              className="flex gap-1.5 mb-3 p-2 rounded-lg select-none border transition-colors"
              style={{
                backgroundColor: 'rgba(0,0,0,0.15)',
                borderColor: active ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)'
              }}
            >
              {/* Sidebar */}
              <div
                className="w-4 h-8 rounded-sm shrink-0"
                style={{ background: theme.tokens['surface'] }}
              />
              {/* Content */}
              <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                <div
                  className="h-2 rounded-sm w-3/4"
                  style={{ background: theme.tokens['accent'] }}
                />
                <div
                  className="h-1 rounded-sm w-full opacity-60"
                  style={{ background: theme.tokens['text-muted'] }}
                />
                <div
                  className="h-1 rounded-sm w-2/3 opacity-60"
                  style={{ background: theme.tokens['text-muted'] }}
                />
              </div>
            </div>

            {/* Colors preview line */}
            <div className="flex gap-1 mb-2">
              {(['accent', 'surface', 'text-primary'] as ThemeToken[]).map((t) => (
                <div
                  key={t}
                  className="w-2.5 h-2.5 rounded-full border border-white/5"
                  style={{ background: theme.tokens[t] }}
                />
              ))}
            </div>

            <p
              className="text-xs font-semibold"
              style={{
                color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
              }}
            >
              {theme.name}
            </p>

            {active && (
              <div
                className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center shadow-md"
                style={{ background: theme.tokens['accent'] }}
              >
                <Check size={9} className="text-white font-bold" />
              </div>
            )}
          </button>
        )
      })}
    </div>
  </div>
)

export default ThemePresets

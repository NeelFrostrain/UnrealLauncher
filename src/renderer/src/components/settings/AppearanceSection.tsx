import { type CSSProperties, type RefObject } from 'react'
import { Check, RotateCcw } from 'lucide-react'
import { BUILT_IN_THEMES, type ThemeToken, applyRadius, persistRadius } from '../../utils/theme'
import { Card, SectionHeader } from './SectionHelpers'
import SavedProfilesSection from './SavedProfilesSection'

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

export interface AppearanceSectionProps {
  activeThemeId: string
  customOverrides: Partial<Record<ThemeToken, string>>
  setTheme: (id: string) => void
  setOverride: (token: ThemeToken, value: string) => void
  resetOverrides: () => void
  profiles: Array<{ id: string; name: string; tokens: Record<ThemeToken, string> }>
  activeProfileId: string | null
  applyProfile: (id: string) => void
  deleteProfile: (id: string) => void
  radius: number
  setRadius: (value: number) => void
  savingProfile: boolean
  setSavingProfile: (value: boolean) => void
  newProfileName: string
  setNewProfileName: (value: string) => void
  editingProfileId: string | null
  setEditingProfileId: (value: string | null) => void
  editingName: string
  setEditingName: (value: string) => void
  nameInputRef: RefObject<HTMLInputElement | null>
  handleSaveProfile: () => void
  handleStartEdit: (id: string, currentName: string) => void
  handleFinishEdit: () => void
}

const AppearanceSection = ({
  activeThemeId,
  customOverrides,
  setTheme,
  setOverride,
  resetOverrides,
  profiles,
  activeProfileId,
  applyProfile,
  deleteProfile,
  radius,
  setRadius,
  savingProfile,
  setSavingProfile,
  newProfileName,
  setNewProfileName,
  editingProfileId,
  setEditingProfileId,
  editingName,
  setEditingName,
  nameInputRef,
  handleSaveProfile,
  handleStartEdit,
  handleFinishEdit
}: AppearanceSectionProps): React.ReactElement => {
  const hasOverrides = Object.keys(customOverrides).length > 0

  return (
    <section>
      <SectionHeader
        icon={<Check size={13} className="text-purple-300" />}
        label="Appearance"
        accent="bg-purple-500/20"
      />
      <Card>
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

        <div className="p-5 border-t border-white/5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-white/85">Font family</p>
              <p className="text-xs text-white/50 mt-0.5">
                Choose a font for sidebar, settings, and UI text.
              </p>
            </div>
            <p className="text-xs text-white/30">
              {FONT_OPTIONS.find(
                (option) =>
                  option.value ===
                  (customOverrides['font-family'] ??
                    BUILT_IN_THEMES.find((t) => t.id === activeThemeId)?.tokens['font-family'])
              )?.label || 'Custom'}
            </p>
          </div>
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
            {FONT_OPTIONS.map((option) => {
              const active =
                customOverrides['font-family'] === option.value ||
                (customOverrides['font-family'] === undefined &&
                  BUILT_IN_THEMES.find((t) => t.id === activeThemeId)?.tokens['font-family'] ===
                    option.value)
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
              {Number(
                (
                  customOverrides['font-size'] ??
                  BUILT_IN_THEMES.find((t) => t.id === activeThemeId)?.tokens['font-size'] ??
                  '15px'
                ).replace('px', '')
              )}
              px
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
              value={Number(
                (
                  customOverrides['font-size'] ??
                  BUILT_IN_THEMES.find((t) => t.id === activeThemeId)?.tokens['font-size'] ??
                  '15px'
                ).replace('px', '')
              )}
              onInput={(e) => setOverride('font-size', `${(e.target as HTMLInputElement).value}px`)}
              onChange={(e) => setOverride('font-size', `${e.target.value}px`)}
              className="flex-1 cursor-pointer"
              style={
                {
                  '--range-pct': `${((Number((customOverrides['font-size'] ?? BUILT_IN_THEMES.find((t) => t.id === activeThemeId)?.tokens['font-size'] ?? '15px').replace('px', '')) - 12) / 8) * 100}%`
                } as CSSProperties
              }
            />
            <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
              Bigger
            </span>
          </div>
        </div>

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
            {[
              { token: 'accent' as ThemeToken, label: 'Accent' },
              { token: 'border' as ThemeToken, label: 'Border' },
              { token: 'surface' as ThemeToken, label: 'Background' },
              { token: 'surface-card' as ThemeToken, label: 'Card' },
              { token: 'surface-elevated' as ThemeToken, label: 'Elevated' }
            ].map(({ token, label }) => {
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

        <SavedProfilesSection
          profiles={profiles}
          activeProfileId={activeProfileId}
          savingProfile={savingProfile}
          setSavingProfile={setSavingProfile}
          newProfileName={newProfileName}
          setNewProfileName={setNewProfileName}
          editingProfileId={editingProfileId}
          editingName={editingName}
          setEditingName={setEditingName}
          nameInputRef={nameInputRef}
          handleSaveProfile={handleSaveProfile}
          handleStartEdit={handleStartEdit}
          handleFinishEdit={handleFinishEdit}
          applyProfile={applyProfile}
          deleteProfile={deleteProfile}
        />
      </Card>
    </section>
  )
}

export default AppearanceSection

import { useState, useEffect, useRef } from 'react'
import PageWrapper from '../layout/PageWrapper'
import {
  Activity,
  Database,
  FolderOpen,
  Palette,
  RotateCcw,
  Trash2,
  Zap,
  Check,
  Plus,
  Pencil,
  X
} from 'lucide-react'
import { getSetting, setSetting } from '../utils/settings'
import { useTheme } from '../utils/ThemeContext'
import {
  BUILT_IN_THEMES,
  type ThemeToken,
  loadPersistedRadius,
  persistRadius,
  applyRadius
} from '../utils/theme'

// ── Reusable row ──────────────────────────────────────────────────────────────

const SettingRow = ({
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

// ── Toggle ────────────────────────────────────────────────────────────────────

const Toggle = ({
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
      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${on ? 'translate-x-5' : 'translate-x-0'}`}
    />
  </button>
)

// ── Section header ────────────────────────────────────────────────────────────

const SectionHeader = ({
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

// ── Card wrapper ──────────────────────────────────────────────────────────────

const Card = ({ children }: { children: React.ReactNode }): React.ReactElement => (
  <div
    className="rounded-xl border border-white/8 overflow-hidden"
    style={{ backgroundColor: 'var(--color-surface-elevated)' }}
  >
    {children}
  </div>
)

// ── Page ──────────────────────────────────────────────────────────────────────

const SettingsPage = (): React.ReactElement => {
  const {
    activeThemeId,
    customOverrides,
    setTheme,
    setOverride,
    resetOverrides,
    profiles,
    activeProfileId,
    saveAsProfile,
    applyProfile,
    updateProfile,
    deleteProfile
  } = useTheme()
  const [autoCloseOnLaunch, setAutoCloseOnLaunch] = useState(() => getSetting('autoCloseOnLaunch'))
  const [tracerAutoStart, setTracerAutoStart] = useState(false)
  const [tracerRunning, setTracerRunning] = useState(false)
  const [tracerDataDir, setTracerDataDir] = useState('')
  const [tracerMerge, setTracerMerge] = useState(true)
  const [clearing, setClearing] = useState<'app' | 'tracer' | null>(null)
  // Profile UI state
  const [savingProfile, setSavingProfile] = useState(false)
  const [newProfileName, setNewProfileName] = useState('')
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)
  // Radius
  const [radius, setRadius] = useState(() => loadPersistedRadius())

  useEffect(() => {
    window.electronAPI.getTracerStartup().then(setTracerAutoStart)
    window.electronAPI.isTracerRunning().then(setTracerRunning)
    window.electronAPI.getTracerDataDir().then(setTracerDataDir)
    window.electronAPI.getTracerMerge().then(setTracerMerge)
    const interval = setInterval(() => {
      window.electronAPI.isTracerRunning().then(setTracerRunning)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleSaveProfile = (): void => {
    const name = newProfileName.trim() || `Profile ${profiles.length + 1}`
    saveAsProfile(name)
    setNewProfileName('')
    setSavingProfile(false)
  }

  const handleStartEdit = (id: string, currentName: string): void => {
    setEditingProfileId(id)
    setEditingName(currentName)
    setTimeout(() => nameInputRef.current?.focus(), 50)
  }

  const handleFinishEdit = (): void => {
    if (editingProfileId && editingName.trim()) {
      updateProfile(editingProfileId, { name: editingName.trim() })
    }
    setEditingProfileId(null)
  }

  const handleClearAppData = async (): Promise<void> => {
    if (!confirm('Clear all saved engines and projects? This cannot be undone.')) return
    setClearing('app')
    await window.electronAPI.clearAppData()
    setClearing(null)
  }

  const handleClearTracerData = async (): Promise<void> => {
    if (!confirm('Clear all tracer history? This cannot be undone.')) return
    setClearing('tracer')
    await window.electronAPI.clearTracerData()
    setClearing(null)
  }

  const hasOverrides = Object.keys(customOverrides).length > 0

  return (
    <PageWrapper>
      <div className="flex-1 overflow-y-auto">
        {/* Page title */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0">
          <div>
            <h1 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Settings
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Customize your Unreal Launcher experience
            </p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-7">
          {/* ── Appearance ── */}
          <section>
            <SectionHeader
              icon={<Palette size={13} className="text-purple-300" />}
              label="Appearance"
              accent="bg-purple-500/20"
            />
            <Card>
              {/* Theme picker */}
              <div className="p-5 border-b border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-white/85">Theme</p>
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
                        {/* Color dots */}
                        <div className="flex gap-1 mb-2">
                          {(['accent', 'surface-elevated', 'surface-card'] as ThemeToken[]).map(
                            (t) => (
                              <div
                                key={t}
                                className="w-3 h-3 rounded-full"
                                style={{ background: theme.tokens[t] }}
                              />
                            )
                          )}
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

              {/* Border radius */}
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
                    style={{ '--range-pct': `${(radius / 24) * 100}%` } as React.CSSProperties}
                  />
                  <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                    Round
                  </span>
                </div>
                {/* Preview row */}
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

              {/* Custom colors */}
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
                    { token: 'surface' as ThemeToken, label: 'Background' },
                    { token: 'surface-card' as ThemeToken, label: 'Card' },
                    { token: 'surface-elevated' as ThemeToken, label: 'Elevated' }
                  ].map(({ token, label }) => {
                    const base =
                      BUILT_IN_THEMES.find((t) => t.id === activeThemeId)?.tokens[token] ??
                      '#000000'
                    const current = customOverrides[token] ?? base
                    const isHex = current.startsWith('#')
                    const isOverridden = !!customOverrides[token]
                    return (
                      <label
                        key={token}
                        className="flex items-center gap-2.5 p-2.5 rounded-lg border border-white/6 cursor-pointer hover:border-white/12 transition-colors"
                        style={{ backgroundColor: 'var(--color-surface-card)' }}
                      >
                        <div className="relative">
                          {isHex ? (
                            <input
                              type="color"
                              value={current}
                              onChange={(e) => setOverride(token, e.target.value)}
                              className="w-8 h-8 rounded-md cursor-pointer opacity-0 absolute inset-0"
                            />
                          ) : null}
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
                          <p className="text-[10px] text-white/30 font-mono">
                            {current.slice(0, 9)}
                          </p>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Saved profiles */}
              <div className="p-5 border-t border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-white/85">Saved profiles</p>
                  {!savingProfile && (
                    <button
                      onClick={() => {
                        setSavingProfile(true)
                        setTimeout(() => nameInputRef.current?.focus(), 50)
                      }}
                      className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white/70 transition-colors cursor-pointer"
                    >
                      <Plus size={12} />
                      Save current
                    </button>
                  )}
                </div>

                {/* Inline name input */}
                {savingProfile && (
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveProfile()
                        if (e.key === 'Escape') setSavingProfile(false)
                      }}
                      placeholder="Profile name…"
                      className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-white/80 placeholder:text-white/25 outline-none focus:border-white/25"
                    />
                    <button
                      onClick={handleSaveProfile}
                      className="px-3 py-1.5 rounded-lg text-xs bg-blue-600 text-white cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setSavingProfile(false)}
                      className="p-1.5 rounded-lg text-white/30 hover:text-white/60 cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}

                {profiles.length === 0 && !savingProfile && (
                  <p className="text-xs text-white/25 italic">No saved profiles yet.</p>
                )}

                {/* Same compact card grid as built-in themes */}
                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}
                >
                  {profiles.map((profile) => {
                    const isActive = activeProfileId === profile.id
                    return (
                      <div
                        key={profile.id}
                        className="relative group rounded-lg p-2.5 border-2 transition-all cursor-pointer"
                        style={{
                          background: profile.tokens['surface'],
                          borderColor: isActive
                            ? profile.tokens['accent']
                            : 'rgba(255,255,255,0.08)'
                        }}
                        onClick={() => !isActive && applyProfile(profile.id)}
                      >
                        {/* Color dots */}
                        <div className="flex gap-1 mb-2">
                          {(['accent', 'surface-elevated', 'surface-card'] as ThemeToken[]).map(
                            (t) => (
                              <div
                                key={t}
                                className="w-3 h-3 rounded-full"
                                style={{ background: profile.tokens[t] }}
                              />
                            )
                          )}
                        </div>

                        {/* Name — inline edit */}
                        {editingProfileId === profile.id ? (
                          <input
                            ref={nameInputRef}
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={handleFinishEdit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === 'Escape') handleFinishEdit()
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-[11px] bg-transparent border-b border-white/30 text-white/80 outline-none"
                          />
                        ) : (
                          <p
                            className="text-[11px] font-medium leading-snug wrap-break-word"
                            style={{ color: profile.tokens['text-secondary'] }}
                          >
                            {profile.name}
                          </p>
                        )}

                        {/* Active checkmark */}
                        {isActive && (
                          <div
                            className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                            style={{ background: profile.tokens['accent'] }}
                          >
                            <Check size={9} className="text-white" />
                          </div>
                        )}

                        {/* Action buttons — always visible, below the name */}
                        <div className="flex items-center gap-1 mt-2 pt-1.5 border-t border-white/8">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStartEdit(profile.id, profile.name)
                            }}
                            className="flex items-center gap-1 text-[10px] text-white/35 hover:text-white/70 transition-colors cursor-pointer"
                            title="Rename"
                          >
                            <Pencil size={10} />
                            Rename
                          </button>
                          <span className="text-white/15 text-[10px]">·</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteProfile(profile.id)
                            }}
                            className="flex items-center gap-1 text-[10px] text-white/35 hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={10} />
                            Delete
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </Card>
          </section>

          {/* ── Launch Behavior ── */}
          <section>
            <SectionHeader
              icon={<Zap size={13} className="text-yellow-300" />}
              label="Launch"
              accent="bg-yellow-500/20"
            />
            <Card>
              <SettingRow
                label="Auto-close on launch"
                description="Close the launcher automatically when opening a project or engine."
                last
              >
                <Toggle
                  on={autoCloseOnLaunch}
                  onChange={() => {
                    const next = !autoCloseOnLaunch
                    setAutoCloseOnLaunch(next)
                    setSetting('autoCloseOnLaunch', next)
                  }}
                />
              </SettingRow>
            </Card>
          </section>

          {/* ── Session Tracer ── */}
          <section>
            <SectionHeader
              icon={<Activity size={13} className="text-green-300" />}
              label="Session Tracer"
              accent="bg-green-500/20"
            />
            <Card>
              <SettingRow
                label="Run tracer on startup"
                description="Start the background tracer with Windows. Tracks engine and project usage."
              >
                <Toggle
                  on={tracerAutoStart}
                  onChange={async () => {
                    const next = !tracerAutoStart
                    setTracerAutoStart(next)
                    setSetting('tracerAutoStart', next)
                    await window.electronAPI.setTracerStartup(next)
                    setTimeout(
                      async () => setTracerRunning(await window.electronAPI.isTracerRunning()),
                      1500
                    )
                  }}
                  color="green"
                />
              </SettingRow>

              <SettingRow
                label="Sync tracer data on scan"
                description="Pull new entries from the tracer into the launcher on each scan."
              >
                <Toggle
                  on={tracerMerge}
                  onChange={async () => {
                    const next = !tracerMerge
                    setTracerMerge(next)
                    await window.electronAPI.setTracerMerge(next)
                  }}
                  color="green"
                />
              </SettingRow>

              {/* Status footer */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${tracerRunning ? 'bg-green-400' : 'bg-white/20'}`}
                  />
                  <span className="text-[11px] text-white/40">
                    {tracerRunning ? 'Running' : 'Not running'}
                  </span>
                </div>
                {tracerDataDir && (
                  <button
                    onClick={() => window.electronAPI.openDirectory(tracerDataDir)}
                    className="flex items-center gap-1 text-[11px] text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                  >
                    <FolderOpen size={12} />
                    Open data folder
                  </button>
                )}
              </div>
            </Card>
          </section>

          {/* ── Data ── */}
          <section>
            <SectionHeader
              icon={<Database size={13} className="text-red-300" />}
              label="Data"
              accent="bg-red-500/20"
            />
            <Card>
              <SettingRow
                label="Clear app data"
                description="Remove all saved engines and projects. Files on disk are not affected."
              >
                <button
                  onClick={handleClearAppData}
                  disabled={clearing === 'app'}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 hover:bg-red-500/18 text-red-400 border border-red-500/20 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Trash2 size={12} />
                  {clearing === 'app' ? 'Clearing…' : 'Clear'}
                </button>
              </SettingRow>
              <SettingRow
                label="Clear tracer data"
                description="Remove all engine and project history recorded by the tracer."
                last
              >
                <button
                  onClick={handleClearTracerData}
                  disabled={clearing === 'tracer'}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 hover:bg-red-500/18 text-red-400 border border-red-500/20 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Trash2 size={12} />
                  {clearing === 'tracer' ? 'Clearing…' : 'Clear'}
                </button>
              </SettingRow>
            </Card>
          </section>
        </div>
      </div>
    </PageWrapper>
  )
}

export default SettingsPage

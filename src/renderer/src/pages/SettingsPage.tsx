// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useState, useRef, useCallback } from 'react'
import PageWrapper from '../layout/PageWrapper'
import AboutPage from './AboutPage'
import { Zap, Palette, Database, RefreshCw, FolderOpen, Activity, Info, X } from 'lucide-react'
import { getSetting, setSetting } from '../utils/settings'
import { useTheme } from '../utils/ThemeContext'
import {
  loadPersistedRadius,
  applyRadius,
  persistRadius,
  applyScale,
  persistScale,
  loadPersistedScale
} from '../utils/theme'
import AppearanceSection from '../components/settings/AppearanceSection'
import LaunchSection from '../components/settings/sections/LaunchSection'
import TracerSection from '../components/settings/sections/TracerSection'
import DataSection from '../components/settings/sections/DataSection'
import UpdatesSection from '../components/settings/sections/UpdatesSection'
import ProjectsSection from '../components/settings/sections/ProjectsSection'
import EnginesSection from '../components/settings/sections/EnginesSection'

// ── Nav items ─────────────────────────────────────────────────────────────────

type SectionId = 'general' | 'appearance' | 'scan' | 'tracer' | 'data' | 'updates' | 'about'

interface NavItem {
  id: SectionId
  label: string
  icon: React.ReactNode
  accent: string
  hidden?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { id: 'general', label: 'General', icon: <Zap size={14} />, accent: '#fbbf24' },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={14} />, accent: '#a78bfa' },
  { id: 'scan', label: 'Scan Paths', icon: <FolderOpen size={14} />, accent: '#60a5fa' },
  { id: 'tracer', label: 'Tracer', icon: <Activity size={14} />, accent: '#4ade80' },
  { id: 'data', label: 'Data', icon: <Database size={14} />, accent: '#f87171' },
  { id: 'updates', label: 'Updates', icon: <RefreshCw size={14} />, accent: '#60a5fa' },
  { id: 'about', label: 'About', icon: <Info size={14} />, accent: '#22d3ee' }
]

// ── Main page ─────────────────────────────────────────────────────────────────

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

  const [activeSection, setActiveSection] = useState<SectionId>('general')
  const [autoCloseOnLaunch, setAutoCloseOnLaunch] = useState(() => getSetting('autoCloseOnLaunch'))
  const [savingProfile, setSavingProfile] = useState(false)
  const [newProfileName, setNewProfileName] = useState('')
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const nameInputRef = useRef<HTMLInputElement | null>(null)
  const [radius, setRadius] = useState(() => loadPersistedRadius())
  const [scale, setScale] = useState(() => loadPersistedScale())
  const [showAbout, setShowAbout] = useState(false)

  const platform = window.electronAPI.platform

  const hasAnyChanges =
    Object.keys(customOverrides).length > 0 || radius !== 8 || Math.abs(scale - 1.0) > 0.01

  const handleFullReset = useCallback((): void => {
    resetOverrides()
    setRadius(8)
    applyRadius(8)
    persistRadius(8)
    setScale(1.0)
    applyScale(1.0)
    persistScale(1.0)
  }, [resetOverrides])

  const handleSaveProfile = useCallback((): void => {
    const name = newProfileName.trim() || `Profile ${profiles.length + 1}`
    saveAsProfile(name)
    setNewProfileName('')
    setSavingProfile(false)
  }, [newProfileName, profiles.length, saveAsProfile])

  const handleStartEdit = useCallback((id: string, currentName: string): void => {
    setEditingProfileId(id)
    setEditingName(currentName)
    setTimeout(() => nameInputRef.current?.focus(), 50)
  }, [])

  const handleFinishEdit = useCallback((): void => {
    if (editingProfileId && editingName.trim()) {
      updateProfile(editingProfileId, { name: editingName.trim() })
    }
    setEditingProfileId(null)
  }, [editingProfileId, editingName, updateProfile])

  // Filter nav items — hide Tracer on Linux, hide Engines scan on non-Linux
  const visibleNav = NAV_ITEMS.filter((item) => {
    if (item.id === 'tracer' && platform === 'linux') return false
    return true
  })

  const renderSection = (): React.ReactNode => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-6">
            <LaunchSection
              autoCloseOnLaunch={autoCloseOnLaunch}
              onToggle={() => {
                const next = !autoCloseOnLaunch
                setAutoCloseOnLaunch(next)
                setSetting('autoCloseOnLaunch', next)
              }}
            />
          </div>
        )
      case 'appearance':
        return (
          <AppearanceSection
            activeThemeId={activeThemeId}
            customOverrides={customOverrides}
            setTheme={setTheme}
            setOverride={setOverride}
            resetOverrides={handleFullReset}
            hasAnyChanges={hasAnyChanges}
            profiles={profiles}
            activeProfileId={activeProfileId}
            applyProfile={applyProfile}
            deleteProfile={deleteProfile}
            radius={radius}
            setRadius={setRadius}
            scale={scale}
            setScale={setScale}
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
          />
        )
      case 'scan':
        return (
          <div className="space-y-6">
            <ProjectsSection />
            {platform === 'linux' && <EnginesSection />}
          </div>
        )
      case 'tracer':
        return <TracerSection />
      case 'data':
        return <DataSection />
      case 'updates':
        return <UpdatesSection />
      case 'about':
        return (
          <section>
            <div
              className="overflow-hidden"
              style={{
                backgroundColor: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)'
              }}
            >
              <div
                className="px-5 py-4 flex items-center justify-between"
                style={{ borderBottom: '1px solid var(--color-border)' }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    About Unreal Launcher
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    Features, architecture, and changelog
                  </p>
                </div>
                <button
                  onClick={() => setShowAbout(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors"
                  style={{
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'color-mix(in srgb, #22d3ee 10%, transparent)',
                    color: '#22d3ee',
                    border: '1px solid color-mix(in srgb, #22d3ee 20%, transparent)'
                  }}
                >
                  <Info size={12} />
                  View
                </button>
              </div>
              {/* System info */}
              <SystemInfoGrid />
            </div>
          </section>
        )
      default:
        return null
    }
  }

  return (
    <PageWrapper>
      <div className="flex flex-col h-full min-h-0">
        {/* ── Top tab bar ── */}
        <div
          className="shrink-0 px-4 pt-3 pb-0 overflow-hidden"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div className="flex justify-center items-center gap-1 overflow-hidden">
            {visibleNav.map((item) => {
              const active = activeSection === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className="flex flex-1 justify-center items-center gap-2 px-3 py-2 text-xs font-medium cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                  style={{
                    color: active ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                    borderBottom: active ? `2px solid ${item.accent}` : '2px solid transparent',
                    backgroundColor: 'transparent',
                    marginBottom: -1
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.color = 'var(--color-text-secondary)'
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.color = 'var(--color-text-muted)'
                  }}
                >
                  <span
                    className="w-5 h-5 flex items-center justify-center shrink-0"
                    style={{
                      borderRadius: 'calc(var(--radius) * 0.5)',
                      backgroundColor: active
                        ? `color-mix(in srgb, ${item.accent} 18%, transparent)`
                        : 'transparent',
                      color: active ? item.accent : 'var(--color-text-muted)',
                      transition: 'all 120ms ease'
                    }}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="px-6 py-5">{renderSection()}</div>
        </div>
      </div>

      {/* About modal */}
      {showAbout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            className="relative max-w-4xl max-h-[90vh] overflow-hidden"
            style={{
              backgroundColor: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              boxShadow: '0 32px 96px rgba(0,0,0,0.7)'
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                About Unreal Launcher
              </h2>
              <button
                onClick={() => setShowAbout(false)}
                className="flex items-center justify-center w-7 h-7 cursor-pointer transition-colors"
                style={{
                  borderRadius: 'calc(var(--radius) * 0.6)',
                  backgroundColor: 'var(--color-surface-card)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)'
                }}
              >
                <X size={13} />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-56px)]">
              <AboutPage modal />
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}

// ── System info grid (shown in About section) ─────────────────────────────────

function SystemInfoGrid(): React.ReactElement {
  const platform = window.electronAPI.platform
  const [nativeLoaded, setNativeLoaded] = useState<boolean | null>(null)
  const [appVersion, setAppVersion] = useState('')
  const [tracerRunning, setTracerRunning] = useState<boolean | null>(null)
  const [electronVersion] = useState(() => window.electronAPI.electronVersion || '')

  useState(() => {
    window.electronAPI.getNativeStatus().then(setNativeLoaded)
    window.electronAPI.getAppVersion().then(setAppVersion)
    if (platform === 'win32') window.electronAPI.isTracerRunning().then(setTracerRunning)
  })

  const PLATFORM_LABEL: Record<string, string> = {
    win32: 'Windows',
    linux: 'Linux',
    darwin: 'macOS'
  }

  const rows = [
    { label: 'Version', value: appVersion ? `v${appVersion}` : '…', color: 'var(--color-accent)' },
    {
      label: 'Platform',
      value: PLATFORM_LABEL[platform] ?? platform,
      color: 'var(--color-text-secondary)'
    },
    {
      label: 'Electron',
      value: electronVersion ? `v${electronVersion}` : '…',
      color: 'var(--color-text-muted)'
    },
    {
      label: 'Native Module',
      value:
        nativeLoaded === null
          ? '…'
          : nativeLoaded
            ? 'Rust loaded'
            : platform === 'linux'
              ? 'JS fallback'
              : 'Unavailable',
      color:
        nativeLoaded === null ? 'var(--color-text-muted)' : nativeLoaded ? '#60a5fa' : '#f87171'
    },
    ...(platform === 'win32'
      ? [
          {
            label: 'Tracer',
            value: tracerRunning === null ? '…' : tracerRunning ? 'Running' : 'Stopped',
            color: tracerRunning ? '#4ade80' : 'var(--color-text-muted)'
          }
        ]
      : [])
  ]

  return (
    <div className="px-5 py-4">
      <div className="grid grid-cols-2 gap-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between px-3 py-2 rounded"
            style={{
              backgroundColor: 'var(--color-surface-card)',
              border: '1px solid var(--color-border)'
            }}
          >
            <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
              {row.label}
            </span>
            <span className="text-[11px] font-semibold font-mono" style={{ color: row.color }}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SettingsPage

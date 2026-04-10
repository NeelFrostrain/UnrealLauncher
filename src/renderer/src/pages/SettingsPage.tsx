import { useState, useRef } from 'react'
import PageWrapper from '../layout/PageWrapper'
import AboutPage from './AboutPage'
import { Info, X } from 'lucide-react'
import { getSetting, setSetting } from '../utils/settings'
import { useTheme } from '../utils/ThemeContext'
import { loadPersistedRadius } from '../utils/theme'
import { SectionHeader, Card, SettingRow } from '../components/settings/SectionHelpers'
import AppearanceSection from '../components/settings/AppearanceSection'
import LaunchSection from '../components/settings/sections/LaunchSection'
import TracerSection from '../components/settings/sections/TracerSection'
import DataSection from '../components/settings/sections/DataSection'
import UpdatesSection from '../components/settings/sections/UpdatesSection'

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
  const [savingProfile, setSavingProfile] = useState(false)
  const [newProfileName, setNewProfileName] = useState('')
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const nameInputRef = useRef<HTMLInputElement | null>(null)
  const [radius, setRadius] = useState(() => loadPersistedRadius())
  const [showAbout, setShowAbout] = useState(false)

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

  return (
    <PageWrapper>
      <div className="flex-1 overflow-y-auto">
        {/* <div className="flex items-center justify-between px-6 py-4 shrink-0">
          <div>
            <h1 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Settings
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Customize your Unreal Launcher experience
            </p>
          </div>
        </div> */}

        <div className="px-6 py-5 space-y-7">
          <LaunchSection
            autoCloseOnLaunch={autoCloseOnLaunch}
            onToggle={() => {
              const next = !autoCloseOnLaunch
              setAutoCloseOnLaunch(next)
              setSetting('autoCloseOnLaunch', next)
            }}
          />

          <TracerSection />

          <AppearanceSection
            activeThemeId={activeThemeId}
            customOverrides={customOverrides}
            setTheme={setTheme}
            setOverride={setOverride}
            resetOverrides={resetOverrides}
            profiles={profiles}
            activeProfileId={activeProfileId}
            applyProfile={applyProfile}
            deleteProfile={deleteProfile}
            radius={radius}
            setRadius={setRadius}
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

          <DataSection />

          <UpdatesSection />

          {/* ── About ── */}
          <section>
            <SectionHeader
              icon={<Info size={13} className="text-cyan-300" />}
              label="About"
              accent="bg-cyan-500/20"
            />
            <Card>
              <SettingRow
                label="About Unreal Launcher"
                description="View information about the application, features, and changelog"
                last
              >
                <button
                  onClick={() => setShowAbout(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/10 hover:bg-cyan-500/18 text-cyan-400 border border-cyan-500/20 transition-all cursor-pointer"
                >
                  <Info size={12} />
                  View About
                </button>
              </SettingRow>
            </Card>
          </section>
        </div>
      </div>

      {showAbout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-xl border shadow-2xl"
            style={{
              backgroundColor: 'var(--color-surface-elevated)',
              borderColor: 'var(--color-border)',
              borderRadius: 'var(--radius)'
            }}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white/90">About Unreal Launcher</h2>
              <button
                onClick={() => setShowAbout(false)}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
              >
                <X size={16} className="text-white/60" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <AboutPage modal />
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}

export default SettingsPage

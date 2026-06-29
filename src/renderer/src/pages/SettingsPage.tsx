// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useState, useCallback } from 'react'
import PageWrapper from '../layout/PageWrapper'
import type { SectionId } from '../components/settings/SettingsNavigation'
import { NAV_ITEMS } from '../components/settings/SettingsNavigation'
import { AboutSection } from '../components/settings/AboutSection'
import { useSettingsState } from '../hooks/useSettingsState'
import AppearanceSection from '../components/settings/AppearanceSection'
import LaunchSection from '../components/settings/sections/LaunchSection'
import TracerSection from '../components/settings/sections/TracerSection'
import DataSection from '../components/settings/sections/DataSection'
import UpdatesSection from '../components/settings/sections/UpdatesSection'
import ProjectsSection from '../components/settings/sections/ProjectsSection'
import EnginesSection from '../components/settings/sections/EnginesSection'
import ExclusionsSection from '../components/settings/sections/ExclusionsSection'
import { KeyboardShortcutsSection } from '../components/settings/sections/KeyboardShortcutsSection'
import { logActivity } from '../utils/activityLogger'

const SettingsPage = (): React.ReactElement => {
  const [activeSection, setActiveSection] = useState<SectionId>('general')
  const platform = window.electronAPI.platform
  const settingsState = useSettingsState()

  const handleSectionChange = useCallback(
    (section: SectionId): void => {
      logActivity('Settings section switched', { from: activeSection, to: section })
      setActiveSection(section)
    },
    [activeSection]
  )

  const visibleNav = NAV_ITEMS.filter((item) => {
    if (item.id === 'tracer' && platform === 'linux') return false
    return true
  })

  const renderContent = (): React.ReactNode => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="w-full">
            <LaunchSection
              autoCloseOnLaunch={settingsState.autoCloseOnLaunch}
              onToggle={() => settingsState.handleAutoCloseToggle(!settingsState.autoCloseOnLaunch)}
              backgroundCloseOnClose={settingsState.backgroundCloseOnClose}
              onToggleBackgroundClose={() =>
                settingsState.handleBackgroundCloseToggle(!settingsState.backgroundCloseOnClose)
              }
            />
          </div>
        )
      case 'appearance':
        return (
          <AppearanceSection
            activeThemeId={settingsState.activeThemeId}
            customOverrides={settingsState.customOverrides}
            setTheme={settingsState.setTheme}
            setOverride={settingsState.setOverride}
            resetOverrides={settingsState.resetOverrides}
            hasAnyChanges={settingsState.hasAnyChanges}
            profiles={settingsState.profiles}
            activeProfileId={settingsState.activeProfileId}
            applyProfile={settingsState.applyProfile}
            deleteProfile={settingsState.deleteProfile}
            radius={settingsState.radius}
            setRadius={settingsState.setRadius}
            scale={settingsState.scale}
            setScale={settingsState.setScale}
            savingProfile={settingsState.savingProfile}
            setSavingProfile={settingsState.setSavingProfile}
            newProfileName={settingsState.newProfileName}
            setNewProfileName={settingsState.setNewProfileName}
            editingProfileId={settingsState.editingProfileId}
            editingName={settingsState.editingName}
            setEditingName={settingsState.setEditingName}
            nameInputRef={settingsState.nameInputRef}
            handleSaveProfile={settingsState.handleSaveProfile}
            handleStartEdit={settingsState.handleStartEdit}
            handleFinishEdit={settingsState.handleFinishEdit}
          />
        )
      case 'scan':
        return (
          <div className="space-y-6">
            <ProjectsSection />
            {platform === 'linux' && <EnginesSection />}
            <ExclusionsSection />
          </div>
        )
      case 'tracer':
        return <TracerSection />
      case 'data':
        return <DataSection />
      case 'updates':
        return <UpdatesSection />
      case 'shortcuts':
        return <KeyboardShortcutsSection />
      case 'about':
        return <AboutSection />
      default:
        return null
    }
  }

  return (
    <PageWrapper>
      <div className="flex h-full min-h-0 overflow-hidden">
        {/* Vertical sidebar nav */}
        <aside
          className="flex flex-col gap-0.5 p-2 shrink-0 overflow-y-auto border-r"
          style={{
            width: 160,
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)'
          }}
        >
          {visibleNav.map((item) => {
            const active = activeSection === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleSectionChange(item.id)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-left w-full transition-all cursor-pointer"
                style={{
                  color: active ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                  backgroundColor: active
                    ? 'color-mix(in srgb, var(--color-accent) 15%, var(--color-surface-elevated))'
                    : 'transparent',
                  boxShadow: active ? '0 1px 3px rgba(0,0,0,0.25)' : 'none'
                }}
              >
                <span
                  className="shrink-0 transition-colors"
                  style={{ color: active ? item.accent : 'var(--color-text-muted)' }}
                >
                  {item.icon}
                </span>
                {item.label}
                {active && (
                  <span
                    className="ml-auto w-1 h-1 rounded-full shrink-0"
                    style={{ backgroundColor: item.accent }}
                  />
                )}
              </button>
            )
          })}
        </aside>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-5">{renderContent()}</div>
        </div>
      </div>
    </PageWrapper>
  )
}

export default SettingsPage

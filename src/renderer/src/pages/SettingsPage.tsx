// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useState, useCallback } from 'react'
import PageWrapper from '../layout/PageWrapper'
import type { SectionId } from '../components/settings/SettingsNavigation'
import { SettingsNavigation } from '../components/settings/SettingsNavigation'
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
            <EnginesSection />
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
      <SettingsNavigation
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        platform={platform}
      />

      {/* Content area */}
      <div className="flex-1 overflow-y-auto min-h-0 mt-1">
        <div className="mt-2">{renderContent()}</div>
      </div>
    </PageWrapper>
  )
}

export default SettingsPage


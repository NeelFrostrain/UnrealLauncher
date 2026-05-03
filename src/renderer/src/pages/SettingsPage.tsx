// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useState } from 'react'
import PageWrapper from '../layout/PageWrapper'
import { SettingsNavigation, type SectionId } from '../components/settings/SettingsNavigation'
import { AboutSection } from '../components/settings/AboutSection'
import { useSettingsState } from '../hooks/useSettingsState'
import { useTheme } from '../utils/ThemeContext'
import AppearanceSection from '../components/settings/AppearanceSection'
import LaunchSection from '../components/settings/sections/LaunchSection'
import TracerSection from '../components/settings/sections/TracerSection'
import DataSection from '../components/settings/sections/DataSection'
import UpdatesSection from '../components/settings/sections/UpdatesSection'
import ProjectsSection from '../components/settings/sections/ProjectsSection'
import EnginesSection from '../components/settings/sections/EnginesSection'

const SettingsPage = (): React.ReactElement => {
  const [activeSection, setActiveSection] = useState<SectionId>('general')
  const platform = window.electronAPI.platform

  const settingsState = useSettingsState()

  const renderSection = (): React.ReactNode => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-6">
            <LaunchSection
              autoCloseOnLaunch={settingsState.autoCloseOnLaunch}
              onToggle={settingsState.handleAutoCloseToggle}
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
          </div>
        )
      case 'tracer':
        return <TracerSection />
      case 'data':
        return <DataSection />
      case 'updates':
        return <UpdatesSection />
      case 'about':
        return <AboutSection />
      default:
        return null
    }
  }

  return (
    <PageWrapper>
      <div className="flex flex-col h-full min-h-0">
        <SettingsNavigation
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          platform={platform}
        />

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="py-5">{renderSection()}</div>
        </div>
      </div>
    </PageWrapper>
  )
}

export default SettingsPage

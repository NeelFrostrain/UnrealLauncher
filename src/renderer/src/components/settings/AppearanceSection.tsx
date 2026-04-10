import { type RefObject } from 'react'
import { Check } from 'lucide-react'
import { type ThemeToken } from '../../utils/theme'
import { Card, SectionHeader } from './SectionHelpers'
import SavedProfilesSection from './SavedProfilesSection'
import ThemePresets from './appearance/ThemePresets'
import FontControls from './appearance/FontControls'
import RadiusControl from './appearance/RadiusControl'
import ColorOverrides from './appearance/ColorOverrides'

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
        <ThemePresets
          activeThemeId={activeThemeId}
          hasOverrides={hasOverrides}
          setTheme={setTheme}
        />
        <FontControls
          activeThemeId={activeThemeId}
          customOverrides={customOverrides}
          setOverride={setOverride}
        />
        <RadiusControl radius={radius} setRadius={setRadius} />
        <ColorOverrides
          activeThemeId={activeThemeId}
          customOverrides={customOverrides}
          hasOverrides={hasOverrides}
          setOverride={setOverride}
          resetOverrides={resetOverrides}
        />
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

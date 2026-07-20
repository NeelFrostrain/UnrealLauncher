// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { type RefObject } from 'react'
import { type ThemeToken } from '../../utils/theme'
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
  hasAnyChanges: boolean
  profiles: Array<{ id: string; name: string; tokens: Record<ThemeToken, string> }>
  activeProfileId: string | null
  applyProfile: (id: string) => void
  deleteProfile: (id: string) => void
  radius: number
  setRadius: (value: number) => void
  scale: number
  setScale: (value: number) => void
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

const Group = ({
  title,
  children
}: {
  title: string
  children: React.ReactNode
}): React.ReactElement => (
  <div
    className="overflow-hidden transition-all duration-300"
    style={{
      background: 'linear-gradient(180deg, var(--color-surface-elevated) 0%, var(--color-surface) 100%)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
    }}
  >
    <div className="px-5 py-3.5 select-none" style={{ borderBottom: '1px solid var(--color-border)' }}>
      <p
        className="text-[10px] font-bold uppercase tracking-widest"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {title}
      </p>
    </div>
    {children}
  </div>
)

// ── Main section ──────────────────────────────────────────────────────────────

const AppearanceSection = ({
  activeThemeId,
  customOverrides,
  setTheme,
  setOverride,
  resetOverrides,
  hasAnyChanges,
  profiles,
  activeProfileId,
  applyProfile,
  deleteProfile,
  radius,
  setRadius,
  scale,
  setScale,
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
    <div className="space-y-4">
      {/* ── Theme ── */}
      <Group title="Theme">
        <ThemePresets
          activeThemeId={activeThemeId}
          hasOverrides={hasOverrides}
          setTheme={setTheme}
        />
      </Group>

      {/* ── Colors ── */}
      <Group title="Colors">
        <ColorOverrides
          activeThemeId={activeThemeId}
          customOverrides={customOverrides}
          hasAnyChanges={hasAnyChanges}
          setOverride={setOverride}
          resetOverrides={resetOverrides}
        />
      </Group>

      {/* ── Typography ── */}
      <Group title="Typography">
        <FontControls
          activeThemeId={activeThemeId}
          customOverrides={customOverrides}
          setOverride={setOverride}
        />
      </Group>

      {/* ── Layout ── */}
      <Group title="Layout">
        <RadiusControl radius={radius} setRadius={setRadius} scale={scale} setScale={setScale} />
      </Group>

      {/* ── Profiles ── */}
      <Group title="Saved Profiles">
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
      </Group>
    </div>
  )
}

export default AppearanceSection

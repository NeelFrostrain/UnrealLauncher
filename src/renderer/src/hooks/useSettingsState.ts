// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useCallback, useRef, useState } from 'react'
import { getSetting, setSetting } from '../utils/settings'
import {
  loadPersistedRadius,
  applyRadius,
  persistRadius,
  applyScale,
  persistScale,
  loadPersistedScale
} from '../utils/theme'
import { useTheme } from '../utils/ThemeContext'

/**
 * Hook to manage all settings page state
 * Handles theme, appearance, profiles, and general settings
 */
export function useSettingsState() {
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

  // General settings
  const [autoCloseOnLaunch, setAutoCloseOnLaunch] = useState(() =>
    getSetting('autoCloseOnLaunch')
  )

  // Appearance settings
  const [radius, setRadius] = useState(() => loadPersistedRadius())
  const [scale, setScale] = useState(() => loadPersistedScale())

  // Profile management
  const [savingProfile, setSavingProfile] = useState(false)
  const [newProfileName, setNewProfileName] = useState('')
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const nameInputRef = useRef<HTMLInputElement | null>(null)

  // Computed state
  const hasAnyChanges =
    Object.keys(customOverrides).length > 0 || radius !== 8 || Math.abs(scale - 1.0) > 0.01

  // Handlers
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

  const handleAutoCloseToggle = useCallback((value: boolean): void => {
    setAutoCloseOnLaunch(value)
    setSetting('autoCloseOnLaunch', value)
  }, [])

  return {
    // Theme
    activeThemeId,
    customOverrides,
    setTheme,
    setOverride,
    resetOverrides: handleFullReset,
    hasAnyChanges,

    // Profiles
    profiles,
    activeProfileId,
    applyProfile,
    deleteProfile,
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
    handleFinishEdit,

    // Appearance
    radius,
    setRadius,
    scale,
    setScale,

    // General
    autoCloseOnLaunch,
    handleAutoCloseToggle
  }
}

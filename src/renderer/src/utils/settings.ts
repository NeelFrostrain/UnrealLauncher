// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
export interface AppSettings {
  autoCloseOnLaunch: boolean
  tracerAutoStart: boolean
  logMaxLines: number
  animationsEnabled: boolean
  showTitlebarButtons: boolean
}

const SETTINGS_KEY = 'unrealLauncherSettings'

const defaultSettings: AppSettings = {
  autoCloseOnLaunch: false,
  tracerAutoStart: false,
  logMaxLines: 2000,
  animationsEnabled: true,
  showTitlebarButtons: true
}

// In-memory cache — avoids re-parsing localStorage on every getSetting call
let cache: AppSettings | null = null

export const loadSettings = (): AppSettings => {
  if (cache !== null) return cache
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) {
      cache = { ...defaultSettings, ...JSON.parse(stored) }
      return cache!
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
  cache = { ...defaultSettings }
  return cache
}

export const saveSettings = (settings: Partial<AppSettings>): void => {
  try {
    const updated = { ...loadSettings(), ...settings }
    cache = updated
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to save settings:', error)
  }
}

export const getSetting = <K extends keyof AppSettings>(key: K): AppSettings[K] => {
  return loadSettings()[key]
}

export const setSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]): void => {
  saveSettings({ [key]: value })
  // Notify same-window listeners
  window.dispatchEvent(new CustomEvent('app-settings-changed', { detail: { key, value } }))
}

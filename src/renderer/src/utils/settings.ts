// Copyright (c) 2026 NeelFrostrain. All rights reserved.
export interface AppSettings {
  autoCloseOnLaunch: boolean
  tracerAutoStart: boolean
  logMaxLines: number
  animationsEnabled: boolean
  showTitlebarButtons: boolean
  launchPauseDuration: number
}

const SETTINGS_KEY = 'unrealLauncherSettings'

const defaultSettings: AppSettings = {
  autoCloseOnLaunch: false,
  tracerAutoStart: false,
  logMaxLines: 2000,
  animationsEnabled: true,
  showTitlebarButtons: true,
  launchPauseDuration: 5
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

export function checkLaunchCooldown(): { allowed: boolean; remaining: number } {
  const duration = getSetting('launchPauseDuration') || 0
  if (duration <= 0) return { allowed: true, remaining: 0 }

  const lastLaunchStr = localStorage.getItem('lastProjectLaunchTime')
  if (!lastLaunchStr) return { allowed: true, remaining: 0 }

  const lastLaunch = parseInt(lastLaunchStr, 10)
  const elapsed = (Date.now() - lastLaunch) / 1000
  if (elapsed < duration) {
    return { allowed: false, remaining: Math.ceil(duration - elapsed) }
  }

  return { allowed: true, remaining: 0 }
}

export function recordProjectLaunch(): void {
  localStorage.setItem('lastProjectLaunchTime', String(Date.now()))
}

export function clearLaunchCooldown(): void {
  localStorage.removeItem('lastProjectLaunchTime')
}

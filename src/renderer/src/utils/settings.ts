// Settings management utilities
export interface AppSettings {
  autoCloseOnLaunch: boolean
}

const SETTINGS_KEY = 'unrealLauncherSettings'

const defaultSettings: AppSettings = {
  autoCloseOnLaunch: false
}

export const loadSettings = (): AppSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return { ...defaultSettings, ...parsed }
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
  return defaultSettings
}

export const saveSettings = (settings: Partial<AppSettings>): void => {
  try {
    const current = loadSettings()
    const updated = { ...current, ...settings }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to save settings:', error)
  }
}

export const getSetting = <K extends keyof AppSettings>(key: K): AppSettings[K] => {
  const settings = loadSettings()
  return settings[key]
}

export const setSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]): void => {
  saveSettings({ [key]: value })
}

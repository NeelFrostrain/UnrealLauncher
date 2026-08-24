// Copyright (c) 2026 NeelFrostrain. All rights reserved.
/**
 * Custom theme profile management.
 */

import { BUILT_IN_THEMES, type ThemeTokenMap } from './themeTokens'

export interface CustomProfile {
  id: string // uuid-like, prefixed with 'custom-'
  name: string
  tokens: ThemeTokenMap
}

const PROFILES_KEY = 'unrealLauncherThemeProfiles'
const ACTIVE_PROFILE_KEY = 'unrealLauncherActiveProfile'

export function loadCustomProfiles(): CustomProfile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY)
    if (raw) return JSON.parse(raw) as CustomProfile[]
  } catch {
    /* ignore */
  }
  return []
}

export function saveCustomProfiles(profiles: CustomProfile[]): void {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles))
  } catch {
    /* ignore */
  }
}

export function loadActiveProfileId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_PROFILE_KEY)
  } catch {
    return null
  }
}

export function saveActiveProfileId(id: string | null): void {
  try {
    if (id) localStorage.setItem(ACTIVE_PROFILE_KEY, id)
    else localStorage.removeItem(ACTIVE_PROFILE_KEY)
  } catch {
    /* ignore */
  }
}

export function createProfile(name: string, tokens: ThemeTokenMap): CustomProfile {
  return { id: `custom-${Date.now()}`, name, tokens }
}

/** Resolve the full token map for any id — built-in or custom profile. */
export function resolveTokens(id: string, profiles: CustomProfile[]): ThemeTokenMap {
  const builtin = BUILT_IN_THEMES.find((t) => t.id === id)
  if (builtin) return builtin.tokens
  const profile = profiles.find((p) => p.id === id)
  if (profile) return profile.tokens
  return BUILT_IN_THEMES[0].tokens
}

// Copyright (c) 2026 NeelFrostrain. All rights reserved.
/**
 * Palette window entry point — minimal React tree, no router/layout/sidebar.
 *
 * Theme tokens, radius, and scale are applied SYNCHRONOUSLY before React mounts
 * so the first painted frame already has the correct colours (no black flash).
 */

// ── 1. Apply theme tokens synchronously ──────────────────────────────────────
import {
  loadPersistedTheme,
  loadPersistedRadius,
  loadCustomProfiles,
  loadActiveProfileId,
  getTheme,
  applyTheme,
  applyRadius
} from './utils/theme'

;((): void => {
  const { id, overrides } = loadPersistedTheme()
  const activeProfileId = loadActiveProfileId()

  if (activeProfileId) {
    const profiles = loadCustomProfiles()
    const profile = profiles.find((p) => p.id === activeProfileId)
    if (profile) {
      applyTheme(profile.tokens)
    } else {
      const base = getTheme(id)
      applyTheme(base.tokens, overrides)
    }
  } else {
    const base = getTheme(id)
    applyTheme(base.tokens, overrides)
  }

  applyRadius(loadPersistedRadius())
  // Scale only affects the main app root element; skip for the palette window
})()

// ── 2. Boot React ─────────────────────────────────────────────────────────────
import './assets/main.css'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from './utils/ThemeContext'
import { AnimationProvider } from './utils/AnimationContext'
import { PaletteWindow } from './components/ui/PaletteWindow'

createRoot(document.getElementById('palette-root')!).render(
  <ThemeProvider>
    <AnimationProvider>
      <PaletteWindow />
    </AnimationProvider>
  </ThemeProvider>
)

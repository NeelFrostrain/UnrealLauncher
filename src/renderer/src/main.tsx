// Apply theme, font, radius, and scale synchronously before first render to prevent layout shift & font pop
import {
  loadPersistedTheme,
  getTheme,
  applyTheme,
  loadCustomProfiles,
  loadActiveProfileId,
  loadPersistedRadius,
  applyRadius,
  loadPersistedScale,
  applyScale
} from './utils/theme'
import { loadSettings } from './utils/settings'

try {
  const savedProfileId = loadActiveProfileId()
  const allProfiles = loadCustomProfiles()
  if (savedProfileId) {
    const profile = allProfiles.find((p) => p.id === savedProfileId)
    if (profile) {
      applyTheme(profile.tokens)
    }
  } else {
    const persisted = loadPersistedTheme()
    const base = getTheme(persisted.id)
    applyTheme(base.tokens, persisted.overrides)
  }
} catch (err) {
  console.warn('Initial theme application fallback:', err)
}

applyRadius(loadPersistedRadius())
applyScale(loadPersistedScale())

// Apply no-animations class synchronously so first frame respects user preference
if (!loadSettings().animationsEnabled) {
  document.body.classList.add('no-animations')
}

import './assets/main.css'
import { createRoot } from 'react-dom/client'
import { HashRouter as Router } from 'react-router-dom'
import LayoutWrapper from './layout'
import App from './App'
import { ToastProvider } from './components/ui/ToastContext'
import ErrorBoundary from './components/ui/ErrorBoundary'
import { ThemeProvider } from './utils/ThemeContext'
import { AnimationProvider } from './utils/AnimationContext'
import { installActivityLogger } from './utils/activityLogger'

installActivityLogger()

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <Router>
      <ToastProvider>
        <AnimationProvider>
          <LayoutWrapper>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </LayoutWrapper>
        </AnimationProvider>
      </ToastProvider>
    </Router>
  </ThemeProvider>
)

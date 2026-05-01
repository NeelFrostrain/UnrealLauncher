// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

const EnginesPage = lazy(() => import('./pages/EnginesPage'))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

const PageLoader = (): React.ReactNode => (
  <div className="flex items-center justify-center h-full">
    <div
      className="w-5 h-5 rounded-full border-2 animate-spin"
      style={{
        borderColor: 'color-mix(in srgb, var(--color-accent) 25%, transparent)',
        borderTopColor: 'var(--color-accent)'
      }}
    />
  </div>
)

// ── Resolve the last visited full path (page + tab) from localStorage ─────────
function getInitialPath(): string {
  const saved = localStorage.getItem('lastVisitedPath')
  const valid = ['/engines', '/engines/plugins', '/engines/fab', '/projects', '/projects/recent', '/projects/favorites', '/settings']
  if (saved && valid.includes(saved)) return saved
  return '/engines'
}

const initialPath = getInitialPath()

const App = (): React.ReactNode => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/engines" element={<EnginesPage />} />
        <Route path="/engines/:tab" element={<EnginesPage />} />
        <Route path="/projects/*" element={<ProjectsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/" element={<Navigate to={initialPath} replace />} />
        <Route path="*" element={<Navigate to={initialPath} replace />} />
      </Routes>
    </Suspense>
  )
}

export default App

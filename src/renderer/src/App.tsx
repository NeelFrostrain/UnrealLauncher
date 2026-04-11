import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

const EnginesPage = lazy(() => import('./pages/EnginesPage'))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

const PageLoader = (): React.ReactNode => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <p className="text-white/70">Loading...</p>
    </div>
  </div>
)

const App = (): React.ReactNode => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/engines" element={<EnginesPage />} />
        <Route path="/projects/*" element={<ProjectsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/" element={<Navigate to="/engines" replace />} />
        <Route path="*" element={<Navigate to="/engines" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App

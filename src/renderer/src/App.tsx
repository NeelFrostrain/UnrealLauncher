import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// Lazy load pages for better performance
const EnginesPage = lazy(() => import('./pages/EnginesPage'))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))

// Loading component
const PageLoader = (): React.ReactNode => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      {/* <div classNa me="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"></div> */}
      <p className="text-white/70">Loading...</p>
    </div>
  </div>
)

const App = (): React.ReactNode => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/engines" element={<EnginesPage />} />
        <Route path="/projects/*" element={<ProjectsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App

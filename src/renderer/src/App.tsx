import { lazy, Suspense } from 'react'
import usePagesStore from './store/usePagesStore'

// Lazy load pages for better performance
const AboutPage = lazy(() => import('./pages/AboutPage'))
const EnginesPage = lazy(() => import('./pages/EnginesPage'))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

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
  const { currentPage } = usePagesStore()

  return (
    <Suspense fallback={<PageLoader />}>
      {currentPage === 'Engines' && <EnginesPage />}
      {currentPage === 'Projects' && <ProjectsPage />}
      {currentPage === 'Settings' && <SettingsPage />}
      {currentPage === 'About' && <AboutPage />}
      {!['Engines', 'Projects', 'Settings', 'About'].includes(currentPage) && (
        <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-900 to-slate-800">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Restart App</h1>
            <p className="text-white/70">Please restart the application</p>
          </div>
        </div>
      )}
    </Suspense>
  )
}

export default App

import AboutPage from './pages/AboutPage'
import EnginesPage from './pages/EnginesPage'
import ProjectsPage from './pages/ProjectsPage'
import usePagesStore from './store/usePagesStore'

const App = () => {
  const { currentPage } = usePagesStore()

  if (currentPage === 'Engines') return <EnginesPage />
  if (currentPage === 'Projects') return <ProjectsPage />
  if (currentPage === 'About') return <AboutPage />
  return <div className="uppercase">Restart App</div>
}

export default App

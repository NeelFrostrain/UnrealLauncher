import './assets/main.css'

import { createRoot } from 'react-dom/client'
import { HashRouter as Router } from 'react-router-dom'
import LayoutWrapper from './layout'
import App from './App'
import { ToastProvider } from './components/ui/ToastContext'
import ErrorBoundary from './components/ui/ErrorBoundary'
import { ThemeProvider } from './utils/ThemeContext'

import { AnimationProvider } from './utils/AnimationContext'

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

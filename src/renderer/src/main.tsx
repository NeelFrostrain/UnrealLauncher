// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
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

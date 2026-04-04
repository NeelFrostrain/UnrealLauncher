import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import LayoutWrapper from './layout'
import App from './App'
import { ToastProvider } from './components/ToastContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <LayoutWrapper>
        <App />
      </LayoutWrapper>
    </ToastProvider>
  </StrictMode>
)

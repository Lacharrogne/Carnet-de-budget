import './lib/installPrompt'
import './lib/errorReporting'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'

import App from './App'
import AuthGate from './components/auth/AuthGate'
import TrialGate from './components/auth/TrialGate'
import { AuthProvider } from './context/AuthContext'
import { BudgetProvider } from './context/BudgetContext'
import { SelectedMonthProvider } from './context/SelectedMonthContext'
import { HolderFilterProvider } from './context/HolderFilterContext'
import { TourProvider } from './context/TourContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AuthGate>
          <TrialGate>
            <BudgetProvider>
              <SelectedMonthProvider>
                <HolderFilterProvider>
                  <TourProvider>
                    <App />
                  </TourProvider>
                </HolderFilterProvider>
              </SelectedMonthProvider>
            </BudgetProvider>
          </TrialGate>
        </AuthGate>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

// PWA : enregistrement du service worker (uniquement en production).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Échec de l’enregistrement du service worker :', error)
    })
  })
}
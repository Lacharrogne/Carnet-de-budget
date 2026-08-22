import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'

import App from './App'
import AuthGate from './components/auth/AuthGate'
import { AuthProvider } from './context/AuthContext'
import { BudgetProvider } from './context/BudgetContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AuthGate>
          <BudgetProvider>
            <App />
          </BudgetProvider>
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
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
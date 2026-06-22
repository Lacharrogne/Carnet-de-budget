import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'

import AppLayout from './components/layout/AppLayout'
import ScrollToTop from './components/layout/ScrollToTop'
import ModalAutoClose from './components/layout/ModalAutoClose'

// Chargement à la demande : chaque page est découpée dans son propre bundle,
// pour un premier affichage plus rapide.
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const AccountsPage = lazy(() => import('./pages/AccountsPage'))
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'))
const BudgetsPage = lazy(() => import('./pages/BudgetsPage'))
const RecurringPaymentsPage = lazy(
  () => import('./pages/RecurringPaymentsPage'),
)
const DebtsPage = lazy(() => import('./pages/DebtsPage'))
const NetWorthPage = lazy(() => import('./pages/NetWorthPage'))
const InvestmentsPage = lazy(() => import('./pages/InvestmentsPage'))
const GoalsPage = lazy(() => import('./pages/GoalsPage'))
const CalendarPage = lazy(() => import('./pages/CalendarPage'))
const StatsPage = lazy(() => import('./pages/StatsPage'))

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-stone-200 border-t-emerald-700"
        role="status"
        aria-label="Chargement de la page"
      />
    </div>
  )
}

export default function App() {
  return (
    <>
      <ModalAutoClose />
      <ScrollToTop />

      <AppLayout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/comptes" element={<AccountsPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/abonnements" element={<RecurringPaymentsPage />} />
            <Route path="/recurrents" element={<RecurringPaymentsPage />} />
            <Route path="/dettes" element={<DebtsPage />} />
            <Route path="/patrimoine" element={<NetWorthPage />} />
            <Route path="/investissements" element={<InvestmentsPage />} />
            <Route path="/objectifs" element={<GoalsPage />} />
            <Route path="/calendrier" element={<CalendarPage />} />
            <Route path="/statistiques" element={<StatsPage />} />
            <Route path="/stats" element={<StatsPage />} />
          </Routes>
        </Suspense>
      </AppLayout>
    </>
  )
}

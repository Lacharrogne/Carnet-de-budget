import { Navigate, Route, Routes } from 'react-router'

import AppLayout from './components/layout/AppLayout'
import AccountsPage from './pages/AccountsPage'
import BudgetsPage from './pages/BudgetsPage'
import CalendarPage from './pages/CalendarPage'
import DashboardPage from './pages/DashboardPage'
import DebtsPage from './pages/DebtsPage'
import GoalsPage from './pages/GoalsPage'
import InvestmentsPage from './pages/InvestmentsPage'
import NetWorthPage from './pages/NetWorthPage'
import RecurringPaymentsPage from './pages/RecurringPaymentsPage'
import StatsPage from './pages/StatsPage'
import TransactionsPage from './pages/TransactionsPage'

export default function App() {
  return (
    <AppLayout>
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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  )
}
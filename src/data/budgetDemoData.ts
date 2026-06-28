import { getCurrentMonthKey } from '../services/budgetStatsService'
import type {
  Account,
  MonthlyBudget,
  RecurringPayment,
  SavingGoal,
  SinkingFund,
  Transaction,
} from '../types/budget'

const currentMonth = getCurrentMonthKey()

function dateInCurrentMonth(day: number) {
  const [year, month] = currentMonth.split('-').map(Number)
  const lastDayOfMonth = new Date(year, month, 0).getDate()
  const safeDay = Math.min(day, lastDayOfMonth)

  return `${year}-${String(month).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`
}

export const accounts: Account[] = [
  {
    id: 'account-current',
    name: 'Compte courant',
    type: 'current',
    balance: 2450,
    emoji: '🏦',
    colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-100',
    holder: 'Commun',
  },
  {
    id: 'account-savings',
    name: 'Livret épargne',
    type: 'savings',
    balance: 3850,
    emoji: '🐷',
    colorClass: 'bg-teal-50 text-teal-800 border-teal-100',
    holder: 'Maxime',
  },
  {
    id: 'account-cash',
    name: 'Espèces',
    type: 'cash',
    balance: 85,
    emoji: '💶',
    colorClass: 'bg-amber-50 text-amber-800 border-amber-100',
    holder: 'Chloé',
  },
]

export const transactions: Transaction[] = [
  {
    id: 'transaction-1',
    title: 'Salaire',
    amount: 1850,
    type: 'income',
    category: 'salary',
    accountId: 'account-current',
    date: dateInCurrentMonth(1),
    isRecurring: true,
  },
  {
    id: 'transaction-2',
    title: 'Loyer',
    amount: 620,
    type: 'expense',
    category: 'housing',
    accountId: 'account-current',
    date: dateInCurrentMonth(3),
    isRecurring: true,
  },
  {
    id: 'transaction-3',
    title: 'Courses Carrefour',
    amount: 86,
    type: 'expense',
    category: 'groceries',
    accountId: 'account-current',
    date: dateInCurrentMonth(5),
  },
  {
    id: 'transaction-4',
    title: 'Abonnement téléphone',
    amount: 19,
    type: 'expense',
    category: 'subscriptions',
    accountId: 'account-current',
    date: dateInCurrentMonth(7),
    isRecurring: true,
  },
  {
    id: 'transaction-5',
    title: 'Netflix',
    amount: 14,
    type: 'expense',
    category: 'subscriptions',
    accountId: 'account-current',
    date: dateInCurrentMonth(8),
    isRecurring: true,
  },
  {
    id: 'transaction-6',
    title: 'Restaurant',
    amount: 42,
    type: 'expense',
    category: 'restaurant',
    accountId: 'account-current',
    date: dateInCurrentMonth(11),
  },
  {
    id: 'transaction-7',
    title: 'Essence',
    amount: 65,
    type: 'expense',
    category: 'transport',
    accountId: 'account-current',
    date: dateInCurrentMonth(13),
  },
  {
    id: 'transaction-8',
    title: 'Pharmacie',
    amount: 18,
    type: 'expense',
    category: 'health',
    accountId: 'account-current',
    date: dateInCurrentMonth(15),
  },
  {
    id: 'transaction-9',
    title: 'Shopping',
    amount: 74,
    type: 'expense',
    category: 'shopping',
    accountId: 'account-current',
    date: dateInCurrentMonth(17),
  },
  {
    id: 'transaction-10',
    title: 'Virement épargne',
    amount: 150,
    type: 'expense',
    category: 'savings',
    accountId: 'account-current',
    date: dateInCurrentMonth(20),
    note: 'Mise de côté mensuelle',
  },
]

export const monthlyBudgets: MonthlyBudget[] = [
  {
    id: 'budget-groceries',
    category: 'groceries',
    limit: 300,
    month: currentMonth,
  },
  {
    id: 'budget-housing',
    category: 'housing',
    limit: 700,
    month: currentMonth,
  },
  {
    id: 'budget-transport',
    category: 'transport',
    limit: 160,
    month: currentMonth,
  },
  {
    id: 'budget-leisure',
    category: 'leisure',
    limit: 120,
    month: currentMonth,
  },
  {
    id: 'budget-subscriptions',
    category: 'subscriptions',
    limit: 80,
    month: currentMonth,
  },
  {
    id: 'budget-restaurant',
    category: 'restaurant',
    limit: 100,
    month: currentMonth,
  },
  {
    id: 'budget-shopping',
    category: 'shopping',
    limit: 150,
    month: currentMonth,
  },
  {
    id: 'budget-health',
    category: 'health',
    limit: 80,
    month: currentMonth,
  },
  {
    id: 'budget-savings',
    category: 'savings',
    limit: 200,
    month: currentMonth,
  },
]

export const savingGoals: SavingGoal[] = [
  {
    id: 'goal-1',
    title: 'Fonds de sécurité',
    targetAmount: 1000,
    currentAmount: 650,
    emoji: '🛡️',
  },
  {
    id: 'goal-2',
    title: 'Vacances',
    targetAmount: 800,
    currentAmount: 320,
    deadline: '2026-08-01',
    emoji: '🌴',
  },
  {
    id: 'goal-3',
    title: 'Nouveau matériel',
    targetAmount: 1500,
    currentAmount: 450,
    emoji: '💻',
  },
]

export const recurringPayments: RecurringPayment[] = [
  {
    id: 'recurring-1',
    title: 'Loyer',
    amount: 620,
    category: 'housing',
    accountId: 'account-current',
    dayOfMonth: 3,
    isActive: true,
    type: 'expense',
  },
  {
    id: 'recurring-2',
    title: 'Téléphone',
    amount: 19,
    category: 'subscriptions',
    accountId: 'account-current',
    dayOfMonth: 7,
    isActive: true,
    type: 'expense',
  },
  {
    id: 'recurring-3',
    title: 'Netflix',
    amount: 14,
    category: 'subscriptions',
    accountId: 'account-current',
    dayOfMonth: 8,
    isActive: true,
    type: 'expense',
  },
  {
    id: 'recurring-4',
    title: 'Salaire',
    amount: 2100,
    category: 'salary',
    accountId: 'account-current',
    dayOfMonth: 1,
    isActive: true,
    type: 'income',
  },
]
export const sinkingFunds: SinkingFund[] = [
  {
    id: 'fund-1',
    title: 'Entretien voiture',
    targetAmount: 600,
    currentAmount: 180,
    monthlyContribution: 50,
    emoji: '🚗',
  },
  {
    id: 'fund-2',
    title: 'Cadeaux de Noël',
    targetAmount: 500,
    currentAmount: 125,
    monthlyContribution: 40,
    emoji: '🎁',
  },
  {
    id: 'fund-3',
    title: 'Vacances d’été',
    targetAmount: 1200,
    currentAmount: 360,
    monthlyContribution: 100,
    emoji: '🌞',
  },
]
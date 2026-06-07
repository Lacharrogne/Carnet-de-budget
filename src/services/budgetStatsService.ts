import { budgetCategories } from '../data/budgetCategories'
import type {
  Account,
  BudgetCategory,
  BudgetCategoryId,
  MonthlyBudget,
  Transaction,
} from '../types/budget'

export type BudgetUsage = {
  category: BudgetCategory
  spent: number
  limit: number
  remaining: number
  percentage: number
  status: 'safe' | 'warning' | 'danger'
}

export function getCurrentMonthKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')

  return `${year}-${month}`
}

export function getMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number)

  return new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1))
}

export function getCategoryById(categoryId: BudgetCategoryId) {
  return (
    budgetCategories.find((category) => category.id === categoryId) ??
    budgetCategories.find((category) => category.id === 'other')!
  )
}

export function getTransactionsForMonth(
  transactions: Transaction[],
  monthKey = getCurrentMonthKey(),
) {
  return transactions.filter((transaction) => transaction.date.startsWith(monthKey))
}

export function getTotalBalance(accounts: Account[]) {
  return accounts.reduce((total, account) => total + account.balance, 0)
}

export function getMonthIncome(
  transactions: Transaction[],
  monthKey = getCurrentMonthKey(),
) {
  return getTransactionsForMonth(transactions, monthKey)
    .filter((transaction) => transaction.type === 'income')
    .reduce((total, transaction) => total + transaction.amount, 0)
}

export function getMonthExpenses(
  transactions: Transaction[],
  monthKey = getCurrentMonthKey(),
) {
  return getTransactionsForMonth(transactions, monthKey)
    .filter((transaction) => transaction.type === 'expense')
    .reduce((total, transaction) => total + transaction.amount, 0)
}

export function getBudgetLimitForMonth(
  budgets: MonthlyBudget[],
  monthKey = getCurrentMonthKey(),
) {
  return budgets
    .filter((budget) => budget.month === monthKey)
    .reduce((total, budget) => total + budget.limit, 0)
}

export function getCurrentMonthSummary(
  accounts: Account[],
  transactions: Transaction[],
  budgets: MonthlyBudget[],
  monthKey = getCurrentMonthKey(),
) {
  const totalBalance = getTotalBalance(accounts)
  const monthIncome = getMonthIncome(transactions, monthKey)
  const monthExpenses = getMonthExpenses(transactions, monthKey)
  const monthBudgetLimit = getBudgetLimitForMonth(budgets, monthKey)

  return {
    totalBalance,
    monthIncome,
    monthExpenses,
    remainingFromIncome: monthIncome - monthExpenses,
    monthBudgetLimit,
    remainingBudget: monthBudgetLimit - monthExpenses,
  }
}

export function getBudgetUsages(
  transactions: Transaction[],
  budgets: MonthlyBudget[],
  monthKey = getCurrentMonthKey(),
): BudgetUsage[] {
  const monthTransactions = getTransactionsForMonth(transactions, monthKey)

  return budgets
    .filter((budget) => budget.month === monthKey)
    .map((budget) => {
      const spent = monthTransactions
        .filter(
          (transaction) =>
            transaction.type === 'expense' &&
            transaction.category === budget.category,
        )
        .reduce((total, transaction) => total + transaction.amount, 0)

      const percentage =
        budget.limit > 0 ? Math.round((spent / budget.limit) * 100) : 0

      let status: BudgetUsage['status'] = 'safe'

      if (percentage >= 100) {
        status = 'danger'
      } else if (percentage >= 75) {
        status = 'warning'
      }

      return {
        category: getCategoryById(budget.category),
        spent,
        limit: budget.limit,
        remaining: budget.limit - spent,
        percentage,
        status,
      }
    })
    .sort((a, b) => b.percentage - a.percentage)
}

export function getRecentTransactions(transactions: Transaction[], limit = 5) {
  return [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit)
}
import { budgetCategories } from '../data/budgetCategories'
import type {
  Account,
  BudgetCategory,
  BudgetCategoryId,
  MonthlyBudget,
  RecurringPayment,
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

/** Renvoie la clé du mois décalé de `delta` mois (ex: -1 = mois précédent). */
export function getAdjacentMonthKey(monthKey: string, delta: number) {
  const [year, month] = monthKey.split('-').map(Number)

  return getCurrentMonthKey(new Date(year, month - 1 + delta, 1))
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

export type ForecastTone = 'serein' | 'juste' | 'risque'

export type EndOfMonthForecast = {
  daysInMonth: number
  daysElapsed: number
  daysRemaining: number
  /** Dépense « du quotidien » moyenne par jour observée ce mois-ci. */
  dailyPace: number
  /** Charges fixes encore à venir d'ici la fin du mois. */
  upcomingRecurring: number
  /** Estimation des dépenses restantes (rythme quotidien + charges fixes). */
  projectedRemainingExpenses: number
  /** Estimation des dépenses totales du mois. */
  projectedExpenses: number
  /** Argent disponible estimé en fin de mois (sans nouvelle rentrée). */
  projectedEndBalance: number
  /** Estimation du résultat du mois (revenus - dépenses projetées). */
  projectedMonthResult: number
  tone: ForecastTone
  label: string
  message: string
}

/**
 * Projette la fin de mois à partir du rythme de dépenses observé et des
 * charges fixes encore à venir. Hypothèse prudente : aucune nouvelle rentrée
 * d'argent n'est supposée d'ici la fin du mois.
 *
 * Le calcul sépare les dépenses « du quotidien » (variables) des charges
 * fixes : le rythme quotidien est estimé sur les seules dépenses non
 * récurrentes, puis on ajoute les charges fixes datées encore à venir.
 */
export function getEndOfMonthForecast({
  transactions,
  recurringPayments,
  liquidBalance,
  monthIncome,
  monthExpenses,
  monthKey = getCurrentMonthKey(),
  today = new Date(),
}: {
  transactions: Transaction[]
  recurringPayments: RecurringPayment[]
  liquidBalance: number
  monthIncome: number
  monthExpenses: number
  monthKey?: string
  today?: Date
}): EndOfMonthForecast | null {
  // La prévision n'a de sens que pour le mois en cours.
  if (getCurrentMonthKey(today) !== monthKey) {
    return null
  }

  const [year, month] = monthKey.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()
  const daysElapsed = Math.min(today.getDate(), daysInMonth)
  const daysRemaining = Math.max(0, daysInMonth - daysElapsed)

  const everydayExpensesSoFar = getTransactionsForMonth(transactions, monthKey)
    .filter(
      (transaction) =>
        transaction.type === 'expense' && !transaction.isRecurring,
    )
    .reduce((total, transaction) => total + transaction.amount, 0)

  const dailyPace = everydayExpensesSoFar / Math.max(daysElapsed, 1)
  const projectedEverydayRest = dailyPace * daysRemaining

  const upcomingRecurring = recurringPayments
    .filter(
      (payment) => payment.isActive && payment.dayOfMonth > daysElapsed,
    )
    .reduce((total, payment) => total + payment.amount, 0)

  const projectedRemainingExpenses = projectedEverydayRest + upcomingRecurring
  const projectedExpenses = monthExpenses + projectedRemainingExpenses
  const projectedEndBalance = liquidBalance - projectedRemainingExpenses
  const projectedMonthResult = monthIncome - projectedExpenses

  let tone: ForecastTone = 'serein'

  if (projectedEndBalance < 0) {
    tone = 'risque'
  } else if (projectedMonthResult < 0) {
    tone = 'juste'
  }

  const tierContent: Record<ForecastTone, { label: string; message: string }> = {
    serein: {
      label: 'Fin de mois sereine',
      message:
        'À ce rythme, vous gardez de la marge jusqu’à la fin du mois. Tout est sous contrôle.',
    },
    juste: {
      label: 'Fin de mois juste',
      message:
        'C’est jouable : en gardant un œil sur les prochaines dépenses, vous passez le cap sans accroc.',
    },
    risque: {
      label: 'Fin de mois à surveiller',
      message:
        'À ce rythme, le mois se terminerait dans le rouge. Pas de panique : quelques ajustements suffisent à inverser la tendance.',
    },
  }

  return {
    daysInMonth,
    daysElapsed,
    daysRemaining,
    dailyPace,
    upcomingRecurring,
    projectedRemainingExpenses,
    projectedExpenses,
    projectedEndBalance,
    projectedMonthResult,
    tone,
    label: tierContent[tone].label,
    message: tierContent[tone].message,
  }
}
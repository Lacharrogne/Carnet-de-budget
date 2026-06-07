export type TransactionType = 'income' | 'expense' | 'transfer'

export type BudgetCategoryId =
  | 'salary'
  | 'groceries'
  | 'housing'
  | 'transport'
  | 'leisure'
  | 'health'
  | 'subscriptions'
  | 'restaurant'
  | 'shopping'
  | 'savings'
  | 'debt'
  | 'investment'
  | 'transfer'
  | 'other'

export type AccountType = 'current' | 'savings' | 'cash' | 'investment'

export type Account = {
  id: string
  name: string
  type: AccountType
  balance: number
  emoji: string
  colorClass: string
}

export type BudgetCategory = {
  id: BudgetCategoryId
  name: string
  emoji: string
  description: string
  colorClass: string
}

export type Transaction = {
  id: string
  title: string
  amount: number
  type: TransactionType

  /**
   * Pour income / expense :
   * compte concerné par la transaction.
   *
   * Pour transfer :
   * compte source, celui d’où l’argent sort.
   */
  accountId: string

  /**
   * Utilisé uniquement pour les virements.
   * C’est le compte destination, celui où l’argent arrive.
   */
  toAccountId?: string

  category: BudgetCategoryId
  date: string
  note?: string
  isRecurring?: boolean

  /**
   * Liens futurs pour rendre les mouvements intelligents :
   * - remboursement de dette depuis un compte réel
   * - alimentation d’objectif depuis un compte réel
   * - alimentation de fonds d’amortissement
   */
  linkedDebtId?: string
  linkedSavingGoalId?: string
  linkedSinkingFundId?: string
}

export type MonthlyBudget = {
  id: string
  category: BudgetCategoryId
  limit: number
  month: string
}

export type SavingGoal = {
  id: string
  title: string
  targetAmount: number
  currentAmount: number
  deadline?: string
  emoji: string
}

export type RecurringPayment = {
  id: string
  title: string
  amount: number
  category: BudgetCategoryId
  accountId: string
  dayOfMonth: number
  isActive: boolean
}

export type SinkingFund = {
  id: string
  title: string
  targetAmount: number
  currentAmount: number
  monthlyContribution: number
  emoji: string
}
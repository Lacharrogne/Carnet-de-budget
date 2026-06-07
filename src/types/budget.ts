export type TransactionType = 'income' | 'expense'

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
  category: BudgetCategoryId
  accountId: string
  date: string
  note?: string
  isRecurring?: boolean
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
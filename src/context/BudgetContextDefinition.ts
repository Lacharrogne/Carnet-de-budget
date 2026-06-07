import { createContext } from 'react'

import type {
  Account,
  BudgetCategoryId,
  MonthlyBudget,
  RecurringPayment,
  SavingGoal,
  SinkingFund,
  Transaction,
} from '../types/budget'
import type { Debt } from '../types/debt'
import type { Investment } from '../types/investment'

export type BudgetContextValue = {
  isBudgetLoading: boolean
  budgetError: string
  clearBudgetError: () => void

  accounts: Account[]
  transactions: Transaction[]
  monthlyBudgets: MonthlyBudget[]
  recurringPayments: RecurringPayment[]
  savingGoals: SavingGoal[]
  sinkingFunds: SinkingFund[]
  debts: Debt[]
  investments: Investment[]

  addAccount: (account: Account) => void
  updateAccount: (account: Account) => void
  updateAccountBalance: (accountId: string, balance: number) => void
  deleteAccount: (accountId: string) => void

  addTransaction: (transaction: Transaction) => void
  updateTransaction: (transaction: Transaction) => void
  deleteTransaction: (transactionId: string) => void

  addMonthlyBudget: (budget: MonthlyBudget) => void
  updateMonthlyBudgetLimit: (
    categoryId: BudgetCategoryId,
    limit: number,
    monthKey?: string,
  ) => void
  resetMonthlyBudgets: () => void

  addRecurringPayment: (payment: RecurringPayment) => void
  updateRecurringPayment: (payment: RecurringPayment) => void
  toggleRecurringPayment: (paymentId: string) => void
  deleteRecurringPayment: (paymentId: string) => void

  addSavingGoal: (goal: SavingGoal) => void
  updateSavingGoal: (goal: SavingGoal) => void
  updateSavingGoalAmount: (goalId: string, amount: number) => void
  deleteSavingGoal: (goalId: string) => void

  addSinkingFund: (fund: SinkingFund) => void
  updateSinkingFund: (fund: SinkingFund) => void
  updateSinkingFundAmount: (fundId: string, amount: number) => void
  deleteSinkingFund: (fundId: string) => void

  addDebt: (debt: Debt) => void
  updateDebt: (debt: Debt) => void
  updateDebtRemainingAmount: (debtId: string, amount: number) => void
  deleteDebt: (debtId: string) => void

  addInvestment: (investment: Investment) => void
  updateInvestment: (investment: Investment) => void
  updateInvestmentCurrentValue: (
    investmentId: string,
    currentValue: number,
  ) => void
  deleteInvestment: (investmentId: string) => void

  resetGoals: () => void
  resetAllDemoData: () => void
}

export const BudgetContext = createContext<BudgetContextValue | null>(null)
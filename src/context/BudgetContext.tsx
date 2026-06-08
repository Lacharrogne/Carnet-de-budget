import { useEffect, useState, type ReactNode } from 'react'

import {
  createAccount,
  editAccount,
  editAccountBalance,
  fetchAccounts,
  removeAccount,
} from '../services/accountsSupabaseService'
import {
  createDebt,
  editDebt,
  fetchDebts,
  removeDebt,
} from '../services/debtsSupabaseService'
import {
  createSavingGoal,
  createSinkingFund,
  editSavingGoal,
  editSinkingFund,
  fetchSavingGoals,
  fetchSinkingFunds,
  removeSavingGoal,
  removeSavingGoalsForUser,
  removeSinkingFund,
  removeSinkingFundsForUser,
} from '../services/goalsSupabaseService'
import {
  createInvestment,
  editInvestment,
  fetchInvestments,
  removeInvestment,
} from '../services/investmentsSupabaseService'
import {
  fetchMonthlyBudgets,
  removeMonthlyBudgetsForUser,
  saveMonthlyBudget,
} from '../services/monthlyBudgetsSupabaseService'
import {
  createRecurringPayment,
  editRecurringPayment,
  fetchRecurringPayments,
  removeRecurringPayment,
} from '../services/recurringPaymentsSupabaseService'
import {
  createTransaction,
  editTransaction,
  fetchTransactions,
  removeTransaction,
} from '../services/transactionsSupabaseService'
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
import {
  BudgetContext,
  type BudgetContextValue,
} from './BudgetContextDefinition'
import { useAuth } from './useAuth'

type BalanceUpdate = {
  accountId: string
  amount: number
}

type DebtRemainingUpdate = {
  debtId: string
  amount: number
}

type SavingGoalAmountUpdate = {
  goalId: string
  amount: number
}

type SinkingFundAmountUpdate = {
  fundId: string
  amount: number
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10)
}

function createTransactionId() {
  return `transaction-${Date.now()}`
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'Une erreur inconnue est survenue.'
}

function clampAmount(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function hydrateTransactionForBalance(
  transaction: Transaction,
  fallbackTransaction: Transaction,
) {
  return {
    ...transaction,
    toAccountId: transaction.toAccountId ?? fallbackTransaction.toAccountId,
    linkedDebtId: transaction.linkedDebtId ?? fallbackTransaction.linkedDebtId,
    linkedSavingGoalId:
      transaction.linkedSavingGoalId ?? fallbackTransaction.linkedSavingGoalId,
    linkedSinkingFundId:
      transaction.linkedSinkingFundId ??
      fallbackTransaction.linkedSinkingFundId,
  }
}

function mergeBalanceUpdates(balanceUpdates: BalanceUpdate[]) {
  const updatesByAccount = new Map<string, number>()

  balanceUpdates.forEach((update) => {
    const previousAmount = updatesByAccount.get(update.accountId) ?? 0
    updatesByAccount.set(update.accountId, previousAmount + update.amount)
  })

  return Array.from(updatesByAccount.entries())
    .map(([accountId, amount]) => ({
      accountId,
      amount,
    }))
    .filter((update) => update.amount !== 0)
}

function reverseBalanceUpdates(balanceUpdates: BalanceUpdate[]) {
  return balanceUpdates.map((update) => ({
    accountId: update.accountId,
    amount: -update.amount,
  }))
}

function getTransactionBalanceUpdates(transaction: Transaction): BalanceUpdate[] {
  if (transaction.amount <= 0) {
    return []
  }

  if (transaction.type === 'income') {
    return [
      {
        accountId: transaction.accountId,
        amount: transaction.amount,
      },
    ]
  }

  if (transaction.type === 'expense') {
    return [
      {
        accountId: transaction.accountId,
        amount: -transaction.amount,
      },
    ]
  }

  if (!transaction.toAccountId || transaction.toAccountId === transaction.accountId) {
    return []
  }

  return [
    {
      accountId: transaction.accountId,
      amount: -transaction.amount,
    },
    {
      accountId: transaction.toAccountId,
      amount: transaction.amount,
    },
  ]
}

function updateAccountBalancesInList(
  accounts: Account[],
  balanceUpdates: BalanceUpdate[],
) {
  const mergedUpdates = mergeBalanceUpdates(balanceUpdates)

  return accounts.map((account) => {
    const update = mergedUpdates.find((item) => item.accountId === account.id)

    if (!update) {
      return account
    }

    return {
      ...account,
      balance: account.balance + update.amount,
    }
  })
}

function mergeDebtRemainingUpdates(debtUpdates: DebtRemainingUpdate[]) {
  const updatesByDebt = new Map<string, number>()

  debtUpdates.forEach((update) => {
    const previousAmount = updatesByDebt.get(update.debtId) ?? 0
    updatesByDebt.set(update.debtId, previousAmount + update.amount)
  })

  return Array.from(updatesByDebt.entries())
    .map(([debtId, amount]) => ({
      debtId,
      amount,
    }))
    .filter((update) => update.amount !== 0)
}

function getDebtRemainingUpdatesForTransaction(
  transaction: Transaction,
  mode: 'apply' | 'reverse',
): DebtRemainingUpdate[] {
  if (
    !transaction.linkedDebtId ||
    transaction.type !== 'expense' ||
    transaction.category !== 'debt' ||
    transaction.amount <= 0
  ) {
    return []
  }

  return [
    {
      debtId: transaction.linkedDebtId,
      amount: mode === 'apply' ? -transaction.amount : transaction.amount,
    },
  ]
}

function mergeSavingGoalAmountUpdates(goalUpdates: SavingGoalAmountUpdate[]) {
  const updatesByGoal = new Map<string, number>()

  goalUpdates.forEach((update) => {
    const previousAmount = updatesByGoal.get(update.goalId) ?? 0
    updatesByGoal.set(update.goalId, previousAmount + update.amount)
  })

  return Array.from(updatesByGoal.entries())
    .map(([goalId, amount]) => ({
      goalId,
      amount,
    }))
    .filter((update) => update.amount !== 0)
}

function getSavingGoalAmountUpdatesForTransaction(
  transaction: Transaction,
  mode: 'apply' | 'reverse',
): SavingGoalAmountUpdate[] {
  if (
    !transaction.linkedSavingGoalId ||
    transaction.type !== 'expense' ||
    transaction.category !== 'savings' ||
    transaction.amount <= 0
  ) {
    return []
  }

  return [
    {
      goalId: transaction.linkedSavingGoalId,
      amount: mode === 'apply' ? transaction.amount : -transaction.amount,
    },
  ]
}

function mergeSinkingFundAmountUpdates(fundUpdates: SinkingFundAmountUpdate[]) {
  const updatesByFund = new Map<string, number>()

  fundUpdates.forEach((update) => {
    const previousAmount = updatesByFund.get(update.fundId) ?? 0
    updatesByFund.set(update.fundId, previousAmount + update.amount)
  })

  return Array.from(updatesByFund.entries())
    .map(([fundId, amount]) => ({
      fundId,
      amount,
    }))
    .filter((update) => update.amount !== 0)
}

function getSinkingFundAmountUpdatesForTransaction(
  transaction: Transaction,
  mode: 'apply' | 'reverse',
): SinkingFundAmountUpdate[] {
  if (
    !transaction.linkedSinkingFundId ||
    transaction.type !== 'expense' ||
    transaction.category !== 'savings' ||
    transaction.amount <= 0
  ) {
    return []
  }

  return [
    {
      fundId: transaction.linkedSinkingFundId,
      amount: mode === 'apply' ? transaction.amount : -transaction.amount,
    },
  ]
}

function upsertMonthlyBudgetInList(
  monthlyBudgets: MonthlyBudget[],
  savedBudget: MonthlyBudget,
) {
  const alreadyExists = monthlyBudgets.some((budget) => {
    return budget.id === savedBudget.id
  })

  if (alreadyExists) {
    return monthlyBudgets.map((budget) => {
      if (budget.id !== savedBudget.id) {
        return budget
      }

      return savedBudget
    })
  }

  const sameCategoryAndMonthExists = monthlyBudgets.some((budget) => {
    return (
      budget.category === savedBudget.category &&
      budget.month === savedBudget.month
    )
  })

  if (sameCategoryAndMonthExists) {
    return monthlyBudgets.map((budget) => {
      const isSameBudget =
        budget.category === savedBudget.category &&
        budget.month === savedBudget.month

      if (!isSameBudget) {
        return budget
      }

      return savedBudget
    })
  }

  return [savedBudget, ...monthlyBudgets]
}

export function BudgetProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()

  const [isBudgetLoading, setIsBudgetLoading] = useState(true)
  const [budgetError, setBudgetError] = useState('')

  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [monthlyBudgets, setMonthlyBudgets] = useState<MonthlyBudget[]>([])
  const [recurringPayments, setRecurringPayments] = useState<
    RecurringPayment[]
  >([])
  const [savingGoals, setSavingGoals] = useState<SavingGoal[]>([])
  const [sinkingFunds, setSinkingFunds] = useState<SinkingFund[]>([])
  const [debts, setDebts] = useState<Debt[]>([])
  const [investments, setInvestments] = useState<Investment[]>([])

  function clearBudgetError() {
    setBudgetError('')
  }

  async function saveAccountBalanceUpdates(balanceUpdates: BalanceUpdate[]) {
    const mergedUpdates = mergeBalanceUpdates(balanceUpdates)

    await Promise.all(
      mergedUpdates.map(async (update) => {
        const accountToUpdate = accounts.find((account) => {
          return account.id === update.accountId
        })

        if (!accountToUpdate) {
          return
        }

        await editAccountBalance(
          accountToUpdate.id,
          accountToUpdate.balance + update.amount,
        )
      }),
    )
  }

  async function saveDebtRemainingUpdates(debtUpdates: DebtRemainingUpdate[]) {
    const mergedUpdates = mergeDebtRemainingUpdates(debtUpdates)

    if (mergedUpdates.length === 0) {
      return
    }

    const savedDebts = await Promise.all(
      mergedUpdates.map(async (update) => {
        const debtToUpdate = debts.find((debt) => {
          return debt.id === update.debtId
        })

        if (!debtToUpdate) {
          return null
        }

        const nextRemainingAmount = clampAmount(
          debtToUpdate.remainingAmount + update.amount,
          0,
          debtToUpdate.totalAmount,
        )

        return editDebt({
          ...debtToUpdate,
          remainingAmount: nextRemainingAmount,
        })
      }),
    )

    const validSavedDebts = savedDebts.filter((debt): debt is Debt => {
      return Boolean(debt)
    })

    if (validSavedDebts.length === 0) {
      return
    }

    setDebts((currentDebts) =>
      currentDebts.map((debt) => {
        const savedDebt = validSavedDebts.find((item) => item.id === debt.id)

        if (!savedDebt) {
          return debt
        }

        return savedDebt
      }),
    )
  }

  async function saveSavingGoalAmountUpdates(
    goalUpdates: SavingGoalAmountUpdate[],
  ) {
    const mergedUpdates = mergeSavingGoalAmountUpdates(goalUpdates)

    if (mergedUpdates.length === 0) {
      return
    }

    const savedGoals = await Promise.all(
      mergedUpdates.map(async (update) => {
        const goalToUpdate = savingGoals.find((goal) => {
          return goal.id === update.goalId
        })

        if (!goalToUpdate) {
          return null
        }

        const nextCurrentAmount = clampAmount(
          goalToUpdate.currentAmount + update.amount,
          0,
          goalToUpdate.targetAmount,
        )

        return editSavingGoal({
          ...goalToUpdate,
          currentAmount: nextCurrentAmount,
        })
      }),
    )

    const validSavedGoals = savedGoals.filter((goal): goal is SavingGoal => {
      return Boolean(goal)
    })

    if (validSavedGoals.length === 0) {
      return
    }

    setSavingGoals((currentGoals) =>
      currentGoals.map((goal) => {
        const savedGoal = validSavedGoals.find((item) => item.id === goal.id)

        if (!savedGoal) {
          return goal
        }

        return savedGoal
      }),
    )
  }

  async function saveSinkingFundAmountUpdates(
    fundUpdates: SinkingFundAmountUpdate[],
  ) {
    const mergedUpdates = mergeSinkingFundAmountUpdates(fundUpdates)

    if (mergedUpdates.length === 0) {
      return
    }

    const savedFunds = await Promise.all(
      mergedUpdates.map(async (update) => {
        const fundToUpdate = sinkingFunds.find((fund) => {
          return fund.id === update.fundId
        })

        if (!fundToUpdate) {
          return null
        }

        const nextCurrentAmount = clampAmount(
          fundToUpdate.currentAmount + update.amount,
          0,
          fundToUpdate.targetAmount,
        )

        return editSinkingFund({
          ...fundToUpdate,
          currentAmount: nextCurrentAmount,
        })
      }),
    )

    const validSavedFunds = savedFunds.filter((fund): fund is SinkingFund => {
      return Boolean(fund)
    })

    if (validSavedFunds.length === 0) {
      return
    }

    setSinkingFunds((currentFunds) =>
      currentFunds.map((fund) => {
        const savedFund = validSavedFunds.find((item) => item.id === fund.id)

        if (!savedFund) {
          return fund
        }

        return savedFund
      }),
    )
  }

  useEffect(() => {
    let isMounted = true

    async function loadBudgetData() {
      setIsBudgetLoading(true)
      setBudgetError('')

      if (!user) {
        setAccounts([])
        setTransactions([])
        setMonthlyBudgets([])
        setRecurringPayments([])
        setSavingGoals([])
        setSinkingFunds([])
        setDebts([])
        setInvestments([])
        setIsBudgetLoading(false)
        return
      }

      try {
        const [
          supabaseAccounts,
          supabaseTransactions,
          supabaseMonthlyBudgets,
          supabaseRecurringPayments,
          supabaseSavingGoals,
          supabaseSinkingFunds,
          supabaseDebts,
          supabaseInvestments,
        ] = await Promise.all([
          fetchAccounts(user.id),
          fetchTransactions(user.id),
          fetchMonthlyBudgets(user.id),
          fetchRecurringPayments(user.id),
          fetchSavingGoals(user.id),
          fetchSinkingFunds(user.id),
          fetchDebts(user.id),
          fetchInvestments(user.id),
        ])

        if (!isMounted) {
          return
        }

        setAccounts(supabaseAccounts)
        setTransactions(supabaseTransactions)
        setMonthlyBudgets(supabaseMonthlyBudgets)
        setRecurringPayments(supabaseRecurringPayments)
        setSavingGoals(supabaseSavingGoals)
        setSinkingFunds(supabaseSinkingFunds)
        setDebts(supabaseDebts)
        setInvestments(supabaseInvestments)
      } catch (error) {
        console.error(
          'Erreur lors du chargement des données Supabase :',
          error,
        )

        if (isMounted) {
          setBudgetError(
            `Impossible de charger les données du carnet : ${getErrorMessage(
              error,
            )}`,
          )
        }
      } finally {
        if (isMounted) {
          setIsBudgetLoading(false)
        }
      }
    }

    void loadBudgetData()

    return () => {
      isMounted = false
    }
  }, [user])

  async function addAccount(account: Account) {
    if (!user) {
      return
    }

    setBudgetError('')

    try {
      const createdAccount = await createAccount(user.id, account)

      setAccounts((currentAccounts) => [createdAccount, ...currentAccounts])
    } catch (error) {
      console.error('Erreur lors de la création du compte Supabase :', error)
      setBudgetError(
        `Impossible de créer ce compte : ${getErrorMessage(error)}`,
      )
    }
  }

  async function updateAccount(updatedAccount: Account) {
    setBudgetError('')

    try {
      const savedAccount = await editAccount(updatedAccount)

      setAccounts((currentAccounts) =>
        currentAccounts.map((account) => {
          if (account.id !== savedAccount.id) {
            return account
          }

          return savedAccount
        }),
      )
    } catch (error) {
      console.error('Erreur lors de la modification du compte Supabase :', error)
      setBudgetError(
        `Impossible de modifier ce compte : ${getErrorMessage(error)}`,
      )
    }
  }

  async function updateAccountBalance(accountId: string, balance: number) {
    setBudgetError('')

    try {
      const savedAccount = await editAccountBalance(accountId, balance)

      setAccounts((currentAccounts) =>
        currentAccounts.map((account) => {
          if (account.id !== savedAccount.id) {
            return account
          }

          return savedAccount
        }),
      )
    } catch (error) {
      console.error(
        'Erreur lors de la modification du solde Supabase :',
        error,
      )
      setBudgetError(
        `Impossible de modifier ce solde : ${getErrorMessage(error)}`,
      )
    }
  }

  async function deleteAccount(accountId: string) {
    setBudgetError('')

    try {
      await removeAccount(accountId)

      setAccounts((currentAccounts) =>
        currentAccounts.filter((account) => account.id !== accountId),
      )
    } catch (error) {
      console.error('Erreur lors de la suppression du compte Supabase :', error)
      setBudgetError(
        `Impossible de supprimer ce compte : ${getErrorMessage(error)}`,
      )
    }
  }

  async function addTransaction(transaction: Transaction) {
    if (!user) {
      return
    }

    setBudgetError('')

    try {
      const createdTransaction = await createTransaction(user.id, transaction)

      const transactionToStore = hydrateTransactionForBalance(
        createdTransaction,
        transaction,
      )

      const balanceUpdates = getTransactionBalanceUpdates(transactionToStore)
      const debtUpdates = getDebtRemainingUpdatesForTransaction(
        transactionToStore,
        'apply',
      )
      const goalUpdates = getSavingGoalAmountUpdatesForTransaction(
        transactionToStore,
        'apply',
      )
      const fundUpdates = getSinkingFundAmountUpdatesForTransaction(
        transactionToStore,
        'apply',
      )

      await Promise.all([
        saveAccountBalanceUpdates(balanceUpdates),
        saveDebtRemainingUpdates(debtUpdates),
        saveSavingGoalAmountUpdates(goalUpdates),
        saveSinkingFundAmountUpdates(fundUpdates),
      ])

      setTransactions((currentTransactions) => [
        transactionToStore,
        ...currentTransactions,
      ])

      setAccounts((currentAccounts) =>
        updateAccountBalancesInList(currentAccounts, balanceUpdates),
      )
    } catch (error) {
      console.error(
        'Erreur lors de la création de la transaction Supabase :',
        error,
      )
      setBudgetError(
        `Impossible de créer cette transaction : ${getErrorMessage(error)}`,
      )
    }
  }

  async function updateTransaction(updatedTransaction: Transaction) {
    const previousTransaction = transactions.find((transaction) => {
      return transaction.id === updatedTransaction.id
    })

    if (!previousTransaction) {
      return
    }

    setBudgetError('')

    try {
      const savedTransaction = await editTransaction(updatedTransaction)

      const transactionToStore = hydrateTransactionForBalance(
        savedTransaction,
        updatedTransaction,
      )

      const previousBalanceUpdates =
        getTransactionBalanceUpdates(previousTransaction)

      const nextBalanceUpdates = getTransactionBalanceUpdates(transactionToStore)

      const balanceUpdates = mergeBalanceUpdates([
        ...reverseBalanceUpdates(previousBalanceUpdates),
        ...nextBalanceUpdates,
      ])

      const debtUpdates = mergeDebtRemainingUpdates([
        ...getDebtRemainingUpdatesForTransaction(
          previousTransaction,
          'reverse',
        ),
        ...getDebtRemainingUpdatesForTransaction(transactionToStore, 'apply'),
      ])

      const goalUpdates = mergeSavingGoalAmountUpdates([
        ...getSavingGoalAmountUpdatesForTransaction(
          previousTransaction,
          'reverse',
        ),
        ...getSavingGoalAmountUpdatesForTransaction(
          transactionToStore,
          'apply',
        ),
      ])

      const fundUpdates = mergeSinkingFundAmountUpdates([
        ...getSinkingFundAmountUpdatesForTransaction(
          previousTransaction,
          'reverse',
        ),
        ...getSinkingFundAmountUpdatesForTransaction(
          transactionToStore,
          'apply',
        ),
      ])

      await Promise.all([
        saveAccountBalanceUpdates(balanceUpdates),
        saveDebtRemainingUpdates(debtUpdates),
        saveSavingGoalAmountUpdates(goalUpdates),
        saveSinkingFundAmountUpdates(fundUpdates),
      ])

      setTransactions((currentTransactions) =>
        currentTransactions.map((transaction) => {
          if (transaction.id !== transactionToStore.id) {
            return transaction
          }

          return transactionToStore
        }),
      )

      setAccounts((currentAccounts) =>
        updateAccountBalancesInList(currentAccounts, balanceUpdates),
      )
    } catch (error) {
      console.error(
        'Erreur lors de la modification de la transaction Supabase :',
        error,
      )
      setBudgetError(
        `Impossible de modifier cette transaction : ${getErrorMessage(error)}`,
      )
    }
  }

  async function deleteTransaction(transactionId: string) {
    const transactionToDelete = transactions.find((transaction) => {
      return transaction.id === transactionId
    })

    if (!transactionToDelete) {
      return
    }

    setBudgetError('')

    try {
      await removeTransaction(transactionId)

      const balanceUpdates = reverseBalanceUpdates(
        getTransactionBalanceUpdates(transactionToDelete),
      )

      const debtUpdates = getDebtRemainingUpdatesForTransaction(
        transactionToDelete,
        'reverse',
      )

      const goalUpdates = getSavingGoalAmountUpdatesForTransaction(
        transactionToDelete,
        'reverse',
      )

      const fundUpdates = getSinkingFundAmountUpdatesForTransaction(
        transactionToDelete,
        'reverse',
      )

      await Promise.all([
        saveAccountBalanceUpdates(balanceUpdates),
        saveDebtRemainingUpdates(debtUpdates),
        saveSavingGoalAmountUpdates(goalUpdates),
        saveSinkingFundAmountUpdates(fundUpdates),
      ])

      setTransactions((currentTransactions) =>
        currentTransactions.filter((transaction) => {
          return transaction.id !== transactionId
        }),
      )

      setAccounts((currentAccounts) =>
        updateAccountBalancesInList(currentAccounts, balanceUpdates),
      )
    } catch (error) {
      console.error(
        'Erreur lors de la suppression de la transaction Supabase :',
        error,
      )
      setBudgetError(
        `Impossible de supprimer cette transaction : ${getErrorMessage(error)}`,
      )
    }
  }

  async function addMonthlyBudget(budget: MonthlyBudget) {
    if (!user) {
      return
    }

    setBudgetError('')

    try {
      const savedBudget = await saveMonthlyBudget(
        user.id,
        budget.category,
        budget.limit,
        budget.month,
      )

      setMonthlyBudgets((currentBudgets) =>
        upsertMonthlyBudgetInList(currentBudgets, savedBudget),
      )
    } catch (error) {
      console.error('Erreur lors de la création du budget Supabase :', error)
      setBudgetError(
        `Impossible de créer ce budget : ${getErrorMessage(error)}`,
      )
    }
  }

  async function updateMonthlyBudgetLimit(
    categoryId: BudgetCategoryId,
    limit: number,
    monthKey?: string,
  ) {
    if (!user || !monthKey) {
      setMonthlyBudgets((currentBudgets) =>
        currentBudgets.map((budget) => {
          const isSameCategory = budget.category === categoryId
          const isSameMonth = monthKey ? budget.month === monthKey : true

          if (!isSameCategory || !isSameMonth) {
            return budget
          }

          return {
            ...budget,
            limit,
          }
        }),
      )

      return
    }

    setBudgetError('')

    try {
      const savedBudget = await saveMonthlyBudget(
        user.id,
        categoryId,
        limit,
        monthKey,
      )

      setMonthlyBudgets((currentBudgets) =>
        upsertMonthlyBudgetInList(currentBudgets, savedBudget),
      )
    } catch (error) {
      console.error(
        'Erreur lors de la modification du budget Supabase :',
        error,
      )
      setBudgetError(
        `Impossible de modifier ce budget : ${getErrorMessage(error)}`,
      )
    }
  }

  async function resetMonthlyBudgets() {
    if (!user) {
      setMonthlyBudgets([])
      return
    }

    setBudgetError('')

    try {
      await removeMonthlyBudgetsForUser(user.id)
      setMonthlyBudgets([])
    } catch (error) {
      console.error(
        'Erreur lors de la réinitialisation des budgets Supabase :',
        error,
      )
      setBudgetError(
        `Impossible de réinitialiser les budgets : ${getErrorMessage(error)}`,
      )
    }
  }

  async function addRecurringPayment(payment: RecurringPayment) {
    if (!user) {
      return
    }

    setBudgetError('')

    try {
      const createdPayment = await createRecurringPayment(user.id, payment)

      setRecurringPayments((currentPayments) => [
        createdPayment,
        ...currentPayments,
      ])
    } catch (error) {
      console.error(
        'Erreur lors de la création du paiement récurrent Supabase :',
        error,
      )
      setBudgetError(
        `Impossible de créer ce paiement récurrent : ${getErrorMessage(error)}`,
      )
    }
  }

  async function updateRecurringPayment(updatedPayment: RecurringPayment) {
    setBudgetError('')

    try {
      const savedPayment = await editRecurringPayment(updatedPayment)

      setRecurringPayments((currentPayments) =>
        currentPayments.map((payment) => {
          if (payment.id !== savedPayment.id) {
            return payment
          }

          return savedPayment
        }),
      )
    } catch (error) {
      console.error(
        'Erreur lors de la modification du paiement récurrent Supabase :',
        error,
      )
      setBudgetError(
        `Impossible de modifier ce paiement récurrent : ${getErrorMessage(
          error,
        )}`,
      )
    }
  }

  async function toggleRecurringPayment(paymentId: string) {
    const paymentToToggle = recurringPayments.find((payment) => {
      return payment.id === paymentId
    })

    if (!paymentToToggle) {
      return
    }

    setBudgetError('')

    try {
      const savedPayment = await editRecurringPayment({
        ...paymentToToggle,
        isActive: !paymentToToggle.isActive,
      })

      setRecurringPayments((currentPayments) =>
        currentPayments.map((payment) => {
          if (payment.id !== savedPayment.id) {
            return payment
          }

          return savedPayment
        }),
      )
    } catch (error) {
      console.error(
        'Erreur lors de l’activation du paiement récurrent Supabase :',
        error,
      )
      setBudgetError(
        `Impossible de changer l’état de ce paiement : ${getErrorMessage(
          error,
        )}`,
      )
    }
  }

  async function deleteRecurringPayment(paymentId: string) {
    setBudgetError('')

    try {
      await removeRecurringPayment(paymentId)

      setRecurringPayments((currentPayments) =>
        currentPayments.filter((payment) => payment.id !== paymentId),
      )
    } catch (error) {
      console.error(
        'Erreur lors de la suppression du paiement récurrent Supabase :',
        error,
      )
      setBudgetError(
        `Impossible de supprimer ce paiement récurrent : ${getErrorMessage(
          error,
        )}`,
      )
    }
  }

  async function addSavingGoal(goal: SavingGoal) {
    if (!user) {
      return
    }

    setBudgetError('')

    try {
      const createdGoal = await createSavingGoal(user.id, goal)

      setSavingGoals((currentGoals) => [createdGoal, ...currentGoals])
    } catch (error) {
      console.error(
        'Erreur lors de la création de l’objectif Supabase :',
        error,
      )
      setBudgetError(
        `Impossible de créer cet objectif : ${getErrorMessage(error)}`,
      )
    }
  }

  async function updateSavingGoal(updatedGoal: SavingGoal) {
    setBudgetError('')

    try {
      const savedGoal = await editSavingGoal(updatedGoal)

      setSavingGoals((currentGoals) =>
        currentGoals.map((goal) => {
          if (goal.id !== savedGoal.id) {
            return goal
          }

          return savedGoal
        }),
      )
    } catch (error) {
      console.error(
        'Erreur lors de la modification de l’objectif Supabase :',
        error,
      )
      setBudgetError(
        `Impossible de modifier cet objectif : ${getErrorMessage(error)}`,
      )
    }
  }

  async function updateSavingGoalAmount(goalId: string, amount: number) {
    const goalToUpdate = savingGoals.find((goal) => goal.id === goalId)

    if (!goalToUpdate) {
      return
    }

    const nextAmount = Math.min(
      Math.max(goalToUpdate.currentAmount + amount, 0),
      goalToUpdate.targetAmount,
    )

    setBudgetError('')

    try {
      const savedGoal = await editSavingGoal({
        ...goalToUpdate,
        currentAmount: nextAmount,
      })

      setSavingGoals((currentGoals) =>
        currentGoals.map((goal) => {
          if (goal.id !== savedGoal.id) {
            return goal
          }

          return savedGoal
        }),
      )
    } catch (error) {
      console.error(
        'Erreur lors de la mise à jour de l’objectif Supabase :',
        error,
      )
      setBudgetError(
        `Impossible de mettre à jour cet objectif : ${getErrorMessage(error)}`,
      )
    }
  }

  async function saveMoneyToGoalFromAccount(
    goalId: string,
    accountId: string,
    amount: number,
  ) {
    if (!user) {
      return
    }

    const goalToUpdate = savingGoals.find((goal) => goal.id === goalId)

    if (!goalToUpdate) {
      setBudgetError('Impossible de trouver cet objectif.')
      return
    }

    const accountToUpdate = accounts.find((account) => account.id === accountId)

    if (!accountToUpdate) {
      setBudgetError('Choisis un compte valide pour cette mise de côté.')
      return
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setBudgetError('Le montant mis de côté doit être supérieur à 0 €.')
      return
    }

    if (goalToUpdate.currentAmount >= goalToUpdate.targetAmount) {
      setBudgetError('Cet objectif est déjà atteint.')
      return
    }

    const amountToSave = Math.min(
      amount,
      goalToUpdate.targetAmount - goalToUpdate.currentAmount,
    )

    const nextCurrentAmount = goalToUpdate.currentAmount + amountToSave

    const savingTransaction: Transaction = {
      id: createTransactionId(),
      title: `Mise de côté ${goalToUpdate.title}`,
      amount: amountToSave,
      type: 'expense',
      category: 'savings',
      accountId,
      date: getTodayDate(),
      note: `Mise de côté liée à l’objectif "${goalToUpdate.title}".`,
      isRecurring: false,
      linkedSavingGoalId: goalToUpdate.id,
    }

    setBudgetError('')

    try {
      const createdTransaction = await createTransaction(
        user.id,
        savingTransaction,
      )

      const transactionToStore = hydrateTransactionForBalance(
        createdTransaction,
        savingTransaction,
      )

      const balanceUpdates = getTransactionBalanceUpdates(transactionToStore)

      const [savedGoal] = await Promise.all([
        editSavingGoal({
          ...goalToUpdate,
          currentAmount: nextCurrentAmount,
        }),
        saveAccountBalanceUpdates(balanceUpdates),
      ])

      setTransactions((currentTransactions) => [
        transactionToStore,
        ...currentTransactions,
      ])

      setAccounts((currentAccounts) =>
        updateAccountBalancesInList(currentAccounts, balanceUpdates),
      )

      setSavingGoals((currentGoals) =>
        currentGoals.map((goal) => {
          if (goal.id !== savedGoal.id) {
            return goal
          }

          return savedGoal
        }),
      )
    } catch (error) {
      console.error(
        'Erreur lors de la mise de côté vers l’objectif Supabase :',
        error,
      )
      setBudgetError(
        `Impossible d’enregistrer cette mise de côté : ${getErrorMessage(
          error,
        )}`,
      )
    }
  }

  async function deleteSavingGoal(goalId: string) {
    setBudgetError('')

    try {
      await removeSavingGoal(goalId)

      setSavingGoals((currentGoals) =>
        currentGoals.filter((goal) => goal.id !== goalId),
      )
    } catch (error) {
      console.error(
        'Erreur lors de la suppression de l’objectif Supabase :',
        error,
      )
      setBudgetError(
        `Impossible de supprimer cet objectif : ${getErrorMessage(error)}`,
      )
    }
  }

  async function addSinkingFund(fund: SinkingFund) {
    if (!user) {
      return
    }

    setBudgetError('')

    try {
      const createdFund = await createSinkingFund(user.id, fund)

      setSinkingFunds((currentFunds) => [createdFund, ...currentFunds])
    } catch (error) {
      console.error('Erreur lors de la création du fonds Supabase :', error)
      setBudgetError(
        `Impossible de créer ce fonds : ${getErrorMessage(error)}`,
      )
    }
  }

  async function updateSinkingFund(updatedFund: SinkingFund) {
    setBudgetError('')

    try {
      const savedFund = await editSinkingFund(updatedFund)

      setSinkingFunds((currentFunds) =>
        currentFunds.map((fund) => {
          if (fund.id !== savedFund.id) {
            return fund
          }

          return savedFund
        }),
      )
    } catch (error) {
      console.error('Erreur lors de la modification du fonds Supabase :', error)
      setBudgetError(
        `Impossible de modifier ce fonds : ${getErrorMessage(error)}`,
      )
    }
  }

  async function updateSinkingFundAmount(fundId: string, amount: number) {
    const fundToUpdate = sinkingFunds.find((fund) => fund.id === fundId)

    if (!fundToUpdate) {
      return
    }

    const nextAmount = Math.min(
      Math.max(fundToUpdate.currentAmount + amount, 0),
      fundToUpdate.targetAmount,
    )

    setBudgetError('')

    try {
      const savedFund = await editSinkingFund({
        ...fundToUpdate,
        currentAmount: nextAmount,
      })

      setSinkingFunds((currentFunds) =>
        currentFunds.map((fund) => {
          if (fund.id !== savedFund.id) {
            return fund
          }

          return savedFund
        }),
      )
    } catch (error) {
      console.error('Erreur lors de la mise à jour du fonds Supabase :', error)
      setBudgetError(
        `Impossible de mettre à jour ce fonds : ${getErrorMessage(error)}`,
      )
    }
  }

  async function saveMoneyToSinkingFundFromAccount(
    fundId: string,
    accountId: string,
    amount: number,
  ) {
    if (!user) {
      return
    }

    const fundToUpdate = sinkingFunds.find((fund) => fund.id === fundId)

    if (!fundToUpdate) {
      setBudgetError('Impossible de trouver ce fonds.')
      return
    }

    const accountToUpdate = accounts.find((account) => account.id === accountId)

    if (!accountToUpdate) {
      setBudgetError('Choisis un compte valide pour cette mise de côté.')
      return
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setBudgetError('Le montant mis de côté doit être supérieur à 0 €.')
      return
    }

    if (fundToUpdate.currentAmount >= fundToUpdate.targetAmount) {
      setBudgetError('Ce fonds est déjà complet.')
      return
    }

    const amountToSave = Math.min(
      amount,
      fundToUpdate.targetAmount - fundToUpdate.currentAmount,
    )

    const nextCurrentAmount = fundToUpdate.currentAmount + amountToSave

    const savingTransaction: Transaction = {
      id: createTransactionId(),
      title: `Mise de côté ${fundToUpdate.title}`,
      amount: amountToSave,
      type: 'expense',
      category: 'savings',
      accountId,
      date: getTodayDate(),
      note: `Mise de côté liée au fonds "${fundToUpdate.title}".`,
      isRecurring: false,
      linkedSinkingFundId: fundToUpdate.id,
    }

    setBudgetError('')

    try {
      const createdTransaction = await createTransaction(
        user.id,
        savingTransaction,
      )

      const transactionToStore = hydrateTransactionForBalance(
        createdTransaction,
        savingTransaction,
      )

      const balanceUpdates = getTransactionBalanceUpdates(transactionToStore)

      const [savedFund] = await Promise.all([
        editSinkingFund({
          ...fundToUpdate,
          currentAmount: nextCurrentAmount,
        }),
        saveAccountBalanceUpdates(balanceUpdates),
      ])

      setTransactions((currentTransactions) => [
        transactionToStore,
        ...currentTransactions,
      ])

      setAccounts((currentAccounts) =>
        updateAccountBalancesInList(currentAccounts, balanceUpdates),
      )

      setSinkingFunds((currentFunds) =>
        currentFunds.map((fund) => {
          if (fund.id !== savedFund.id) {
            return fund
          }

          return savedFund
        }),
      )
    } catch (error) {
      console.error(
        'Erreur lors de la mise de côté vers le fonds Supabase :',
        error,
      )
      setBudgetError(
        `Impossible d’enregistrer cette mise de côté : ${getErrorMessage(
          error,
        )}`,
      )
    }
  }

  async function deleteSinkingFund(fundId: string) {
    setBudgetError('')

    try {
      await removeSinkingFund(fundId)

      setSinkingFunds((currentFunds) =>
        currentFunds.filter((fund) => fund.id !== fundId),
      )
    } catch (error) {
      console.error('Erreur lors de la suppression du fonds Supabase :', error)
      setBudgetError(
        `Impossible de supprimer ce fonds : ${getErrorMessage(error)}`,
      )
    }
  }

  async function addDebt(debt: Debt) {
    if (!user) {
      return
    }

    setBudgetError('')

    try {
      const createdDebt = await createDebt(user.id, debt)

      setDebts((currentDebts) => [createdDebt, ...currentDebts])
    } catch (error) {
      console.error('Erreur lors de la création de la dette Supabase :', error)
      setBudgetError(
        `Impossible de créer cette dette : ${getErrorMessage(error)}`,
      )
    }
  }

  async function updateDebt(updatedDebt: Debt) {
    setBudgetError('')

    try {
      const savedDebt = await editDebt(updatedDebt)

      setDebts((currentDebts) =>
        currentDebts.map((debt) => {
          if (debt.id !== savedDebt.id) {
            return debt
          }

          return savedDebt
        }),
      )
    } catch (error) {
      console.error(
        'Erreur lors de la modification de la dette Supabase :',
        error,
      )
      setBudgetError(
        `Impossible de modifier cette dette : ${getErrorMessage(error)}`,
      )
    }
  }

  async function updateDebtRemainingAmount(debtId: string, amount: number) {
    const debtToUpdate = debts.find((debt) => debt.id === debtId)

    if (!debtToUpdate) {
      return
    }

    const nextRemainingAmount = Math.min(
      Math.max(debtToUpdate.remainingAmount + amount, 0),
      debtToUpdate.totalAmount,
    )

    setBudgetError('')

    try {
      const savedDebt = await editDebt({
        ...debtToUpdate,
        remainingAmount: nextRemainingAmount,
      })

      setDebts((currentDebts) =>
        currentDebts.map((debt) => {
          if (debt.id !== savedDebt.id) {
            return debt
          }

          return savedDebt
        }),
      )
    } catch (error) {
      console.error(
        'Erreur lors de la mise à jour de la dette Supabase :',
        error,
      )
      setBudgetError(
        `Impossible de mettre à jour cette dette : ${getErrorMessage(error)}`,
      )
    }
  }

  async function repayDebtFromAccount(
    debtId: string,
    accountId: string,
    amount: number,
  ) {
    if (!user) {
      return
    }

    const debtToUpdate = debts.find((debt) => debt.id === debtId)

    if (!debtToUpdate) {
      setBudgetError('Impossible de trouver cette dette.')
      return
    }

    const accountToUpdate = accounts.find((account) => account.id === accountId)

    if (!accountToUpdate) {
      setBudgetError('Choisis un compte valide pour ce remboursement.')
      return
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setBudgetError('Le montant du remboursement doit être supérieur à 0 €.')
      return
    }

    if (debtToUpdate.remainingAmount <= 0) {
      setBudgetError('Cette dette est déjà remboursée.')
      return
    }

    const repaymentAmount = Math.min(amount, debtToUpdate.remainingAmount)
    const nextRemainingAmount = debtToUpdate.remainingAmount - repaymentAmount

    const repaymentTransaction: Transaction = {
      id: createTransactionId(),
      title: `Remboursement ${debtToUpdate.title}`,
      amount: repaymentAmount,
      type: 'expense',
      category: 'debt',
      accountId,
      date: getTodayDate(),
      note: `Remboursement lié à la dette "${debtToUpdate.title}".`,
      isRecurring: false,
      linkedDebtId: debtToUpdate.id,
    }

    setBudgetError('')

    try {
      const createdTransaction = await createTransaction(
        user.id,
        repaymentTransaction,
      )

      const transactionToStore = hydrateTransactionForBalance(
        createdTransaction,
        repaymentTransaction,
      )

      const balanceUpdates = getTransactionBalanceUpdates(transactionToStore)

      const [savedDebt] = await Promise.all([
        editDebt({
          ...debtToUpdate,
          remainingAmount: nextRemainingAmount,
        }),
        saveAccountBalanceUpdates(balanceUpdates),
      ])

      setTransactions((currentTransactions) => [
        transactionToStore,
        ...currentTransactions,
      ])

      setAccounts((currentAccounts) =>
        updateAccountBalancesInList(currentAccounts, balanceUpdates),
      )

      setDebts((currentDebts) =>
        currentDebts.map((debt) => {
          if (debt.id !== savedDebt.id) {
            return debt
          }

          return savedDebt
        }),
      )
    } catch (error) {
      console.error(
        'Erreur lors du remboursement de la dette Supabase :',
        error,
      )
      setBudgetError(
        `Impossible d’enregistrer ce remboursement : ${getErrorMessage(error)}`,
      )
    }
  }

  async function deleteDebt(debtId: string) {
    setBudgetError('')

    try {
      await removeDebt(debtId)

      setDebts((currentDebts) =>
        currentDebts.filter((debt) => debt.id !== debtId),
      )
    } catch (error) {
      console.error(
        'Erreur lors de la suppression de la dette Supabase :',
        error,
      )
      setBudgetError(
        `Impossible de supprimer cette dette : ${getErrorMessage(error)}`,
      )
    }
  }

  async function addInvestment(investment: Investment) {
    if (!user) {
      return
    }

    setBudgetError('')

    try {
      const createdInvestment = await createInvestment(user.id, investment)

      setInvestments((currentInvestments) => [
        createdInvestment,
        ...currentInvestments,
      ])
    } catch (error) {
      console.error(
        'Erreur lors de la création de l’investissement Supabase :',
        error,
      )
      setBudgetError(
        `Impossible de créer cet investissement : ${getErrorMessage(error)}`,
      )
    }
  }

  async function updateInvestment(updatedInvestment: Investment) {
    setBudgetError('')

    try {
      const savedInvestment = await editInvestment(updatedInvestment)

      setInvestments((currentInvestments) =>
        currentInvestments.map((investment) => {
          if (investment.id !== savedInvestment.id) {
            return investment
          }

          return savedInvestment
        }),
      )
    } catch (error) {
      console.error(
        'Erreur lors de la modification de l’investissement Supabase :',
        error,
      )
      setBudgetError(
        `Impossible de modifier cet investissement : ${getErrorMessage(error)}`,
      )
    }
  }

  async function updateInvestmentCurrentValue(
    investmentId: string,
    currentValue: number,
  ) {
    const investmentToUpdate = investments.find((investment) => {
      return investment.id === investmentId
    })

    if (!investmentToUpdate) {
      return
    }

    setBudgetError('')

    try {
      const savedInvestment = await editInvestment({
        ...investmentToUpdate,
        currentValue,
      })

      setInvestments((currentInvestments) =>
        currentInvestments.map((investment) => {
          if (investment.id !== savedInvestment.id) {
            return investment
          }

          return savedInvestment
        }),
      )
    } catch (error) {
      console.error(
        'Erreur lors de la mise à jour de l’investissement Supabase :',
        error,
      )
      setBudgetError(
        `Impossible de mettre à jour cet investissement : ${getErrorMessage(
          error,
        )}`,
      )
    }
  }

  async function deleteInvestment(investmentId: string) {
    setBudgetError('')

    try {
      await removeInvestment(investmentId)

      setInvestments((currentInvestments) =>
        currentInvestments.filter((investment) => {
          return investment.id !== investmentId
        }),
      )
    } catch (error) {
      console.error(
        'Erreur lors de la suppression de l’investissement Supabase :',
        error,
      )
      setBudgetError(
        `Impossible de supprimer cet investissement : ${getErrorMessage(
          error,
        )}`,
      )
    }
  }

  async function resetGoals() {
    if (!user) {
      setSavingGoals([])
      setSinkingFunds([])
      return
    }

    setBudgetError('')

    try {
      await Promise.all([
        removeSavingGoalsForUser(user.id),
        removeSinkingFundsForUser(user.id),
      ])

      setSavingGoals([])
      setSinkingFunds([])
    } catch (error) {
      console.error(
        'Erreur lors de la réinitialisation des objectifs Supabase :',
        error,
      )
      setBudgetError(
        `Impossible de réinitialiser les objectifs : ${getErrorMessage(error)}`,
      )
    }
  }

  function resetAllDemoData() {
    setAccounts([])
    setTransactions([])
    setMonthlyBudgets([])
    setRecurringPayments([])
    setSavingGoals([])
    setSinkingFunds([])
    setDebts([])
    setInvestments([])
  }

  const value: BudgetContextValue = {
    isBudgetLoading,
    budgetError,
    clearBudgetError,

    accounts,
    transactions,
    monthlyBudgets,
    recurringPayments,
    savingGoals,
    sinkingFunds,
    debts,
    investments,

    addAccount,
    updateAccount,
    updateAccountBalance,
    deleteAccount,

    addTransaction,
    updateTransaction,
    deleteTransaction,

    addMonthlyBudget,
    updateMonthlyBudgetLimit,
    resetMonthlyBudgets,

    addRecurringPayment,
    updateRecurringPayment,
    toggleRecurringPayment,
    deleteRecurringPayment,

    addSavingGoal,
    updateSavingGoal,
    updateSavingGoalAmount,
    saveMoneyToGoalFromAccount,
    deleteSavingGoal,

    addSinkingFund,
    updateSinkingFund,
    updateSinkingFundAmount,
    saveMoneyToSinkingFundFromAccount,
    deleteSinkingFund,

    addDebt,
    updateDebt,
    updateDebtRemainingAmount,
    repayDebtFromAccount,
    deleteDebt,

    addInvestment,
    updateInvestment,
    updateInvestmentCurrentValue,
    deleteInvestment,

    resetGoals,
    resetAllDemoData,
  }

  return (
    <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>
  )
}
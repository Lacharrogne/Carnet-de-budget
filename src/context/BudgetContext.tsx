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

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'Une erreur inconnue est survenue.'
}

function getTransactionBalanceVariation(transaction: Transaction) {
  return transaction.type === 'income' ? transaction.amount : -transaction.amount
}

function updateAccountBalanceInList(
  accounts: Account[],
  accountId: string,
  amount: number,
) {
  return accounts.map((account) => {
    if (account.id !== accountId) {
      return account
    }

    return {
      ...account,
      balance: account.balance + amount,
    }
  })
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
      const balanceVariation =
        getTransactionBalanceVariation(createdTransaction)

      const accountToUpdate = accounts.find((account) => {
        return account.id === createdTransaction.accountId
      })

      if (accountToUpdate) {
        await editAccountBalance(
          accountToUpdate.id,
          accountToUpdate.balance + balanceVariation,
        )
      }

      setTransactions((currentTransactions) => [
        createdTransaction,
        ...currentTransactions,
      ])

      setAccounts((currentAccounts) =>
        updateAccountBalanceInList(
          currentAccounts,
          createdTransaction.accountId,
          balanceVariation,
        ),
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

      const previousVariation =
        getTransactionBalanceVariation(previousTransaction)
      const nextVariation = getTransactionBalanceVariation(savedTransaction)

      const previousAccount = accounts.find((account) => {
        return account.id === previousTransaction.accountId
      })

      const nextAccount = accounts.find((account) => {
        return account.id === savedTransaction.accountId
      })

      if (previousTransaction.accountId === savedTransaction.accountId) {
        if (nextAccount) {
          await editAccountBalance(
            nextAccount.id,
            nextAccount.balance - previousVariation + nextVariation,
          )
        }
      } else {
        if (previousAccount) {
          await editAccountBalance(
            previousAccount.id,
            previousAccount.balance - previousVariation,
          )
        }

        if (nextAccount) {
          await editAccountBalance(
            nextAccount.id,
            nextAccount.balance + nextVariation,
          )
        }
      }

      setTransactions((currentTransactions) =>
        currentTransactions.map((transaction) => {
          if (transaction.id !== savedTransaction.id) {
            return transaction
          }

          return savedTransaction
        }),
      )

      setAccounts((currentAccounts) =>
        currentAccounts.map((account) => {
          let nextBalance = account.balance

          if (account.id === previousTransaction.accountId) {
            nextBalance -= previousVariation
          }

          if (account.id === savedTransaction.accountId) {
            nextBalance += nextVariation
          }

          return {
            ...account,
            balance: nextBalance,
          }
        }),
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

      const balanceVariation =
        getTransactionBalanceVariation(transactionToDelete)

      const accountToUpdate = accounts.find((account) => {
        return account.id === transactionToDelete.accountId
      })

      if (accountToUpdate) {
        await editAccountBalance(
          accountToUpdate.id,
          accountToUpdate.balance - balanceVariation,
        )
      }

      setTransactions((currentTransactions) =>
        currentTransactions.filter((transaction) => {
          return transaction.id !== transactionId
        }),
      )

      setAccounts((currentAccounts) =>
        updateAccountBalanceInList(
          currentAccounts,
          transactionToDelete.accountId,
          -balanceVariation,
        ),
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
    deleteSavingGoal,

    addSinkingFund,
    updateSinkingFund,
    updateSinkingFundAmount,
    deleteSinkingFund,

    addDebt,
    updateDebt,
    updateDebtRemainingAmount,
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
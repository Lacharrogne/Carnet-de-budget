import { supabase } from '../lib/supabaseClient'
import type {
  BudgetCategoryId,
  Transaction,
  TransactionType,
} from '../types/budget'

type TransactionRow = {
  id: string
  user_id: string
  account_id: string
  to_account_id: string | null
  linked_debt_id: string | null
  linked_saving_goal_id: string | null
  linked_sinking_fund_id: string | null
  title: string
  amount: number | string
  type: TransactionType
  category: BudgetCategoryId
  date: string
  note: string | null
  is_recurring: boolean
}

function mapTransactionFromRow(row: TransactionRow): Transaction {
  return {
    id: row.id,
    title: row.title,
    amount: Number(row.amount),
    type: row.type,
    category: row.category,
    accountId: row.account_id,
    toAccountId: row.to_account_id ?? undefined,
    linkedDebtId: row.linked_debt_id ?? undefined,
    linkedSavingGoalId: row.linked_saving_goal_id ?? undefined,
    linkedSinkingFundId: row.linked_sinking_fund_id ?? undefined,
    date: row.date,
    note: row.note ?? undefined,
    isRecurring: row.is_recurring,
  }
}

export async function fetchTransactions(userId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) =>
    mapTransactionFromRow(row as TransactionRow),
  )
}

export async function createTransaction(
  userId: string,
  transaction: Transaction,
) {
  const isTransfer = transaction.type === 'transfer'

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      account_id: transaction.accountId,
      to_account_id: isTransfer ? transaction.toAccountId ?? null : null,
      linked_debt_id: transaction.linkedDebtId ?? null,
      linked_saving_goal_id: transaction.linkedSavingGoalId ?? null,
      linked_sinking_fund_id: transaction.linkedSinkingFundId ?? null,
      title: transaction.title,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      date: transaction.date,
      note: transaction.note ?? null,
      is_recurring: isTransfer ? false : transaction.isRecurring ?? false,
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return mapTransactionFromRow(data as TransactionRow)
}

export async function editTransaction(transaction: Transaction) {
  const isTransfer = transaction.type === 'transfer'

  const { data, error } = await supabase
    .from('transactions')
    .update({
      account_id: transaction.accountId,
      to_account_id: isTransfer ? transaction.toAccountId ?? null : null,
      linked_debt_id: transaction.linkedDebtId ?? null,
      linked_saving_goal_id: transaction.linkedSavingGoalId ?? null,
      linked_sinking_fund_id: transaction.linkedSinkingFundId ?? null,
      title: transaction.title,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      date: transaction.date,
      note: transaction.note ?? null,
      is_recurring: isTransfer ? false : transaction.isRecurring ?? false,
    })
    .eq('id', transaction.id)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return mapTransactionFromRow(data as TransactionRow)
}

export async function removeTransaction(transactionId: string) {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId)

  if (error) {
    throw error
  }
}
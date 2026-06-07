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
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      account_id: transaction.accountId,
      title: transaction.title,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      date: transaction.date,
      note: transaction.note ?? null,
      is_recurring: transaction.isRecurring ?? false,
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return mapTransactionFromRow(data as TransactionRow)
}

export async function editTransaction(transaction: Transaction) {
  const { data, error } = await supabase
    .from('transactions')
    .update({
      account_id: transaction.accountId,
      title: transaction.title,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      date: transaction.date,
      note: transaction.note ?? null,
      is_recurring: transaction.isRecurring ?? false,
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
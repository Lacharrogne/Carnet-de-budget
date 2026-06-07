import { supabase } from '../lib/supabaseClient'
import type { Debt } from '../types/debt'

type DebtRow = {
  id: string
  user_id: string
  title: string
  emoji: string
  total_amount: number | string
  remaining_amount: number | string
  monthly_payment: number | string
  interest_rate: number | string
}

function mapDebtFromRow(row: DebtRow): Debt {
  return {
    id: row.id,
    title: row.title,
    emoji: row.emoji,
    totalAmount: Number(row.total_amount),
    remainingAmount: Number(row.remaining_amount),
    monthlyPayment: Number(row.monthly_payment),
    interestRate: Number(row.interest_rate),
  }
}

export async function fetchDebts(userId: string) {
  const { data, error } = await supabase
    .from('debts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => mapDebtFromRow(row as DebtRow))
}

export async function createDebt(userId: string, debt: Debt) {
  const { data, error } = await supabase
    .from('debts')
    .insert({
      user_id: userId,
      title: debt.title,
      emoji: debt.emoji,
      total_amount: debt.totalAmount,
      remaining_amount: debt.remainingAmount,
      monthly_payment: debt.monthlyPayment,
      interest_rate: debt.interestRate,
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return mapDebtFromRow(data as DebtRow)
}

export async function editDebt(debt: Debt) {
  const { data, error } = await supabase
    .from('debts')
    .update({
      title: debt.title,
      emoji: debt.emoji,
      total_amount: debt.totalAmount,
      remaining_amount: debt.remainingAmount,
      monthly_payment: debt.monthlyPayment,
      interest_rate: debt.interestRate,
    })
    .eq('id', debt.id)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return mapDebtFromRow(data as DebtRow)
}

export async function removeDebt(debtId: string) {
  const { error } = await supabase.from('debts').delete().eq('id', debtId)

  if (error) {
    throw error
  }
}
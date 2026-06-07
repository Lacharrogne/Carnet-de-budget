import { supabase } from '../lib/supabaseClient'
import type { BudgetCategoryId, RecurringPayment } from '../types/budget'

type RecurringPaymentRow = {
  id: string
  user_id: string
  account_id: string
  title: string
  amount: number | string
  category: BudgetCategoryId
  day_of_month: number
  is_active: boolean
}

function mapRecurringPaymentFromRow(
  row: RecurringPaymentRow,
): RecurringPayment {
  return {
    id: row.id,
    title: row.title,
    amount: Number(row.amount),
    category: row.category,
    accountId: row.account_id,
    dayOfMonth: row.day_of_month,
    isActive: row.is_active,
  }
}

export async function fetchRecurringPayments(userId: string) {
  const { data, error } = await supabase
    .from('recurring_payments')
    .select('*')
    .eq('user_id', userId)
    .order('day_of_month', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) =>
    mapRecurringPaymentFromRow(row as RecurringPaymentRow),
  )
}

export async function createRecurringPayment(
  userId: string,
  payment: RecurringPayment,
) {
  const { data, error } = await supabase
    .from('recurring_payments')
    .insert({
      user_id: userId,
      account_id: payment.accountId,
      title: payment.title,
      amount: payment.amount,
      category: payment.category,
      day_of_month: payment.dayOfMonth,
      is_active: payment.isActive,
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return mapRecurringPaymentFromRow(data as RecurringPaymentRow)
}

export async function editRecurringPayment(payment: RecurringPayment) {
  const { data, error } = await supabase
    .from('recurring_payments')
    .update({
      account_id: payment.accountId,
      title: payment.title,
      amount: payment.amount,
      category: payment.category,
      day_of_month: payment.dayOfMonth,
      is_active: payment.isActive,
    })
    .eq('id', payment.id)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return mapRecurringPaymentFromRow(data as RecurringPaymentRow)
}

export async function removeRecurringPayment(paymentId: string) {
  const { error } = await supabase
    .from('recurring_payments')
    .delete()
    .eq('id', paymentId)

  if (error) {
    throw error
  }
}
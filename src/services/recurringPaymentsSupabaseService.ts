import { supabase } from '../lib/supabaseClient'
import type {
  BudgetCategoryId,
  RecurringPayment,
  RecurringType,
} from '../types/budget'

type RecurringPaymentRow = {
  id: string
  user_id: string
  account_id: string
  title: string
  amount: number | string
  category: BudgetCategoryId
  day_of_month: number
  is_active: boolean
  // Colonne ajoutée par migration ; peut être absente sur d'anciens schémas.
  type?: RecurringType | null
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
    type: row.type === 'income' ? 'income' : 'expense',
  }
}

/**
 * Vrai si l'erreur Supabase signale l'absence de la colonne `type`
 * (migration pas encore appliquée).
 */
function isMissingTypeColumn(error: {
  code?: string
  message?: string
} | null) {
  if (!error) {
    return false
  }

  // 42703 = undefined column (Postgres) ; PGRST204 = colonne absente du cache
  // de schéma (PostgREST). Le nom de colonne apparaît entre guillemets dans
  // les deux messages (« 'type' » / « "type" »).
  return (
    ((error.code === '42703' || error.code === 'PGRST204') &&
      /["']type["']/.test(error.message ?? '')) ||
    /["']type["'].*(column|colonne|schema cache)/i.test(error.message ?? '')
  )
}

const MISSING_TYPE_MESSAGE =
  'Pour gérer les revenus récurrents, ajoutez la colonne « type » à la table recurring_payments (voir supabase/migrations).'

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
  const base = {
    user_id: userId,
    account_id: payment.accountId,
    title: payment.title,
    amount: payment.amount,
    category: payment.category,
    day_of_month: payment.dayOfMonth,
    is_active: payment.isActive,
  }

  const { data, error } = await supabase
    .from('recurring_payments')
    .insert({ ...base, type: payment.type })
    .select('*')
    .single()

  if (error) {
    // Schéma sans colonne `type` : on garde le flux des charges fonctionnel,
    // mais un revenu ne peut pas être enregistré correctement.
    if (isMissingTypeColumn(error)) {
      if (payment.type === 'income') {
        throw new Error(MISSING_TYPE_MESSAGE)
      }

      const fallback = await supabase
        .from('recurring_payments')
        .insert(base)
        .select('*')
        .single()

      if (fallback.error) {
        throw fallback.error
      }

      return mapRecurringPaymentFromRow(fallback.data as RecurringPaymentRow)
    }

    throw error
  }

  return mapRecurringPaymentFromRow(data as RecurringPaymentRow)
}

export async function editRecurringPayment(payment: RecurringPayment) {
  const base = {
    account_id: payment.accountId,
    title: payment.title,
    amount: payment.amount,
    category: payment.category,
    day_of_month: payment.dayOfMonth,
    is_active: payment.isActive,
  }

  const { data, error } = await supabase
    .from('recurring_payments')
    .update({ ...base, type: payment.type })
    .eq('id', payment.id)
    .select('*')
    .single()

  if (error) {
    if (isMissingTypeColumn(error)) {
      if (payment.type === 'income') {
        throw new Error(MISSING_TYPE_MESSAGE)
      }

      const fallback = await supabase
        .from('recurring_payments')
        .update(base)
        .eq('id', payment.id)
        .select('*')
        .single()

      if (fallback.error) {
        throw fallback.error
      }

      return mapRecurringPaymentFromRow(fallback.data as RecurringPaymentRow)
    }

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

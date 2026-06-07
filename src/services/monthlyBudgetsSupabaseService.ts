import { supabase } from '../lib/supabaseClient'
import type { BudgetCategoryId, MonthlyBudget } from '../types/budget'

type MonthlyBudgetRow = {
  id: string
  user_id: string
  category: BudgetCategoryId
  limit_amount: number | string
  month: string
}

function mapMonthlyBudgetFromRow(row: MonthlyBudgetRow): MonthlyBudget {
  return {
    id: row.id,
    category: row.category,
    limit: Number(row.limit_amount),
    month: row.month,
  }
}

export async function fetchMonthlyBudgets(userId: string) {
  const { data, error } = await supabase
    .from('monthly_budgets')
    .select('*')
    .eq('user_id', userId)
    .order('month', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) =>
    mapMonthlyBudgetFromRow(row as MonthlyBudgetRow),
  )
}

export async function saveMonthlyBudget(
  userId: string,
  category: BudgetCategoryId,
  limit: number,
  month: string,
) {
  const { data, error } = await supabase
    .from('monthly_budgets')
    .upsert(
      {
        user_id: userId,
        category,
        limit_amount: limit,
        month,
      },
      {
        onConflict: 'user_id,category,month',
      },
    )
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return mapMonthlyBudgetFromRow(data as MonthlyBudgetRow)
}

export async function removeMonthlyBudgetsForUser(userId: string) {
  const { error } = await supabase
    .from('monthly_budgets')
    .delete()
    .eq('user_id', userId)

  if (error) {
    throw error
  }
}
import { supabase } from '../lib/supabaseClient'
import type { Investment, InvestmentType } from '../types/investment'

type InvestmentRow = {
  id: string
  user_id: string
  title: string
  emoji: string
  type: InvestmentType
  platform: string
  invested_amount: number | string
  current_value: number | string
  note: string | null
}

function mapInvestmentFromRow(row: InvestmentRow): Investment {
  return {
    id: row.id,
    title: row.title,
    emoji: row.emoji,
    type: row.type,
    platform: row.platform,
    investedAmount: Number(row.invested_amount),
    currentValue: Number(row.current_value),
    note: row.note ?? undefined,
  }
}

export async function fetchInvestments(userId: string) {
  const { data, error } = await supabase
    .from('investments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => mapInvestmentFromRow(row as InvestmentRow))
}

export async function createInvestment(
  userId: string,
  investment: Investment,
) {
  const { data, error } = await supabase
    .from('investments')
    .insert({
      user_id: userId,
      title: investment.title,
      emoji: investment.emoji,
      type: investment.type,
      platform: investment.platform,
      invested_amount: investment.investedAmount,
      current_value: investment.currentValue,
      note: investment.note ?? null,
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return mapInvestmentFromRow(data as InvestmentRow)
}

export async function editInvestment(investment: Investment) {
  const { data, error } = await supabase
    .from('investments')
    .update({
      title: investment.title,
      emoji: investment.emoji,
      type: investment.type,
      platform: investment.platform,
      invested_amount: investment.investedAmount,
      current_value: investment.currentValue,
      note: investment.note ?? null,
    })
    .eq('id', investment.id)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return mapInvestmentFromRow(data as InvestmentRow)
}

export async function removeInvestment(investmentId: string) {
  const { error } = await supabase
    .from('investments')
    .delete()
    .eq('id', investmentId)

  if (error) {
    throw error
  }
}
import { supabase } from '../lib/supabaseClient'
import type { SavingGoal, SinkingFund } from '../types/budget'

type SavingGoalRow = {
  id: string
  user_id: string
  title: string
  emoji: string
  target_amount: number | string
  current_amount: number | string
  deadline: string | null
}

type SinkingFundRow = {
  id: string
  user_id: string
  title: string
  emoji: string
  target_amount: number | string
  current_amount: number | string
  monthly_contribution: number | string
}

function mapSavingGoalFromRow(row: SavingGoalRow): SavingGoal {
  return {
    id: row.id,
    title: row.title,
    emoji: row.emoji,
    targetAmount: Number(row.target_amount),
    currentAmount: Number(row.current_amount),
    deadline: row.deadline ?? undefined,
  }
}

function mapSinkingFundFromRow(row: SinkingFundRow): SinkingFund {
  return {
    id: row.id,
    title: row.title,
    emoji: row.emoji,
    targetAmount: Number(row.target_amount),
    currentAmount: Number(row.current_amount),
    monthlyContribution: Number(row.monthly_contribution),
  }
}

export async function fetchSavingGoals(userId: string) {
  const { data, error } = await supabase
    .from('saving_goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => mapSavingGoalFromRow(row as SavingGoalRow))
}

export async function createSavingGoal(userId: string, goal: SavingGoal) {
  const { data, error } = await supabase
    .from('saving_goals')
    .insert({
      user_id: userId,
      title: goal.title,
      emoji: goal.emoji,
      target_amount: goal.targetAmount,
      current_amount: goal.currentAmount,
      deadline: goal.deadline ?? null,
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return mapSavingGoalFromRow(data as SavingGoalRow)
}

export async function editSavingGoal(goal: SavingGoal) {
  const { data, error } = await supabase
    .from('saving_goals')
    .update({
      title: goal.title,
      emoji: goal.emoji,
      target_amount: goal.targetAmount,
      current_amount: goal.currentAmount,
      deadline: goal.deadline ?? null,
    })
    .eq('id', goal.id)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return mapSavingGoalFromRow(data as SavingGoalRow)
}

export async function removeSavingGoal(goalId: string) {
  const { error } = await supabase
    .from('saving_goals')
    .delete()
    .eq('id', goalId)

  if (error) {
    throw error
  }
}

export async function removeSavingGoalsForUser(userId: string) {
  const { error } = await supabase
    .from('saving_goals')
    .delete()
    .eq('user_id', userId)

  if (error) {
    throw error
  }
}

export async function fetchSinkingFunds(userId: string) {
  const { data, error } = await supabase
    .from('sinking_funds')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => mapSinkingFundFromRow(row as SinkingFundRow))
}

export async function createSinkingFund(userId: string, fund: SinkingFund) {
  const { data, error } = await supabase
    .from('sinking_funds')
    .insert({
      user_id: userId,
      title: fund.title,
      emoji: fund.emoji,
      target_amount: fund.targetAmount,
      current_amount: fund.currentAmount,
      monthly_contribution: fund.monthlyContribution,
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return mapSinkingFundFromRow(data as SinkingFundRow)
}

export async function editSinkingFund(fund: SinkingFund) {
  const { data, error } = await supabase
    .from('sinking_funds')
    .update({
      title: fund.title,
      emoji: fund.emoji,
      target_amount: fund.targetAmount,
      current_amount: fund.currentAmount,
      monthly_contribution: fund.monthlyContribution,
    })
    .eq('id', fund.id)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return mapSinkingFundFromRow(data as SinkingFundRow)
}

export async function removeSinkingFund(fundId: string) {
  const { error } = await supabase
    .from('sinking_funds')
    .delete()
    .eq('id', fundId)

  if (error) {
    throw error
  }
}

export async function removeSinkingFundsForUser(userId: string) {
  const { error } = await supabase
    .from('sinking_funds')
    .delete()
    .eq('user_id', userId)

  if (error) {
    throw error
  }
}
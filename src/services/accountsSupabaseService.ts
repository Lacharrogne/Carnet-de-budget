import { supabase } from '../lib/supabaseClient'
import type { Account, AccountType } from '../types/budget'

type AccountRow = {
  id: string
  user_id: string
  name: string
  type: AccountType
  balance: number | string
  emoji: string
  color_class: string
}

function mapAccountFromRow(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    balance: Number(row.balance),
    emoji: row.emoji,
    colorClass: row.color_class,
  }
}

export async function fetchAccounts(userId: string) {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => mapAccountFromRow(row as AccountRow))
}

export async function createAccount(userId: string, account: Account) {
  const { data, error } = await supabase
    .from('accounts')
    .insert({
      user_id: userId,
      name: account.name,
      type: account.type,
      balance: account.balance,
      emoji: account.emoji,
      color_class: account.colorClass,
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return mapAccountFromRow(data as AccountRow)
}

export async function editAccount(account: Account) {
  const { data, error } = await supabase
    .from('accounts')
    .update({
      name: account.name,
      type: account.type,
      balance: account.balance,
      emoji: account.emoji,
      color_class: account.colorClass,
    })
    .eq('id', account.id)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return mapAccountFromRow(data as AccountRow)
}

export async function editAccountBalance(accountId: string, balance: number) {
  const { data, error } = await supabase
    .from('accounts')
    .update({
      balance,
    })
    .eq('id', accountId)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return mapAccountFromRow(data as AccountRow)
}

export async function removeAccount(accountId: string) {
  const { error } = await supabase.from('accounts').delete().eq('id', accountId)

  if (error) {
    throw error
  }
}
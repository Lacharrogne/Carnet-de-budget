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
  // Colonne ajoutée par migration ; peut être absente sur d'anciens schémas.
  holder?: string | null
}

function mapAccountFromRow(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    balance: Number(row.balance),
    emoji: row.emoji,
    colorClass: row.color_class,
    holder: row.holder ?? '',
  }
}

/** Vrai si l'erreur signale l'absence de la colonne `holder` (migration non faite). */
function isMissingHolderColumn(error: {
  code?: string
  message?: string
} | null) {
  if (!error) {
    return false
  }

  return (
    ((error.code === '42703' || error.code === 'PGRST204') &&
      /holder/i.test(error.message ?? '')) ||
    /["']holder["']/.test(error.message ?? '')
  )
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
  const base = {
    user_id: userId,
    name: account.name,
    type: account.type,
    balance: account.balance,
    emoji: account.emoji,
    color_class: account.colorClass,
  }

  const { data, error } = await supabase
    .from('accounts')
    .insert({ ...base, holder: account.holder })
    .select('*')
    .single()

  if (error) {
    // Schéma sans colonne `holder` : on crée quand même le compte (titulaire
    // simplement non enregistré tant que la migration n'est pas appliquée).
    if (isMissingHolderColumn(error)) {
      const fallback = await supabase
        .from('accounts')
        .insert(base)
        .select('*')
        .single()

      if (fallback.error) {
        throw fallback.error
      }

      return mapAccountFromRow(fallback.data as AccountRow)
    }

    throw error
  }

  return mapAccountFromRow(data as AccountRow)
}

export async function editAccount(account: Account) {
  const base = {
    name: account.name,
    type: account.type,
    balance: account.balance,
    emoji: account.emoji,
    color_class: account.colorClass,
  }

  const { data, error } = await supabase
    .from('accounts')
    .update({ ...base, holder: account.holder })
    .eq('id', account.id)
    .select('*')
    .single()

  if (error) {
    if (isMissingHolderColumn(error)) {
      const fallback = await supabase
        .from('accounts')
        .update(base)
        .eq('id', account.id)
        .select('*')
        .single()

      if (fallback.error) {
        throw fallback.error
      }

      return mapAccountFromRow(fallback.data as AccountRow)
    }

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

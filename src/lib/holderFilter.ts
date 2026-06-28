import type { Account, Transaction } from '../types/budget'

/** Valeur du filtre : 'all' = tous, sinon le nom du titulaire. */
export type HolderFilterValue = string

export const ALL_HOLDERS = 'all'
export const COMMON_HOLDER = 'Commun'

/** Titulaire affiché d'un compte (les comptes sans titulaire = « Commun »). */
export function accountHolderLabel(account: Account): string {
  return account.holder.trim() || COMMON_HOLDER
}

/** Liste triée des titulaires distincts présents sur les comptes. */
export function getDistinctHolders(accounts: Account[]): string[] {
  return Array.from(
    new Set(accounts.map((account) => accountHolderLabel(account))),
  ).sort((a, b) => a.localeCompare(b))
}

/** Comptes correspondant au filtre titulaire sélectionné. */
export function filterAccountsByHolder(
  accounts: Account[],
  holder: HolderFilterValue,
): Account[] {
  if (holder === ALL_HOLDERS) {
    return accounts
  }

  return accounts.filter((account) => accountHolderLabel(account) === holder)
}

/**
 * Transactions rattachées au titulaire : une transaction « appartient » au
 * titulaire de son compte (et, pour un virement, aussi du compte destinataire).
 */
export function filterTransactionsByHolder(
  transactions: Transaction[],
  accounts: Account[],
  holder: HolderFilterValue,
): Transaction[] {
  if (holder === ALL_HOLDERS) {
    return transactions
  }

  const ids = new Set(
    filterAccountsByHolder(accounts, holder).map((account) => account.id),
  )

  return transactions.filter(
    (transaction) =>
      ids.has(transaction.accountId) ||
      (transaction.toAccountId ? ids.has(transaction.toAccountId) : false),
  )
}

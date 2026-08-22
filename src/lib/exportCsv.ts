import type { Account, BudgetCategory, Transaction } from '../types/budget'

/**
 * Export CSV « maison » (sans dépendance), pensé pour Excel/LibreOffice en
 * français : séparateur point-virgule, décimales à la virgule, et BOM UTF-8
 * pour que les accents s'affichent correctement.
 */

const TYPE_LABELS: Record<Transaction['type'], string> = {
  income: 'Revenu',
  expense: 'Dépense',
  transfer: 'Virement',
}

/** Échappe une cellule (guillemets doublés si nécessaire). */
function escapeCell(value: string): string {
  const needsQuotes = /[";\n]/.test(value)
  const escaped = value.replace(/"/g, '""')
  return needsQuotes ? `"${escaped}"` : escaped
}

/** Montant en texte à décimale virgule (« 12,50 »). */
function formatAmount(amount: number): string {
  return amount.toFixed(2).replace('.', ',')
}

function toCsv(header: string[], rows: string[][]): string {
  const lines = [header, ...rows].map((cells) => cells.map(escapeCell).join(';'))
  // BOM UTF-8 pour Excel.
  return '﻿' + lines.join('\r\n')
}

/** Déclenche le téléchargement d'un fichier texte dans le navigateur. */
function download(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Exporte les transactions au format CSV et lance le téléchargement. */
export function exportTransactionsCsv(
  transactions: Transaction[],
  accounts: Account[],
  categories: BudgetCategory[],
) {
  const accountName = (id: string | undefined) =>
    accounts.find((account) => account.id === id)?.name ?? ''
  const categoryName = (id: string) =>
    categories.find((category) => category.id === id)?.name ?? id

  const header = [
    'Date',
    'Titre',
    'Type',
    'Catégorie',
    'Compte',
    'Vers le compte',
    'Montant',
    'Note',
  ]

  const rows = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((transaction) => [
      transaction.date,
      transaction.title,
      TYPE_LABELS[transaction.type],
      categoryName(transaction.category),
      accountName(transaction.accountId),
      accountName(transaction.toAccountId),
      formatAmount(transaction.amount),
      transaction.note ?? '',
    ])

  download(`transactions-${todayStamp()}.csv`, toCsv(header, rows))
}

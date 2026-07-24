import type { Transaction } from '../types/budget'
import { formatCurrency } from '../utils/formatCurrency'

/**
 * Service d'export des données — sans dépendance externe.
 *
 * - CSV : compatible Excel/Numbers/Sheets en français (séparateur « ; »,
 *   décimale « , », BOM UTF-8 pour les accents).
 * - PDF : via la fenêtre d'impression du navigateur (« Enregistrer en PDF »),
 *   avec une mise en page soignée et aux couleurs du carnet.
 */

export type ExportRow = {
  date: string
  title: string
  typeLabel: string
  category: string
  account: string
  toAccount: string
  amount: number
  type: Transaction['type']
  note: string
}

export type TransactionExportHelpers = {
  getAccountName: (accountId?: string) => string
  getCategoryName: (transaction: Transaction) => string
}

const TYPE_LABELS: Record<Transaction['type'], string> = {
  income: 'Revenu',
  expense: 'Dépense',
  transfer: 'Virement',
}

/** Date ISO (AAAA-MM-JJ) → JJ/MM/AAAA, sans dépendre du fuseau horaire. */
function formatDateFr(isoDate: string) {
  const [year, month, day] = isoDate.split('-')

  if (!year || !month || !day) {
    return isoDate
  }

  return `${day}/${month}/${year}`
}

export function buildTransactionRows(
  transactions: Transaction[],
  { getAccountName, getCategoryName }: TransactionExportHelpers,
): ExportRow[] {
  return transactions.map((transaction) => ({
    date: transaction.date,
    title: transaction.title,
    typeLabel: TYPE_LABELS[transaction.type],
    category: getCategoryName(transaction),
    account: getAccountName(transaction.accountId),
    toAccount:
      transaction.type === 'transfer'
        ? getAccountName(transaction.toAccountId)
        : '',
    amount: transaction.amount,
    type: transaction.type,
    note: transaction.note ?? '',
  }))
}

function escapeCsv(value: string | number) {
  const text = String(value)

  if (/[";\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }

  return text
}

/** Montant à la française pour tableur : « 1 234,56 » → « 1234,56 ». */
function amountForCsv(amount: number) {
  return amount.toFixed(2).replace('.', ',')
}

export function transactionsToCsv(rows: ExportRow[]) {
  const headers = [
    'Date',
    'Titre',
    'Type',
    'Catégorie',
    'Compte',
    'Compte destinataire',
    'Montant (€)',
    'Note',
  ]

  const lines = rows.map((row) =>
    [
      formatDateFr(row.date),
      row.title,
      row.typeLabel,
      row.category,
      row.account,
      row.toAccount,
      amountForCsv(row.amount),
      row.note,
    ]
      .map(escapeCsv)
      .join(';'),
  )

  return [headers.join(';'), ...lines].join('\r\n')
}

export function downloadTextFile(
  filename: string,
  content: string,
  mimeType = 'text/plain;charset=utf-8',
) {
  // BOM UTF-8 pour qu'Excel ouvre correctement les accents.
  const blob = new Blob(['﻿', content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

export function buildExportFilename(prefix: string, extension: string) {
  const now = new Date()
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(now.getDate()).padStart(2, '0')}`

  return `${prefix}-${stamp}.${extension}`
}

export function exportTransactionsToCsv(
  rows: ExportRow[],
  prefix = 'carnet-de-budget-transactions',
) {
  downloadTextFile(
    buildExportFilename(prefix, 'csv'),
    transactionsToCsv(rows),
    'text/csv;charset=utf-8',
  )
}

export type ReportTotals = {
  income: number
  expenses: number
  net: number
}

function escapeHtml(value: string | number) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

const AMOUNT_COLORS: Record<Transaction['type'], string> = {
  income: '#31633a',
  expense: '#a8552f',
  transfer: '#3f6f9e',
}

function amountSign(type: Transaction['type']) {
  if (type === 'income') return '+'
  if (type === 'expense') return '−'
  return ''
}

/**
 * Ouvre un aperçu imprimable (→ « Enregistrer en PDF ») au style du carnet.
 * Retourne false si la fenêtre a été bloquée par le navigateur.
 */
export function exportTransactionsToPdf({
  rows,
  totals,
  title = 'Carnet de budget',
  subtitle,
}: {
  rows: ExportRow[]
  totals: ReportTotals
  title?: string
  subtitle?: string
}) {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer')

  if (!printWindow) {
    return false
  }

  const generatedAt = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'long',
  }).format(new Date())

  const bodyRows = rows
    .map(
      (row) => `
        <tr>
          <td class="muted">${escapeHtml(formatDateFr(row.date))}</td>
          <td><strong>${escapeHtml(row.title)}</strong>${
            row.note ? `<div class="note">${escapeHtml(row.note)}</div>` : ''
          }</td>
          <td>${escapeHtml(row.category)}</td>
          <td class="muted">${escapeHtml(
            row.toAccount ? `${row.account} → ${row.toAccount}` : row.account,
          )}</td>
          <td class="amount" style="color:${AMOUNT_COLORS[row.type]}">${amountSign(
            row.type,
          )}${escapeHtml(formatCurrency(row.amount))}</td>
        </tr>`,
    )
    .join('')

  printWindow.document.write(`<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)} — Export</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: "Mulish", "Segoe UI", system-ui, -apple-system, sans-serif;
    color: #221f1a;
    margin: 32px;
    background: #fff;
  }
  header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #e8e0d1; padding-bottom: 16px; margin-bottom: 20px; }
  h1 { font-family: Fraunces, Georgia, serif; font-size: 24px; margin: 0; color: #1e3623; }
  .subtitle { color: #79736a; font-size: 13px; margin-top: 4px; }
  .meta { text-align: right; color: #79736a; font-size: 12px; }
  .totals { display: flex; gap: 12px; margin-bottom: 22px; }
  .total { flex: 1; border: 1px solid #e8e0d1; border-radius: 14px; padding: 12px 14px; }
  .total .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #99896c; }
  .total .value { font-size: 20px; font-weight: 800; margin-top: 4px; font-variant-numeric: tabular-nums; }
  table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  th { text-align: left; text-transform: uppercase; letter-spacing: 0.06em; font-size: 10.5px; color: #99896c; border-bottom: 1px solid #e8e0d1; padding: 8px 10px; }
  td { padding: 9px 10px; border-bottom: 1px solid #f3eee3; vertical-align: top; }
  td.amount { text-align: right; font-weight: 700; white-space: nowrap; font-variant-numeric: tabular-nums; }
  td.muted { color: #79736a; }
  .note { color: #99896c; font-size: 11px; margin-top: 2px; }
  footer { margin-top: 24px; color: #99896c; font-size: 11px; text-align: center; }
  @media print { body { margin: 12mm; } @page { margin: 12mm; } }
</style>
</head>
<body>
  <header>
    <div>
      <h1>${escapeHtml(title)}</h1>
      <div class="subtitle">${escapeHtml(subtitle ?? 'Export de vos transactions')}</div>
    </div>
    <div class="meta">Généré le ${escapeHtml(generatedAt)}<br/>${rows.length} transaction${
      rows.length > 1 ? 's' : ''
    }</div>
  </header>

  <div class="totals">
    <div class="total"><div class="label">Revenus</div><div class="value" style="color:#31633a">${escapeHtml(
      formatCurrency(totals.income),
    )}</div></div>
    <div class="total"><div class="label">Dépenses</div><div class="value" style="color:#a8552f">${escapeHtml(
      formatCurrency(totals.expenses),
    )}</div></div>
    <div class="total"><div class="label">Solde net</div><div class="value">${escapeHtml(
      formatCurrency(totals.net),
    )}</div></div>
  </div>

  <table>
    <thead>
      <tr><th>Date</th><th>Libellé</th><th>Catégorie</th><th>Compte</th><th style="text-align:right">Montant</th></tr>
    </thead>
    <tbody>${bodyRows}</tbody>
  </table>

  <footer>Carnet de budget — votre argent, enfin clair.</footer>
</body>
</html>`)

  printWindow.document.close()
  printWindow.focus()

  // Laisse le DOM se peindre avant d'ouvrir la boîte d'impression.
  printWindow.setTimeout(() => printWindow.print(), 250)

  return true
}

/* ------------------------------------------------------------------- */
/* Relevé mensuel — récapitulatif par catégorie                        */
/* ------------------------------------------------------------------- */

export type MonthlyCategoryRow = {
  categoryName: string
  emoji: string
  income: number
  expenses: number
}

export type MonthlyReportMeta = {
  monthKey: string
  monthLabel: string
  holderLabel: string
  totals: ReportTotals
}

export function monthlyReportToCsv(
  rows: MonthlyCategoryRow[],
  { monthLabel, holderLabel, totals }: MonthlyReportMeta,
) {
  const preamble = [
    ['Relevé mensuel', monthLabel].map(escapeCsv).join(';'),
    ['Personne', holderLabel].map(escapeCsv).join(';'),
    '',
  ]

  const headers = ['Catégorie', 'Revenus (€)', 'Dépenses (€)', 'Solde (€)']

  const lines = rows.map((row) =>
    [
      row.categoryName,
      amountForCsv(row.income),
      amountForCsv(row.expenses),
      amountForCsv(row.income - row.expenses),
    ]
      .map(escapeCsv)
      .join(';'),
  )

  const totalLine = [
    'Total',
    amountForCsv(totals.income),
    amountForCsv(totals.expenses),
    amountForCsv(totals.net),
  ]
    .map(escapeCsv)
    .join(';')

  return [...preamble, headers.join(';'), ...lines, totalLine].join('\r\n')
}

export function exportMonthlyReportToCsv(
  rows: MonthlyCategoryRow[],
  meta: MonthlyReportMeta,
) {
  downloadTextFile(
    `carnet-de-budget-releve-${meta.monthKey}.csv`,
    monthlyReportToCsv(rows, meta),
    'text/csv;charset=utf-8',
  )
}

/**
 * Ouvre un relevé mensuel imprimable (→ « Enregistrer en PDF ») : totaux du
 * mois et récapitulatif par catégorie. Retourne false si la fenêtre a été
 * bloquée par le navigateur.
 */
export function exportMonthlyReportToPdf(
  rows: MonthlyCategoryRow[],
  { monthLabel, holderLabel, totals }: MonthlyReportMeta,
) {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer')

  if (!printWindow) {
    return false
  }

  const generatedAt = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'long',
  }).format(new Date())

  const savingsRate =
    totals.income > 0 ? Math.round((totals.net / totals.income) * 100) : null

  const bodyRows = rows
    .map((row) => {
      const net = row.income - row.expenses
      const expenseShare =
        totals.expenses > 0
          ? Math.round((row.expenses / totals.expenses) * 100)
          : 0

      return `
        <tr>
          <td><strong>${escapeHtml(row.emoji)} ${escapeHtml(
            row.categoryName,
          )}</strong></td>
          <td class="amount" style="color:#31633a">${
            row.income > 0 ? escapeHtml(formatCurrency(row.income)) : '—'
          }</td>
          <td class="amount" style="color:#a8552f">${
            row.expenses > 0 ? escapeHtml(formatCurrency(row.expenses)) : '—'
          }</td>
          <td class="amount">${escapeHtml(formatCurrency(net))}</td>
          <td class="muted" style="text-align:right">${
            row.expenses > 0 ? `${expenseShare}&nbsp;%` : '—'
          }</td>
        </tr>`
    })
    .join('')

  printWindow.document.write(`<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Relevé mensuel — ${escapeHtml(monthLabel)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: "Mulish", "Segoe UI", system-ui, -apple-system, sans-serif;
    color: #221f1a;
    margin: 32px;
    background: #fff;
  }
  header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #e8e0d1; padding-bottom: 16px; margin-bottom: 20px; }
  h1 { font-family: Fraunces, Georgia, serif; font-size: 24px; margin: 0; color: #1e3623; }
  .subtitle { color: #79736a; font-size: 13px; margin-top: 4px; }
  .meta { text-align: right; color: #79736a; font-size: 12px; }
  .totals { display: flex; gap: 12px; margin-bottom: 22px; }
  .total { flex: 1; border: 1px solid #e8e0d1; border-radius: 14px; padding: 12px 14px; }
  .total .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #99896c; }
  .total .value { font-size: 20px; font-weight: 800; margin-top: 4px; font-variant-numeric: tabular-nums; }
  table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  th { text-align: left; text-transform: uppercase; letter-spacing: 0.06em; font-size: 10.5px; color: #99896c; border-bottom: 1px solid #e8e0d1; padding: 8px 10px; }
  td { padding: 9px 10px; border-bottom: 1px solid #f3eee3; vertical-align: top; }
  td.amount { text-align: right; font-weight: 700; white-space: nowrap; font-variant-numeric: tabular-nums; }
  td.muted { color: #79736a; }
  tfoot td { font-weight: 800; border-top: 2px solid #e8e0d1; border-bottom: none; }
  footer { margin-top: 24px; color: #99896c; font-size: 11px; text-align: center; }
  @media print { body { margin: 12mm; } @page { margin: 12mm; } }
</style>
</head>
<body>
  <header>
    <div>
      <h1>Relevé mensuel — ${escapeHtml(monthLabel)}</h1>
      <div class="subtitle">Personne : ${escapeHtml(holderLabel)}</div>
    </div>
    <div class="meta">Généré le ${escapeHtml(generatedAt)}</div>
  </header>

  <div class="totals">
    <div class="total"><div class="label">Revenus</div><div class="value" style="color:#31633a">${escapeHtml(
      formatCurrency(totals.income),
    )}</div></div>
    <div class="total"><div class="label">Dépenses</div><div class="value" style="color:#a8552f">${escapeHtml(
      formatCurrency(totals.expenses),
    )}</div></div>
    <div class="total"><div class="label">Solde net</div><div class="value">${escapeHtml(
      formatCurrency(totals.net),
    )}</div></div>
    ${
      savingsRate !== null
        ? `<div class="total"><div class="label">Taux d'épargne</div><div class="value">${savingsRate}&nbsp;%</div></div>`
        : ''
    }
  </div>

  <table>
    <thead>
      <tr><th>Catégorie</th><th style="text-align:right">Revenus</th><th style="text-align:right">Dépenses</th><th style="text-align:right">Solde</th><th style="text-align:right">Part</th></tr>
    </thead>
    <tbody>${
      bodyRows ||
      '<tr><td colspan="5" class="muted">Aucun mouvement ce mois-ci.</td></tr>'
    }</tbody>
    <tfoot>
      <tr>
        <td>Total</td>
        <td class="amount" style="color:#31633a">${escapeHtml(
          formatCurrency(totals.income),
        )}</td>
        <td class="amount" style="color:#a8552f">${escapeHtml(
          formatCurrency(totals.expenses),
        )}</td>
        <td class="amount">${escapeHtml(formatCurrency(totals.net))}</td>
        <td></td>
      </tr>
    </tfoot>
  </table>

  <footer>Carnet de budget — votre argent, enfin clair.</footer>
</body>
</html>`)

  printWindow.document.close()
  printWindow.focus()
  printWindow.setTimeout(() => printWindow.print(), 250)

  return true
}

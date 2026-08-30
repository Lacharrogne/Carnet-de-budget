import { useMemo, useState } from 'react'
import { FileUp, Upload, X } from 'lucide-react'

import { budgetCategories } from '../../data/budgetCategories'
import {
  guessColumn,
  parseAmountFlexible,
  parseCsv,
  parseDateFlexible,
  type ParsedCsv,
} from '../../lib/csvImport'
import {
  buildHistoryIndex,
  suggestCategory,
} from '../../services/categorizationService'
import { formatCurrency } from '../../utils/formatCurrency'
import type {
  Account,
  BudgetCategoryId,
  Transaction,
} from '../../types/budget'

type AmountMode = 'single' | 'split'

type PreviewRow = {
  index: number
  date: string
  label: string
  amount: number // positif ; le type porte le sens
  type: 'income' | 'expense'
  category: BudgetCategoryId
}

type Props = {
  accounts: Account[]
  existingTransactions: Transaction[]
  onImport: (transactions: Transaction[]) => Promise<void>
  onClose: () => void
}

const SELECT_CLASS =
  'h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100'

export default function ImportTransactionsModal({
  accounts,
  existingTransactions,
  onImport,
  onClose,
}: Props) {
  const [parsed, setParsed] = useState<ParsedCsv | null>(null)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')

  const [dateCol, setDateCol] = useState(-1)
  const [labelCol, setLabelCol] = useState(-1)
  const [amountMode, setAmountMode] = useState<AmountMode>('single')
  const [amountCol, setAmountCol] = useState(-1)
  const [debitCol, setDebitCol] = useState(-1)
  const [creditCol, setCreditCol] = useState(-1)

  const [excluded, setExcluded] = useState<Set<number>>(new Set())
  const [overrides, setOverrides] = useState<Map<number, BudgetCategoryId>>(
    new Map(),
  )
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)

  const historyIndex = useMemo(
    () => buildHistoryIndex(existingTransactions),
    [existingTransactions],
  )

  function handleFile(file: File) {
    setError('')
    const reader = new FileReader()
    reader.onload = () => {
      const result = parseCsv(String(reader.result ?? ''))
      if (result.headers.length === 0 || result.rows.length === 0) {
        setError('Fichier vide ou illisible. Vérifie que c’est bien un CSV.')
        return
      }
      setParsed(result)
      setFileName(file.name)

      // Devine les colonnes.
      setDateCol(guessColumn(result.headers, ['date']))
      setLabelCol(
        guessColumn(result.headers, ['libelle', 'label', 'nature', 'description', 'operation', 'intitule']),
      )
      const debit = guessColumn(result.headers, ['debit'])
      const credit = guessColumn(result.headers, ['credit'])
      const montant = guessColumn(result.headers, ['montant', 'amount', 'valeur'])
      if (debit >= 0 && credit >= 0) {
        setAmountMode('split')
        setDebitCol(debit)
        setCreditCol(credit)
      } else {
        setAmountMode('single')
        setAmountCol(montant >= 0 ? montant : -1)
      }
    }
    reader.onerror = () => setError('Impossible de lire le fichier.')
    reader.readAsText(file, 'utf-8')
  }

  const preview = useMemo<PreviewRow[]>(() => {
    if (!parsed) return []

    const rows: PreviewRow[] = []
    parsed.rows.forEach((cells, index) => {
      const date = dateCol >= 0 ? parseDateFlexible(cells[dateCol] ?? '') : null
      const label = labelCol >= 0 ? (cells[labelCol] ?? '').trim() : ''

      let signed: number | null = null
      if (amountMode === 'single') {
        signed = amountCol >= 0 ? parseAmountFlexible(cells[amountCol] ?? '') : null
      } else {
        const debit = debitCol >= 0 ? parseAmountFlexible(cells[debitCol] ?? '') : null
        const credit = creditCol >= 0 ? parseAmountFlexible(cells[creditCol] ?? '') : null
        if (debit && debit !== 0) signed = -Math.abs(debit)
        else if (credit && credit !== 0) signed = Math.abs(credit)
      }

      if (!date || !label || signed === null || signed === 0) return

      const type: 'income' | 'expense' = signed >= 0 ? 'income' : 'expense'
      const suggested = suggestCategory(label, historyIndex)
      const category =
        overrides.get(index) ??
        suggested ??
        (type === 'income' ? 'salary' : 'other')

      rows.push({ index, date, label, amount: Math.abs(signed), type, category })
    })
    return rows
  }, [parsed, dateCol, labelCol, amountMode, amountCol, debitCol, creditCol, overrides, historyIndex])

  const included = preview.filter((row) => !excluded.has(row.index))

  async function handleImport() {
    if (!accountId || included.length === 0) return
    setImporting(true)
    setProgress(0)

    const toCreate: Transaction[] = included.map((row, i) => ({
      id: `import-${Date.now()}-${i}`,
      title: row.label,
      amount: row.amount,
      type: row.type,
      category: row.category,
      accountId,
      date: row.date,
      note: 'Importé depuis un relevé',
    }))

    try {
      let done = 0
      for (const transaction of toCreate) {
        await onImport([transaction])
        done += 1
        setProgress(done)
      }
      onClose()
    } catch {
      setError('Une erreur est survenue pendant l’import. Réessaie.')
      setImporting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[2rem] border border-stone-200 bg-white shadow-2xl sm:rounded-[2rem]">
        {/* En-tête */}
        <div className="flex items-center justify-between gap-3 border-b border-stone-200 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <FileUp className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-950">
                Importer un relevé
              </h2>
              <p className="text-xs text-slate-500">
                Fichier CSV de votre banque
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-stone-100 hover:text-slate-700"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {error && (
            <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700">
              {error}
            </p>
          )}

          {!parsed ? (
            /* Étape 1 : dépôt du fichier */
            <div>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[1.5rem] border-2 border-dashed border-stone-300 bg-stone-50 px-6 py-12 text-center transition hover:border-emerald-300 hover:bg-emerald-50/40">
                <Upload className="h-8 w-8 text-emerald-600" />
                <span className="font-display text-lg font-semibold text-slate-950">
                  Choisir un fichier CSV
                </span>
                <span className="max-w-md text-sm text-slate-500">
                  Exportez vos opérations depuis votre banque au format CSV, puis
                  déposez le fichier ici. Rien n’est envoyé ailleurs : tout est
                  traité dans votre navigateur.
                </span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) handleFile(file)
                  }}
                />
              </label>
            </div>
          ) : (
            /* Étape 2 : mappage + aperçu */
            <div className="space-y-5">
              <p className="text-sm text-slate-600">
                <span className="font-bold text-slate-900">{fileName}</span> —{' '}
                {parsed.rows.length} ligne{parsed.rows.length > 1 ? 's' : ''} lue
                {parsed.rows.length > 1 ? 's' : ''}.
              </p>

              {/* Compte cible */}
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">
                  Compte de destination
                </label>
                <select
                  value={accountId}
                  onChange={(event) => setAccountId(event.target.value)}
                  className={SELECT_CLASS}
                >
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.emoji} {account.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mappage des colonnes */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-700">
                    Colonne « Date »
                  </label>
                  <select
                    value={dateCol}
                    onChange={(event) => setDateCol(Number(event.target.value))}
                    className={SELECT_CLASS}
                  >
                    <option value={-1}>—</option>
                    {parsed.headers.map((header, i) => (
                      <option key={i} value={i}>
                        {header || `Colonne ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-700">
                    Colonne « Libellé »
                  </label>
                  <select
                    value={labelCol}
                    onChange={(event) => setLabelCol(Number(event.target.value))}
                    className={SELECT_CLASS}
                  >
                    <option value={-1}>—</option>
                    {parsed.headers.map((header, i) => (
                      <option key={i} value={i}>
                        {header || `Colonne ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">
                  Montant
                </label>
                <div className="mb-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAmountMode('single')}
                    className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${amountMode === 'single' ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-slate-600 hover:bg-stone-200'}`}
                  >
                    Une colonne (±)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmountMode('split')}
                    className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${amountMode === 'split' ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-slate-600 hover:bg-stone-200'}`}
                  >
                    Débit / Crédit
                  </button>
                </div>

                {amountMode === 'single' ? (
                  <select
                    value={amountCol}
                    onChange={(event) => setAmountCol(Number(event.target.value))}
                    className={SELECT_CLASS}
                  >
                    <option value={-1}>—</option>
                    {parsed.headers.map((header, i) => (
                      <option key={i} value={i}>
                        {header || `Colonne ${i + 1}`}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <select
                      value={debitCol}
                      onChange={(event) => setDebitCol(Number(event.target.value))}
                      className={SELECT_CLASS}
                    >
                      <option value={-1}>Débit —</option>
                      {parsed.headers.map((header, i) => (
                        <option key={i} value={i}>
                          {header || `Colonne ${i + 1}`}
                        </option>
                      ))}
                    </select>
                    <select
                      value={creditCol}
                      onChange={(event) => setCreditCol(Number(event.target.value))}
                      className={SELECT_CLASS}
                    >
                      <option value={-1}>Crédit —</option>
                      {parsed.headers.map((header, i) => (
                        <option key={i} value={i}>
                          {header || `Colonne ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Aperçu */}
              <div>
                <p className="mb-2 text-sm font-bold text-slate-700">
                  Aperçu —{' '}
                  <span className="text-emerald-700">
                    {included.length} transaction{included.length > 1 ? 's' : ''}
                  </span>{' '}
                  à importer
                </p>

                {preview.length === 0 ? (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                    Aucune ligne exploitable. Vérifiez le mappage des colonnes
                    (Date, Libellé et Montant).
                  </p>
                ) : (
                  <div className="max-h-72 overflow-auto rounded-2xl border border-stone-200">
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 bg-stone-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-3 py-2 font-bold"></th>
                          <th className="px-3 py-2 font-bold">Date</th>
                          <th className="px-3 py-2 font-bold">Libellé</th>
                          <th className="px-3 py-2 font-bold">Catégorie</th>
                          <th className="px-3 py-2 text-right font-bold">Montant</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.slice(0, 100).map((row) => {
                          const isIncluded = !excluded.has(row.index)
                          return (
                            <tr
                              key={row.index}
                              className={`border-t border-stone-100 ${isIncluded ? '' : 'opacity-40'}`}
                            >
                              <td className="px-3 py-2">
                                <input
                                  type="checkbox"
                                  checked={isIncluded}
                                  onChange={() =>
                                    setExcluded((prev) => {
                                      const next = new Set(prev)
                                      if (next.has(row.index)) next.delete(row.index)
                                      else next.add(row.index)
                                      return next
                                    })
                                  }
                                  className="h-4 w-4 accent-emerald-600"
                                />
                              </td>
                              <td className="whitespace-nowrap px-3 py-2 text-slate-500">
                                {row.date}
                              </td>
                              <td className="max-w-[12rem] truncate px-3 py-2 font-semibold text-slate-900">
                                {row.label}
                              </td>
                              <td className="px-3 py-2">
                                <select
                                  value={row.category}
                                  onChange={(event) =>
                                    setOverrides((prev) => {
                                      const next = new Map(prev)
                                      next.set(
                                        row.index,
                                        event.target.value as BudgetCategoryId,
                                      )
                                      return next
                                    })
                                  }
                                  className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                                >
                                  {budgetCategories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                      {category.emoji} {category.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td
                                className={`whitespace-nowrap px-3 py-2 text-right font-black ${row.type === 'income' ? 'text-emerald-700' : 'text-slate-900'}`}
                              >
                                {row.type === 'income' ? '+' : '−'}
                                {formatCurrency(row.amount)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {preview.length > 100 && (
                  <p className="mt-2 text-xs text-slate-400">
                    (Aperçu limité à 100 lignes — toutes les {preview.length}{' '}
                    lignes valides seront importées.)
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pied : actions */}
        {parsed && (
          <div className="flex items-center justify-between gap-3 border-t border-stone-200 px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={() => {
                setParsed(null)
                setExcluded(new Set())
                setOverrides(new Map())
              }}
              className="text-sm font-bold text-slate-500 transition hover:text-slate-800"
              disabled={importing}
            >
              ← Changer de fichier
            </button>

            <button
              type="button"
              onClick={handleImport}
              disabled={importing || included.length === 0 || !accountId}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {importing
                ? `Import… ${progress}/${included.length}`
                : `Importer ${included.length} transaction${included.length > 1 ? 's' : ''}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { CreditCard, Search, X } from 'lucide-react'

import { useBudgetData } from '../../context/useBudgetData'
import { useDialogA11y } from '../../hooks/useDialogA11y'
import { getCategoryById } from '../../services/budgetStatsService'
import { normalizeLabel } from '../../services/categorizationService'
import { formatCurrency } from '../../utils/formatCurrency'

type Props = {
  onClose: () => void
}

export default function GlobalSearch({ onClose }: Props) {
  const { transactions, accounts } = useBudgetData()
  const navigate = useNavigate()
  const dialogRef = useDialogA11y<HTMLDivElement>(onClose)
  const [query, setQuery] = useState('')

  const normalized = normalizeLabel(query)

  const accountResults = useMemo(() => {
    if (normalized.length < 1) return []
    return accounts
      .filter((account) => normalizeLabel(account.name).includes(normalized))
      .slice(0, 5)
  }, [accounts, normalized])

  const transactionResults = useMemo(() => {
    if (normalized.length < 2) return []
    return [...transactions]
      .filter((transaction) => {
        const haystack = normalizeLabel(
          `${transaction.title} ${transaction.note ?? ''}`,
        )
        return haystack.includes(normalized)
      })
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8)
  }, [transactions, normalized])

  const accountName = (id: string) =>
    accounts.find((account) => account.id === id)?.name ?? ''

  function openTransaction(title: string) {
    navigate(`/transactions?q=${encodeURIComponent(title)}`)
    onClose()
  }

  function openAccount() {
    navigate('/comptes')
    onClose()
  }

  const hasQuery = normalized.length >= 1
  const hasResults =
    accountResults.length > 0 || transactionResults.length > 0

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-slate-950/40 p-4 backdrop-blur-sm sm:pt-24"
      role="dialog"
      aria-modal="true"
      aria-label="Recherche"
    >
      <div
        ref={dialogRef}
        className="flex max-h-[80vh] w-full max-w-xl flex-col overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-2xl"
      >
        {/* Champ de recherche */}
        <div className="flex items-center gap-3 border-b border-stone-200 px-4 py-3">
          <Search className="h-5 w-5 shrink-0 text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher une transaction, un compte…"
            className="h-9 w-full bg-transparent text-base font-medium text-slate-900 outline-none placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-stone-100 hover:text-slate-700"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {!hasQuery && (
            <p className="px-3 py-8 text-center text-sm text-slate-400">
              Tapez pour retrouver une transaction ou un compte.
            </p>
          )}

          {hasQuery && !hasResults && (
            <p className="px-3 py-8 text-center text-sm text-slate-400">
              Aucun résultat pour «&nbsp;{query}&nbsp;».
            </p>
          )}

          {accountResults.length > 0 && (
            <div className="mb-1">
              <p className="px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-wide text-slate-400">
                Comptes
              </p>
              {accountResults.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  onClick={openAccount}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-stone-100"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    {account.emoji ? (
                      <span className="text-base">{account.emoji}</span>
                    ) : (
                      <CreditCard className="h-4 w-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-slate-900">
                      {account.name}
                    </span>
                    <span className="block text-xs text-slate-400">
                      {formatCurrency(account.balance)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {transactionResults.length > 0 && (
            <div>
              <p className="px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-wide text-slate-400">
                Transactions
              </p>
              {transactionResults.map((transaction) => {
                const category = getCategoryById(transaction.category)
                return (
                  <button
                    key={transaction.id}
                    type="button"
                    onClick={() => openTransaction(transaction.title)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-stone-100"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-base">
                      {category?.emoji ?? '💸'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-slate-900">
                        {transaction.title}
                      </span>
                      <span className="block text-xs text-slate-400">
                        {transaction.date} · {accountName(transaction.accountId)}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 text-sm font-black ${transaction.type === 'income' ? 'text-emerald-700' : 'text-slate-900'}`}
                    >
                      {transaction.type === 'income' ? '+' : '−'}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

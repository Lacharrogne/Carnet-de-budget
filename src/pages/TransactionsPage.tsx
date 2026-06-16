import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  CalendarDays,
  Download,
  Filter,
  Pencil,
  Plus,
  Printer,
  ReceiptText,
  Search,
  Trash2,
  WalletCards,
  X,
  XCircle,
} from 'lucide-react'

import ConfirmActionModal from '../components/ui/ConfirmActionModal'
import { useBudgetData } from '../context/useBudgetData'
import { budgetCategories } from '../data/budgetCategories'
import { getCategoryById } from '../services/budgetStatsService'
import {
  buildTransactionRows,
  exportTransactionsToCsv,
  exportTransactionsToPdf,
} from '../services/exportService'
import type {
  Account,
  BudgetCategory,
  BudgetCategoryId,
  Transaction,
  TransactionType,
} from '../types/budget'
import { formatCurrency } from '../utils/formatCurrency'

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest'

type TransactionFormValues = {
  title: string
  amount: string
  type: TransactionType
  category: BudgetCategoryId
  accountId: string
  toAccountId: string
  date: string
  note: string
  isRecurring: boolean
}

const transferCategory: BudgetCategory = {
  id: 'transfer',
  name: 'Virement',
  emoji: '🔁',
  description: 'Mouvement entre deux comptes personnels.',
  colorClass: 'border-blue-100 bg-blue-50 text-blue-900',
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10)
}

function createTransactionId() {
  return `transaction-${Date.now()}`
}

function getFirstDestinationAccountId(
  accounts: Account[],
  sourceAccountId: string,
) {
  return accounts.find((account) => account.id !== sourceAccountId)?.id ?? ''
}

function getDefaultFormValues(accounts: Account[]): TransactionFormValues {
  const accountId = accounts[0]?.id ?? ''

  return {
    title: '',
    amount: '',
    type: 'expense',
    category: 'groceries',
    accountId,
    toAccountId: getFirstDestinationAccountId(accounts, accountId),
    date: getTodayDate(),
    note: '',
    isRecurring: false,
  }
}

function normalizeFormValues(
  values: TransactionFormValues,
  accounts: Account[],
) {
  if (values.accountId || accounts.length === 0) {
    return values
  }

  return getDefaultFormValues(accounts)
}

function getTransactionFormValues(
  transaction: Transaction,
  accounts: Account[],
): TransactionFormValues {
  return {
    title: transaction.title,
    amount: String(transaction.amount),
    type: transaction.type,
    category: transaction.category,
    accountId: transaction.accountId,
    toAccountId:
      transaction.toAccountId ??
      getFirstDestinationAccountId(accounts, transaction.accountId),
    date: transaction.date,
    note: transaction.note ?? '',
    isRecurring: transaction.isRecurring ?? false,
  }
}

function getTransactionCategory(categoryId: BudgetCategoryId) {
  if (categoryId === 'transfer') {
    return transferCategory
  }

  return getCategoryById(categoryId)
}

function getTransactionTypeLabel(type: TransactionType) {
  if (type === 'income') {
    return 'Revenu'
  }

  if (type === 'expense') {
    return 'Dépense'
  }

  return 'Virement'
}

function parseAmount(value: string) {
  const normalizedValue = value.trim().replace(',', '.')

  if (!normalizedValue) {
    return 0
  }

  return Number(normalizedValue)
}

function PageStatCard({
  title,
  value,
  description,
  icon,
  variant,
}: {
  title: string
  value: string
  description: string
  icon: ReactNode
  variant: 'emerald' | 'blue' | 'rose' | 'amber'
}) {
  const variants = {
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-900',
    blue: 'border-blue-100 bg-blue-50 text-blue-900',
    rose: 'border-rose-100 bg-rose-50 text-rose-900',
    amber: 'border-amber-100 bg-amber-50 text-amber-900',
  }

  const iconVariants = {
    emerald: 'bg-emerald-100 text-emerald-700',
    blue: 'bg-blue-100 text-blue-700',
    rose: 'bg-rose-100 text-rose-700',
    amber: 'bg-amber-100 text-amber-700',
  }

  return (
    <div className={`rounded-[1.75rem] border p-5 ${variants[variant]}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="tabular mt-3 text-3xl font-black tracking-tight">
            {value}
          </p>
          <p className="mt-2 text-sm opacity-75">{description}</p>
        </div>

        <div className={`rounded-2xl p-3 ${iconVariants[variant]}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function NoAccountWarning() {
  return (
    <section className="rounded-[2rem] border border-amber-100 bg-amber-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-white p-3 text-amber-700 shadow-sm">
            <WalletCards className="h-6 w-6" />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">
              Compte nécessaire
            </p>

            <h2 className="mt-1 font-display text-xl font-semibold text-amber-950">
              Créez d’abord un compte pour ajouter des transactions
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-800/80">
              Une transaction doit être liée à un compte pour que le solde soit
              automatiquement corrigé. Une fois votre premier compte créé, vous
              pourrez ajouter revenus, dépenses et virements.
            </p>
          </div>
        </div>

        <Link
          to="/comptes"
          className="flex w-fit items-center justify-center gap-2 rounded-full bg-emerald-950 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-900"
        >
          <Plus className="h-4 w-4" />
          Créer un compte
        </Link>
      </div>
    </section>
  )
}

function getTransactionDateLabel(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`))
}

function TransactionCard({
  transaction,
  accountName,
  toAccountName,
  onEditRequest,
  onDeleteRequest,
}: {
  transaction: Transaction
  accountName: string
  toAccountName?: string
  onEditRequest: (transaction: Transaction) => void
  onDeleteRequest: (transaction: Transaction) => void
}) {
  const category = getTransactionCategory(transaction.category)
  const isIncome = transaction.type === 'income'
  const isExpense = transaction.type === 'expense'
  const isTransfer = transaction.type === 'transfer'

  const accountLabel = isTransfer
    ? `${accountName} → ${toAccountName ?? 'Compte inconnu'}`
    : accountName

  const amountLabel = isTransfer
    ? `↔ ${formatCurrency(transaction.amount)}`
    : `${isIncome ? '+' : '-'}${formatCurrency(transaction.amount)}`

  const hasLinkedDebt = Boolean(transaction.linkedDebtId)
  const hasLinkedSavingGoal = Boolean(transaction.linkedSavingGoalId)
  const hasLinkedSinkingFund = Boolean(transaction.linkedSinkingFundId)

  return (
    <article className="rounded-[1.75rem] border border-stone-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className={`rounded-2xl border p-4 ${category.colorClass}`}>
            <span className="text-2xl">{category.emoji}</span>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-black text-slate-950">
                {transaction.title}
              </h2>

              {transaction.isRecurring && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                  Récurrent
                </span>
              )}

              {isTransfer && (
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                  Virement interne
                </span>
              )}

              {hasLinkedDebt && (
                <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">
                  Dette liée
                </span>
              )}

              {hasLinkedSavingGoal && (
                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700">
                  Objectif lié
                </span>
              )}

              {hasLinkedSinkingFund && (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                  Fonds lié
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {category.name} · {accountLabel} ·{' '}
              {getTransactionDateLabel(transaction.date)}
            </p>

            {transaction.note && (
              <p className="mt-2 text-sm text-slate-600">{transaction.note}</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 md:justify-end">
          <div className="text-left md:text-right">
            <p
              className={`text-lg font-black ${
                isIncome
                  ? 'text-emerald-700'
                  : isExpense
                    ? 'text-rose-700'
                    : 'text-blue-700'
              }`}
            >
              {amountLabel}
            </p>

            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {getTransactionTypeLabel(transaction.type)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEditRequest(transaction)}
              className="rounded-full bg-stone-100 p-3 text-slate-600 transition hover:bg-stone-200 hover:text-slate-950"
              aria-label="Modifier cette transaction"
            >
              <Pencil className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => onDeleteRequest(transaction)}
              className="rounded-full bg-rose-50 p-3 text-rose-700 transition hover:bg-rose-100"
              aria-label="Supprimer cette transaction"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

function TransactionFormModal({
  formValues,
  formError,
  accounts,
  isEditing,
  onClose,
  onSubmit,
  onChange,
}: {
  formValues: TransactionFormValues
  formError: string
  accounts: Account[]
  isEditing: boolean
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onChange: (values: TransactionFormValues) => void
}) {
  const canTransfer = accounts.length >= 2

  function updateField<Field extends keyof TransactionFormValues>(
    field: Field,
    value: TransactionFormValues[Field],
  ) {
    onChange({
      ...formValues,
      [field]: value,
    })
  }

  function updateAccountId(accountId: string) {
    onChange({
      ...formValues,
      accountId,
      toAccountId:
        formValues.type === 'transfer' &&
        (!formValues.toAccountId || formValues.toAccountId === accountId)
          ? getFirstDestinationAccountId(accounts, accountId)
          : formValues.toAccountId,
    })
  }

  function updateType(type: TransactionType) {
    const accountId = formValues.accountId || accounts[0]?.id || ''

    onChange({
      ...formValues,
      type,
      category:
        type === 'income'
          ? 'salary'
          : type === 'transfer'
            ? 'transfer'
            : 'groceries',
      accountId,
      toAccountId:
        type === 'transfer'
          ? getFirstDestinationAccountId(accounts, accountId)
          : '',
      isRecurring: type === 'transfer' ? false : formValues.isRecurring,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-3 backdrop-blur-sm md:items-center">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-stone-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-stone-100 bg-white/95 p-5 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                {isEditing ? 'Modification' : 'Nouvelle transaction'}
              </p>

              <h2 className="mt-1 font-display text-2xl font-semibold text-slate-950">
                {isEditing ? 'Modifier le mouvement' : 'Ajouter un mouvement'}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {isEditing
                  ? 'Modifiez les informations. Les soldes seront corrigés automatiquement.'
                  : 'Ajoutez une dépense, un revenu ou un virement entre deux comptes.'}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-stone-100 p-3 text-slate-500 transition hover:bg-stone-200 hover:text-slate-950"
              aria-label="Fermer le formulaire"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 p-5">
          <div className="grid gap-3 rounded-[1.75rem] bg-stone-50 p-2 md:grid-cols-3">
            <button
              type="button"
              onClick={() => updateType('expense')}
              className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                formValues.type === 'expense'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-white'
              }`}
            >
              Dépense
            </button>

            <button
              type="button"
              onClick={() => updateType('income')}
              className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                formValues.type === 'income'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-white'
              }`}
            >
              Revenu
            </button>

            <button
              type="button"
              disabled={!canTransfer}
              onClick={() => updateType('transfer')}
              className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                formValues.type === 'transfer'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : canTransfer
                    ? 'text-slate-500 hover:bg-white'
                    : 'cursor-not-allowed text-slate-300'
              }`}
            >
              Virement
            </button>
          </div>

          {formValues.type === 'transfer' && !canTransfer && (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
              Il faut au moins deux comptes pour faire un virement.
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="text-sm font-bold text-slate-700">Titre</span>

              <input
                value={formValues.title}
                onChange={(event) => updateField('title', event.target.value)}
                placeholder={
                  formValues.type === 'transfer'
                    ? 'Ex : Virement vers Livret A'
                    : 'Ex : Courses, salaire, Netflix...'
                }
                className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label>
              <span className="text-sm font-bold text-slate-700">Montant</span>

              <input
                value={formValues.amount}
                onChange={(event) => updateField('amount', event.target.value)}
                placeholder="Ex : 42,50"
                inputMode="decimal"
                className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            {formValues.type === 'transfer' ? (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-sm font-bold text-blue-800">
                  Catégorie automatique
                </p>

                <p className="mt-1 text-sm text-blue-700">
                  Ce mouvement sera enregistré comme un virement interne. Il ne
                  comptera ni comme une dépense, ni comme un revenu.
                </p>
              </div>
            ) : (
              <label>
                <span className="text-sm font-bold text-slate-700">
                  Catégorie
                </span>

                <select
                  value={formValues.category}
                  onChange={(event) =>
                    updateField(
                      'category',
                      event.target.value as BudgetCategoryId,
                    )
                  }
                  className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                >
                  {budgetCategories
                    .filter((category) => category.id !== 'transfer')
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.emoji} {category.name}
                      </option>
                    ))}
                </select>
              </label>
            )}

            <label>
              <span className="text-sm font-bold text-slate-700">
                {formValues.type === 'transfer' ? 'Compte source' : 'Compte'}
              </span>

              <select
                value={formValues.accountId}
                onChange={(event) => updateAccountId(event.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              >
                <option value="">Choisir un compte</option>

                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.emoji} {account.name}
                  </option>
                ))}
              </select>
            </label>

            {formValues.type === 'transfer' && (
              <label>
                <span className="text-sm font-bold text-slate-700">
                  Compte destination
                </span>

                <select
                  value={formValues.toAccountId}
                  onChange={(event) =>
                    updateField('toAccountId', event.target.value)
                  }
                  className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="">Choisir un compte</option>

                  {accounts
                    .filter((account) => account.id !== formValues.accountId)
                    .map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.emoji} {account.name}
                      </option>
                    ))}
                </select>
              </label>
            )}

            <label>
              <span className="text-sm font-bold text-slate-700">Date</span>

              <input
                type="date"
                value={formValues.date}
                onChange={(event) => updateField('date', event.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            {formValues.type !== 'transfer' && (
              <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                <input
                  type="checkbox"
                  checked={formValues.isRecurring}
                  onChange={(event) =>
                    updateField('isRecurring', event.target.checked)
                  }
                  className="h-5 w-5 rounded border-stone-300 accent-emerald-700"
                />

                <span>
                  <span className="block text-sm font-bold text-slate-700">
                    Transaction récurrente
                  </span>

                  <span className="text-xs text-slate-500">
                    Exemple : loyer, abonnement, salaire.
                  </span>
                </span>
              </label>
            )}
          </div>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">
              Note facultative
            </span>

            <textarea
              value={formValues.note}
              onChange={(event) => updateField('note', event.target.value)}
              placeholder="Ex : mise de côté mensuelle, achat exceptionnel..."
              rows={3}
              className="mt-2 w-full resize-none rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
          </label>

          {formError && (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
              {formError}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-stone-100 pt-5 md:flex-row md:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-stone-100 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-stone-200"
            >
              Annuler
            </button>

            <button
              type="submit"
              className="rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900"
            >
              {isEditing
                ? 'Enregistrer les modifications'
                : 'Ajouter le mouvement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function TransactionsPage() {
  const {
    accounts,
    transactions: localTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useBudgetData()

  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all')
  const [categoryFilter, setCategoryFilter] = useState<'all' | BudgetCategoryId>(
    'all',
  )
  const [sortOption, setSortOption] = useState<SortOption>('newest')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formValues, setFormValues] = useState<TransactionFormValues>(() =>
    getDefaultFormValues(accounts),
  )
  const [formError, setFormError] = useState('')
  const [transactionToEdit, setTransactionToEdit] =
    useState<Transaction | null>(null)
  const [transactionToDelete, setTransactionToDelete] =
    useState<Transaction | null>(null)

  const [searchParams, setSearchParams] = useSearchParams()
  const action = searchParams.get('action')
  const hasAccounts = accounts.length > 0
  const shouldShowForm = hasAccounts && (isFormOpen || action === 'new')
  const displayedFormValues = normalizeFormValues(formValues, accounts)

  const totalIncome = localTransactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((total, transaction) => total + transaction.amount, 0)

  const totalExpenses = localTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((total, transaction) => total + transaction.amount, 0)

  const transferCount = localTransactions.filter((transaction) => {
    return transaction.type === 'transfer'
  }).length

  const netBalance = totalIncome - totalExpenses

  const normalizedSearch = searchTerm.trim().toLowerCase()

  function clearActionParam() {
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete('action')
    setSearchParams(nextSearchParams, { replace: true })
  }

  function resetFilters() {
    setSearchTerm('')
    setTypeFilter('all')
    setCategoryFilter('all')
    setSortOption('newest')
  }

  function getAccountName(accountId?: string) {
    if (!accountId) {
      return 'Compte inconnu'
    }

    return (
      accounts.find((account) => account.id === accountId)?.name ??
      'Compte inconnu'
    )
  }

  const transactionCategoryOptions = budgetCategories.some((category) => {
    return category.id === 'transfer'
  })
    ? budgetCategories
    : [...budgetCategories, transferCategory]

  const filteredTransactions = [...localTransactions]
    .filter((transaction) => {
      const category = getTransactionCategory(transaction.category)
      const sourceAccountName = getAccountName(transaction.accountId)
      const destinationAccountName = getAccountName(transaction.toAccountId)

      const matchesSearch =
        normalizedSearch.length === 0 ||
        transaction.title.toLowerCase().includes(normalizedSearch) ||
        category.name.toLowerCase().includes(normalizedSearch) ||
        sourceAccountName.toLowerCase().includes(normalizedSearch) ||
        destinationAccountName.toLowerCase().includes(normalizedSearch) ||
        Boolean(transaction.note?.toLowerCase().includes(normalizedSearch))

      const matchesType =
        typeFilter === 'all' || transaction.type === typeFilter

      const matchesCategory =
        categoryFilter === 'all' || transaction.category === categoryFilter

      return matchesSearch && matchesType && matchesCategory
    })
    .sort((firstTransaction, secondTransaction) => {
      if (sortOption === 'newest') {
        return secondTransaction.date.localeCompare(firstTransaction.date)
      }

      if (sortOption === 'oldest') {
        return firstTransaction.date.localeCompare(secondTransaction.date)
      }

      if (sortOption === 'highest') {
        return secondTransaction.amount - firstTransaction.amount
      }

      return firstTransaction.amount - secondTransaction.amount
    })

  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    typeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    sortOption !== 'newest'

  function buildExportRows() {
    return buildTransactionRows(filteredTransactions, {
      getAccountName,
      getCategoryName: (transaction) =>
        getTransactionCategory(transaction.category).name,
    })
  }

  const exportSubtitle = hasActiveFilters
    ? 'Sélection filtrée de vos transactions'
    : 'Toutes vos transactions'

  function handleExportCsv() {
    if (filteredTransactions.length === 0) {
      return
    }

    exportTransactionsToCsv(buildExportRows())
  }

  function handleExportPdf() {
    if (filteredTransactions.length === 0) {
      return
    }

    const income = filteredTransactions
      .filter((transaction) => transaction.type === 'income')
      .reduce((total, transaction) => total + transaction.amount, 0)

    const expenses = filteredTransactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((total, transaction) => total + transaction.amount, 0)

    const opened = exportTransactionsToPdf({
      rows: buildExportRows(),
      totals: { income, expenses, net: income - expenses },
      subtitle: exportSubtitle,
    })

    if (!opened) {
      window.alert(
        'Votre navigateur a bloqué la fenêtre d’impression. Autorisez les pop-ups pour exporter en PDF.',
      )
    }
  }

  function openForm() {
    if (!hasAccounts) {
      setFormError('Créez d’abord un compte avant d’ajouter une transaction.')

      if (action === 'new') {
        clearActionParam()
      }

      return
    }

    setTransactionToEdit(null)
    setFormValues(getDefaultFormValues(accounts))
    setFormError('')
    setIsFormOpen(true)
  }

  function openEditForm(transaction: Transaction) {
    setTransactionToEdit(transaction)
    setFormValues(getTransactionFormValues(transaction, accounts))
    setFormError('')
    setIsFormOpen(true)

    if (action === 'new') {
      clearActionParam()
    }
  }

  function closeForm() {
    setIsFormOpen(false)
    setTransactionToEdit(null)
    setFormValues(getDefaultFormValues(accounts))
    setFormError('')

    if (action === 'new') {
      clearActionParam()
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const currentFormValues = normalizeFormValues(formValues, accounts)
    let title = currentFormValues.title.trim()
    const amount = parseAmount(currentFormValues.amount)

    if (!hasAccounts) {
      setFormError('Créez d’abord un compte avant d’ajouter une transaction.')
      return
    }

    if (currentFormValues.type !== 'transfer' && !title) {
      setFormError('Ajoutez un titre pour la transaction.')
      return
    }

    if (currentFormValues.type === 'transfer' && !title) {
      title = 'Virement entre comptes'
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError('Ajoutez un montant valide supérieur à 0.')
      return
    }

    if (!currentFormValues.accountId) {
      setFormError(
        currentFormValues.type === 'transfer'
          ? 'Choisissez le compte source.'
          : 'Choisissez un compte pour cette transaction.',
      )
      return
    }

    if (currentFormValues.type === 'transfer') {
      if (accounts.length < 2) {
        setFormError('Il faut au moins deux comptes pour faire un virement.')
        return
      }

      if (!currentFormValues.toAccountId) {
        setFormError('Choisissez le compte destination.')
        return
      }

      if (currentFormValues.toAccountId === currentFormValues.accountId) {
        setFormError(
          'Le compte source et le compte destination doivent être différents.',
        )
        return
      }
    }

    if (!currentFormValues.date) {
      setFormError('Choisissez une date.')
      return
    }

    const nextTransaction: Transaction = {
      id: transactionToEdit?.id ?? createTransactionId(),
      title,
      amount,
      type: currentFormValues.type,
      category:
        currentFormValues.type === 'transfer'
          ? 'transfer'
          : currentFormValues.category,
      accountId: currentFormValues.accountId,
      toAccountId:
        currentFormValues.type === 'transfer'
          ? currentFormValues.toAccountId
          : undefined,
      linkedDebtId: transactionToEdit?.linkedDebtId,
      linkedSavingGoalId: transactionToEdit?.linkedSavingGoalId,
      linkedSinkingFundId: transactionToEdit?.linkedSinkingFundId,
      date: currentFormValues.date,
      note: currentFormValues.note.trim() || undefined,
      isRecurring:
        currentFormValues.type === 'transfer'
          ? false
          : currentFormValues.isRecurring,
    }

    if (transactionToEdit) {
      updateTransaction(nextTransaction)
    } else {
      addTransaction(nextTransaction)
    }

    closeForm()
  }

  function confirmDeleteTransaction() {
    if (!transactionToDelete) {
      return
    }

    deleteTransaction(transactionToDelete.id)
    setTransactionToDelete(null)
  }

  const deleteDescription =
    transactionToDelete?.type === 'transfer'
      ? `Vous êtes sur le point de supprimer "${transactionToDelete.title}". Le virement entre "${getAccountName(
          transactionToDelete.accountId,
        )}" et "${getAccountName(
          transactionToDelete.toAccountId,
        )}" sera annulé et les soldes seront corrigés.`
      : `Vous êtes sur le point de supprimer "${
          transactionToDelete?.title ?? ''
        }". Le solde du compte "${getAccountName(
          transactionToDelete?.accountId,
        )}" sera automatiquement corrigé.`

  return (
    <div className="space-y-6">
      <section className="animate-rise card-premium overflow-hidden">
        <div className="relative p-6 md:p-8">
          <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="absolute bottom-0 right-24 h-32 w-32 rounded-full bg-amber-200/40 blur-3xl" />

          <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                Transactions
              </p>

              <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-950 md:text-[2.4rem] md:leading-[1.1]">
                Tous vos mouvements d’argent
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Retrouvez vos revenus, vos dépenses, vos abonnements et vos
                virements. Les virements déplacent l’argent entre deux comptes
                sans fausser vos revenus ni vos dépenses.
              </p>
            </div>

            {hasAccounts ? (
              <button
                type="button"
                onClick={openForm}
                className="flex w-fit items-center gap-2 rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-emerald-900"
              >
                <Plus className="h-4 w-4" />
                Nouvelle transaction
              </button>
            ) : (
              <Link
                to="/comptes"
                className="flex w-fit items-center gap-2 rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-emerald-900"
              >
                <Plus className="h-4 w-4" />
                Créer un compte
              </Link>
            )}
          </div>
        </div>
      </section>

      {!hasAccounts && <NoAccountWarning />}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PageStatCard
          title="Nombre total"
          value={String(localTransactions.length)}
          description={`${transferCount} virement${
            transferCount > 1 ? 's' : ''
          } interne${transferCount > 1 ? 's' : ''}`}
          icon={<ReceiptText className="h-5 w-5" />}
          variant="emerald"
        />

        <PageStatCard
          title="Revenus"
          value={formatCurrency(totalIncome)}
          description="Total des entrées d’argent"
          icon={<ArrowUpRight className="h-5 w-5" />}
          variant="blue"
        />

        <PageStatCard
          title="Dépenses"
          value={formatCurrency(totalExpenses)}
          description="Total des sorties d’argent"
          icon={<ArrowDownLeft className="h-5 w-5" />}
          variant="rose"
        />

        <PageStatCard
          title="Solde net"
          value={formatCurrency(netBalance)}
          description="Revenus moins dépenses"
          icon={<ArrowRightLeft className="h-5 w-5" />}
          variant="amber"
        />
      </section>

      <section className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-600">
              Recherche et filtres
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-950">
              Trouver une transaction
            </h2>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="flex w-fit items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-stone-200"
            >
              <XCircle className="h-4 w-4" />
              Réinitialiser
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Rechercher : loyer, courses, salaire, livret..."
              className="h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 pl-12 pr-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
          </label>

          <label className="relative block">
            <Filter className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as 'all' | TransactionType)
              }
              className="h-12 w-full appearance-none rounded-2xl border border-stone-200 bg-stone-50 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            >
              <option value="all">Tous les types</option>
              <option value="income">Revenus</option>
              <option value="expense">Dépenses</option>
              <option value="transfer">Virements</option>
            </select>
          </label>

          <label className="relative block">
            <ReceiptText className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value as 'all' | BudgetCategoryId)
              }
              className="h-12 w-full appearance-none rounded-2xl border border-stone-200 bg-stone-50 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            >
              <option value="all">Toutes les catégories</option>

              {transactionCategoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.emoji} {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="relative block">
            <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <select
              value={sortOption}
              onChange={(event) =>
                setSortOption(event.target.value as SortOption)
              }
              className="h-12 w-full appearance-none rounded-2xl border border-stone-200 bg-stone-50 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            >
              <option value="newest">Plus récentes</option>
              <option value="oldest">Plus anciennes</option>
              <option value="highest">Montant le plus élevé</option>
              <option value="lowest">Montant le plus faible</option>
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-600">
              Liste des transactions
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-950">
              {filteredTransactions.length} résultat
              {filteredTransactions.length > 1 ? 's' : ''}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {hasActiveFilters
                ? 'Export limité à votre sélection filtrée.'
                : 'Exportez vos données comme dans un tableur.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={filteredTransactions.length === 0}
              className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              <Download className="h-4 w-4" />
              Exporter CSV
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              disabled={filteredTransactions.length === 0}
              className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              <Printer className="h-4 w-4" />
              Exporter PDF
            </button>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                accountName={getAccountName(transaction.accountId)}
                toAccountName={getAccountName(transaction.toAccountId)}
                onEditRequest={openEditForm}
                onDeleteRequest={setTransactionToDelete}
              />
            ))
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-stone-200 bg-stone-50 p-8 text-center">
              <p className="text-3xl">{hasAccounts ? '🔎' : '🏦'}</p>

              <h3 className="mt-3 text-lg font-black text-slate-950">
                {hasAccounts
                  ? 'Aucune transaction trouvée'
                  : 'Aucun compte disponible'}
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {hasAccounts
                  ? 'Essayez de modifier votre recherche ou de réinitialiser les filtres.'
                  : 'Créez votre premier compte pour pouvoir enregistrer des mouvements.'}
              </p>
            </div>
          )}
        </div>
      </section>

      {shouldShowForm && (
        <TransactionFormModal
          formValues={displayedFormValues}
          formError={formError}
          accounts={accounts}
          isEditing={Boolean(transactionToEdit)}
          onClose={closeForm}
          onSubmit={handleSubmit}
          onChange={setFormValues}
        />
      )}

      {transactionToDelete && (
        <ConfirmActionModal
          eyebrow="Suppression"
          title="Supprimer cette transaction ?"
          description={deleteDescription}
          confirmLabel="Supprimer la transaction"
          cancelLabel="Annuler"
          icon={<Trash2 className="h-5 w-5" />}
          variant="danger"
          onCancel={() => setTransactionToDelete(null)}
          onConfirm={confirmDeleteTransaction}
        />
      )}
    </div>
  )
}
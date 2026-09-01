import { useState, type FormEvent, type ReactNode } from 'react'
import {
  Banknote,
  Building2,
  CircleDollarSign,
  Coins,
  CreditCard,
  Landmark,
  Pencil,
  Plus,
  ReceiptText,
  Trash2,
  TrendingUp,
  WalletCards,
  X,
} from 'lucide-react'

import ConfirmActionModal from '../components/ui/ConfirmActionModal'
import DraftNotice from '../components/ui/DraftNotice'
import { useFormDraft } from '../lib/useFormDraft'
import { EmojiPicker } from '../components/ui/EmojiPicker'
import { useBudgetData } from '../context/useBudgetData'
import { useHolderFilter } from '../context/useHolderFilter'
import { useDialogA11y } from '../hooks/useDialogA11y'
import {
  filterAccountsByHolder,
  filterTransactionsByHolder,
} from '../lib/holderFilter'
import { getCategoryById } from '../services/budgetStatsService'
import type {
  Account,
  AccountType,
  BudgetCategory,
  BudgetCategoryId,
  Transaction,
} from '../types/budget'
import { formatCurrency } from '../utils/formatCurrency'

type AccountFormValues = {
  name: string
  type: AccountType
  balance: string
  emoji: string
  holder: string
}

const ACCOUNT_DRAFT_KEY = 'budget-account-draft'

function accountDraftHasContent(values: AccountFormValues): boolean {
  return Boolean(
    values.name.trim() || values.balance.trim() || values.holder.trim(),
  )
}

const defaultAccountFormValues: AccountFormValues = {
  name: '',
  type: 'current',
  balance: '',
  emoji: '🏦',
  holder: '',
}

const transferCategory: BudgetCategory = {
  id: 'transfer',
  name: 'Virement',
  emoji: '🔁',
  description: 'Mouvement entre deux comptes personnels.',
  colorClass: 'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/70 text-blue-900',
}

function createAccountId() {
  return `account-${Date.now()}`
}

function getAccountFormValues(account: Account): AccountFormValues {
  return {
    name: account.name,
    type: account.type,
    balance: String(account.balance),
    emoji: account.emoji,
    holder: account.holder ?? '',
  }
}

function parseAmount(value: string) {
  const normalizedValue = value.trim().replace(',', '.')

  if (!normalizedValue) {
    return 0
  }

  return Number(normalizedValue)
}

function getAccountTypeLabel(type: AccountType) {
  if (type === 'current') {
    return 'Compte courant'
  }

  if (type === 'savings') {
    return 'Épargne'
  }

  if (type === 'cash') {
    return 'Espèces'
  }

  return 'Investissement'
}

function getAccountTypeIcon(type: AccountType) {
  if (type === 'current') {
    return <CreditCard className="h-5 w-5" />
  }

  if (type === 'savings') {
    return <Landmark className="h-5 w-5" />
  }

  if (type === 'cash') {
    return <Banknote className="h-5 w-5" />
  }

  return <TrendingUp className="h-5 w-5" />
}

function getAccountTypeStyle(type: AccountType) {
  if (type === 'current') {
    return 'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/70 text-blue-900'
  }

  if (type === 'savings') {
    return 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/70 text-emerald-900'
  }

  if (type === 'cash') {
    return 'border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/70 text-amber-900'
  }

  return 'border-violet-200 bg-gradient-to-br from-violet-50 to-violet-100/70 text-violet-900'
}

function getAccountColorClass(type: AccountType) {
  if (type === 'current') {
    return 'bg-blue-50 text-blue-800 border-blue-100'
  }

  if (type === 'savings') {
    return 'bg-emerald-50 text-emerald-800 border-emerald-100'
  }

  if (type === 'cash') {
    return 'bg-amber-50 text-amber-800 border-amber-100'
  }

  return 'bg-violet-50 text-violet-800 border-violet-100'
}

function getTransactionCategory(categoryId: BudgetCategoryId) {
  if (categoryId === 'transfer') {
    return transferCategory
  }

  return getCategoryById(categoryId)
}

function isTransactionLinkedToAccount(
  transaction: Transaction,
  accountId: string,
) {
  return (
    transaction.accountId === accountId || transaction.toAccountId === accountId
  )
}

function getTransactionAccountLabel({
  transaction,
  sourceAccountName,
  destinationAccountName,
}: {
  transaction: Transaction
  sourceAccountName: string
  destinationAccountName?: string
}) {
  if (transaction.type === 'transfer') {
    return `${sourceAccountName} → ${destinationAccountName ?? 'Compte inconnu'}`
  }

  return sourceAccountName
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
  variant: 'emerald' | 'blue' | 'amber' | 'violet'
}) {
  const variants = {
    emerald: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/70 text-emerald-900',
    blue: 'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/70 text-blue-900',
    amber: 'border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/70 text-amber-900',
    violet: 'border-violet-200 bg-gradient-to-br from-violet-50 to-violet-100/70 text-violet-900',
  }

  const iconVariants = {
    emerald: 'bg-emerald-100 text-emerald-700',
    blue: 'bg-blue-100 text-blue-700',
    amber: 'bg-amber-100 text-amber-700',
    violet: 'bg-violet-100 text-violet-700',
  }

  return (
    <article className={`rounded-[1.75rem] border p-5 ${variants[variant]}`}>
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
    </article>
  )
}

function EmptyAccountsCard({ onCreateAccount }: { onCreateAccount: () => void }) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-stone-200 bg-stone-50 p-8 text-center">
      <p className="text-4xl">🏦</p>

      <h3 className="mt-4 text-xl font-black text-slate-950">
        Aucun compte pour le moment
      </h3>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
        Créez votre premier compte pour pouvoir enregistrer vos revenus,
        dépenses et virements. Chaque transaction viendra ensuite modifier les
        soldes automatiquement.
      </p>

      <button
        type="button"
        onClick={onCreateAccount}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900"
      >
        <Plus className="h-4 w-4" />
        Créer mon premier compte
      </button>
    </div>
  )
}

function AccountFormModal({
  formValues,
  formError,
  isEditing,
  holderSuggestions,
  showDraftNotice,
  onDiscardDraft,
  onClose,
  onChange,
  onSubmit,
}: {
  formValues: AccountFormValues
  formError: string
  isEditing: boolean
  holderSuggestions: string[]
  showDraftNotice: boolean
  onDiscardDraft: () => void
  onClose: () => void
  onChange: (values: AccountFormValues) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  const dialogRef = useDialogA11y<HTMLDivElement>(onClose)

  function updateField<Field extends keyof AccountFormValues>(
    field: Field,
    value: AccountFormValues[Field],
  ) {
    onChange({
      ...formValues,
      [field]: value,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-3 backdrop-blur-sm md:items-center">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-modal-title"
        tabIndex={-1}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-stone-200 bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-10 border-b border-stone-100 bg-white/95 p-5 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-emerald-600">
                {isEditing ? 'Modification' : 'Nouveau compte'}
              </p>

              <h2
                id="account-modal-title"
                className="mt-1 text-2xl font-black text-slate-950"
              >
                {isEditing
                  ? 'Modifier ce compte'
                  : 'Ajouter un compte bancaire'}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {isEditing
                  ? 'Modifiez le nom, le type, l’emoji ou le solde du compte.'
                  : 'Ajoutez un compte courant, un livret, des espèces ou un compte d’investissement.'}
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
          {showDraftNotice && !isEditing && (
            <DraftNotice onDiscard={onDiscardDraft} />
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-[0.35fr_1fr]">
            <EmojiPicker
              value={formValues.emoji}
              onChange={(emoji) => updateField('emoji', emoji)}
              placeholder="🏦"
            />

            <label>
              <span className="text-sm font-bold text-slate-700">
                Nom du compte
              </span>

              <input
                value={formValues.name}
                onChange={(event) => updateField('name', event.target.value)}
                placeholder="Ex : Compte courant, Livret A, PEA..."
                className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label>
              <span className="text-sm font-bold text-slate-700">
                Type de compte
              </span>

              <select
                value={formValues.type}
                onChange={(event) =>
                  updateField('type', event.target.value as AccountType)
                }
                className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              >
                <option value="current">Compte courant</option>
                <option value="savings">Épargne</option>
                <option value="cash">Espèces</option>
                <option value="investment">Investissement</option>
              </select>
            </label>

            <label>
              <span className="text-sm font-bold text-slate-700">
                Solde actuel
              </span>

              <input
                value={formValues.balance}
                onChange={(event) => updateField('balance', event.target.value)}
                placeholder="Ex : 1250"
                inputMode="decimal"
                className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">
              Titulaire <span className="font-medium text-slate-400">(facultatif)</span>
            </span>

            <input
              value={formValues.holder}
              onChange={(event) => updateField('holder', event.target.value)}
              list="account-holders"
              placeholder="Ex : Maxime, Chloé, Commun..."
              className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />

            <datalist id="account-holders">
              {holderSuggestions.map((holder) => (
                <option key={holder} value={holder} />
              ))}
            </datalist>

            <p className="mt-1.5 text-xs text-slate-500">
              Pour séparer vos comptes par personne (ex. Maxime / Chloé /
              Commun).
            </p>
          </label>

          {isEditing && (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
              Le solde peut être ajusté manuellement, mais les revenus,
              dépenses et virements modifient aussi ce solde automatiquement.
            </div>
          )}

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
              {isEditing ? 'Enregistrer les modifications' : 'Ajouter le compte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AccountCard({
  account,
  transactionCount,
  recurringPaymentCount,
  lastTransactionTitle,
  onBalanceChange,
  onEditRequest,
  onDeleteRequest,
}: {
  account: Account
  transactionCount: number
  recurringPaymentCount: number
  lastTransactionTitle?: string
  onBalanceChange: (accountId: string, balance: number) => void
  onEditRequest: (account: Account) => void
  onDeleteRequest: (account: Account) => void
}) {
  const [balanceInput, setBalanceInput] = useState(String(account.balance))
  const hasLinkedItems = transactionCount > 0 || recurringPaymentCount > 0

  function handleBlur() {
    const nextBalance = parseAmount(balanceInput)

    if (!Number.isFinite(nextBalance)) {
      setBalanceInput(String(account.balance))
      return
    }

    onBalanceChange(account.id, nextBalance)
  }

  return (
    <article className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div
            className={`rounded-3xl border p-4 text-3xl ${account.colorClass}`}
          >
            {account.emoji}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-black text-slate-950">
                {account.name}
              </h2>

              {hasLinkedItems && (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                  Utilisé
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {getAccountTypeLabel(account.type)}
              {account.holder.trim() && (
                <>
                  {' · '}
                  <span className="font-bold text-slate-600">
                    {account.holder.trim()}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <div
          className={`rounded-2xl border p-3 ${getAccountTypeStyle(
            account.type,
          )}`}
        >
          {getAccountTypeIcon(account.type)}
        </div>
      </div>

      <div className="mt-6 rounded-3xl bg-stone-50 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          Solde actuel
        </p>

        <div className="mt-2 flex items-center gap-2">
          <input
            value={balanceInput}
            onChange={(event) => setBalanceInput(event.target.value)}
            onBlur={handleBlur}
            inputMode="decimal"
            aria-label={`Solde du compte ${account.name}`}
            className="tabular w-full bg-transparent text-3xl font-black text-slate-950 outline-none"
          />

          <span className="text-xl font-black text-slate-400">€</span>
        </div>

        <p className="mt-2 text-sm text-slate-500">
          Cliquez sur le montant pour ajuster le solde.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-stone-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Mouvements
          </p>

          <p className="mt-1 text-xl font-black text-slate-950">
            {transactionCount}
          </p>
        </div>

        <div className="rounded-2xl bg-stone-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Charges fixes
          </p>

          <p className="mt-1 text-xl font-black text-slate-950">
            {recurringPaymentCount}
          </p>
        </div>

        <div className="rounded-2xl bg-stone-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Dernier mouvement
          </p>

          <p className="mt-1 truncate text-sm font-black text-slate-950">
            {lastTransactionTitle ?? 'Aucun'}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onEditRequest(account)}
          className="flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-stone-200 hover:text-slate-950"
        >
          <Pencil className="h-4 w-4" />
          Modifier
        </button>

        <button
          type="button"
          onClick={() => onDeleteRequest(account)}
          className="flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-sm font-black text-rose-700 transition hover:bg-rose-100"
        >
          <Trash2 className="h-4 w-4" />
          Supprimer
        </button>
      </div>
    </article>
  )
}

function RecentAccountTransaction({
  transaction,
  sourceAccountName,
  destinationAccountName,
}: {
  transaction: Transaction
  sourceAccountName: string
  destinationAccountName?: string
}) {
  const category = getTransactionCategory(transaction.category)
  const isIncome = transaction.type === 'income'
  const isExpense = transaction.type === 'expense'
  const isTransfer = transaction.type === 'transfer'

  const accountLabel = getTransactionAccountLabel({
    transaction,
    sourceAccountName,
    destinationAccountName,
  })

  const amountLabel = isTransfer
    ? `↔ ${formatCurrency(transaction.amount)}`
    : `${isIncome ? '+' : '-'}${formatCurrency(transaction.amount)}`

  return (
    <article className="rounded-[1.5rem] border border-stone-100 bg-stone-50 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`rounded-2xl border p-3 ${
              isIncome
                ? 'border-emerald-100 bg-emerald-50'
                : isExpense
                  ? 'border-rose-100 bg-rose-50'
                  : 'border-blue-100 bg-blue-50'
            }`}
          >
            <span className="text-xl">{category.emoji}</span>
          </div>

          <div className="min-w-0">
            <p className="truncate font-black text-slate-950">
              {transaction.title}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {accountLabel} · {category.name}
            </p>
          </div>
        </div>

        <p
          className={`font-black ${
            isIncome
              ? 'text-emerald-700'
              : isExpense
                ? 'text-rose-700'
                : 'text-blue-700'
          }`}
        >
          {amountLabel}
        </p>
      </div>
    </article>
  )
}

export default function AccountsPage() {
  const {
    accounts: allAccounts,
    transactions: allTransactions,
    recurringPayments,
    addAccount,
    updateAccount,
    updateAccountBalance,
    deleteAccount,
  } = useBudgetData()

  const { selectedHolder } = useHolderFilter()

  // Filtre global « par personne » : on n'affiche que les comptes du titulaire
  // sélectionné (et les transactions rattachées à ses comptes).
  const accounts = filterAccountsByHolder(allAccounts, selectedHolder)
  const transactions = filterTransactionsByHolder(
    allTransactions,
    allAccounts,
    selectedHolder,
  )

  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false)
  const [accountFormValues, setAccountFormValues] =
    useState<AccountFormValues>(defaultAccountFormValues)
  const [accountFormError, setAccountFormError] = useState('')
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null)
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null)
  const [showDraftNotice, setShowDraftNotice] = useState(false)

  const { clearDraft } = useFormDraft({
    key: ACCOUNT_DRAFT_KEY,
    values: accountFormValues,
    isOpen: isAccountFormOpen,
    isEditing: Boolean(accountToEdit),
    hasContent: accountDraftHasContent,
    onRestore: (draft) => {
      setAccountFormValues(draft)
      setAccountToEdit(null)
      setShowDraftNotice(true)
      setIsAccountFormOpen(true)
    },
  })

  const discardDraft = () => {
    clearDraft()
    setShowDraftNotice(false)
    setAccountFormValues(defaultAccountFormValues)
    setAccountFormError('')
  }

  const totalBalance = accounts.reduce((total, account) => {
    return total + account.balance
  }, 0)

  const currentAccountsTotal = accounts
    .filter((account) => account.type === 'current')
    .reduce((total, account) => total + account.balance, 0)

  const savingsTotal = accounts
    .filter((account) => account.type === 'savings')
    .reduce((total, account) => total + account.balance, 0)

  const investmentTotal = accounts
    .filter((account) => account.type === 'investment')
    .reduce((total, account) => total + account.balance, 0)

  // Suggestions de titulaires (pour la saisie) à partir de l'existant.
  const holderSuggestions = Array.from(
    new Set(
      allAccounts.map((account) => account.holder.trim()).filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b))

  // Regroupement des comptes par titulaire (ordre d'apparition conservé).
  const accountGroups: { holder: string; accounts: Account[] }[] = []
  for (const account of accounts) {
    const holder = account.holder.trim() || 'Commun'
    const existing = accountGroups.find((group) => group.holder === holder)

    if (existing) {
      existing.accounts.push(account)
    } else {
      accountGroups.push({ holder, accounts: [account] })
    }
  }

  // On n'affiche les en-têtes par titulaire que si la fonction est réellement
  // utilisée (au moins deux groupes distincts).
  const isGroupedByHolder = accountGroups.length > 1

  const recentTransactions = [...transactions]
    .sort((firstTransaction, secondTransaction) =>
      secondTransaction.date.localeCompare(firstTransaction.date),
    )
    .slice(0, 5)

  const accountToDeleteTransactionCount = accountToDelete
    ? transactions.filter((transaction) =>
        isTransactionLinkedToAccount(transaction, accountToDelete.id),
      ).length
    : 0

  const accountToDeleteRecurringPaymentCount = accountToDelete
    ? recurringPayments.filter(
        (payment) => payment.accountId === accountToDelete.id,
      ).length
    : 0

  const accountToDeleteHasLinkedItems =
    accountToDeleteTransactionCount > 0 ||
    accountToDeleteRecurringPaymentCount > 0

  function getAccountName(accountId?: string) {
    if (!accountId) {
      return 'Compte inconnu'
    }

    return (
      allAccounts.find((account) => account.id === accountId)?.name ??
      'Compte inconnu'
    )
  }

  function openAccountForm() {
    setAccountToEdit(null)
    setAccountFormValues(defaultAccountFormValues)
    setAccountFormError('')
    setIsAccountFormOpen(true)
  }

  function openEditAccountForm(account: Account) {
    setAccountToEdit(account)
    setAccountFormValues(getAccountFormValues(account))
    setAccountFormError('')
    setIsAccountFormOpen(true)
  }

  function closeAccountForm() {
    clearDraft()
    setShowDraftNotice(false)
    setIsAccountFormOpen(false)
    setAccountToEdit(null)
    setAccountFormValues(defaultAccountFormValues)
    setAccountFormError('')
  }

  function handleAccountSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const name = accountFormValues.name.trim()
    const emoji = accountFormValues.emoji.trim() || '🏦'
    const balance = parseAmount(accountFormValues.balance)

    if (!name) {
      setAccountFormError('Ajoutez un nom pour le compte.')
      return
    }

    if (!Number.isFinite(balance)) {
      setAccountFormError('Ajoutez un solde valide.')
      return
    }

    const nextAccount: Account = {
      id: accountToEdit?.id ?? createAccountId(),
      name,
      type: accountFormValues.type,
      balance,
      emoji,
      colorClass: getAccountColorClass(accountFormValues.type),
      holder: accountFormValues.holder.trim(),
    }

    if (accountToEdit) {
      updateAccount(nextAccount)
    } else {
      addAccount(nextAccount)
    }

    closeAccountForm()
  }

  function confirmDeleteAccount() {
    if (!accountToDelete) {
      return
    }

    if (accountToDeleteHasLinkedItems) {
      setAccountToDelete(null)
      return
    }

    deleteAccount(accountToDelete.id)
    setAccountToDelete(null)
  }

  function renderAccountCard(account: Account) {
    const accountTransactions = transactions.filter((transaction) =>
      isTransactionLinkedToAccount(transaction, account.id),
    )

    const accountRecurringPayments = recurringPayments.filter(
      (payment) => payment.accountId === account.id,
    )

    const lastTransaction = [...accountTransactions].sort(
      (firstTransaction, secondTransaction) =>
        secondTransaction.date.localeCompare(firstTransaction.date),
    )[0]

    return (
      <AccountCard
        key={`${account.id}-${account.name}-${account.type}-${account.balance}-${account.emoji}-${account.holder}`}
        account={account}
        transactionCount={accountTransactions.length}
        recurringPaymentCount={accountRecurringPayments.length}
        lastTransactionTitle={lastTransaction?.title}
        onBalanceChange={updateAccountBalance}
        onEditRequest={openEditAccountForm}
        onDeleteRequest={setAccountToDelete}
      />
    )
  }

  return (
    <div className="space-y-6">
      <section className="animate-rise overflow-hidden rounded-[1.75rem] border border-blue-200 bg-gradient-to-br from-blue-100 via-blue-50 to-[#fffef9] shadow-md">
        <div className="relative p-6 md:p-8">
          <div className="absolute -right-6 -top-8 h-52 w-52 rounded-full bg-blue-300/45 blur-3xl" />
          <div className="absolute bottom-0 right-24 h-36 w-36 rounded-full bg-emerald-300/40 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                Comptes bancaires
              </p>

              <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-950 md:text-[2.4rem] md:leading-[1.1]">
                Vue complète de vos comptes
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Suivez votre compte courant, votre épargne, vos espèces et vos
                comptes d’investissement. Les revenus, dépenses et virements
                modifient automatiquement les soldes des comptes concernés.
              </p>
            </div>

            <button
              type="button"
              onClick={openAccountForm}
              className="flex w-fit items-center gap-2 rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-emerald-900"
            >
              <Plus className="h-4 w-4" />
              Nouveau compte
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PageStatCard
          title="Solde total"
          value={formatCurrency(totalBalance)}
          description="Tous les comptes réunis"
          icon={<WalletCards className="h-5 w-5" />}
          variant="emerald"
        />

        <PageStatCard
          title="Comptes courants"
          value={formatCurrency(currentAccountsTotal)}
          description="Argent disponible au quotidien"
          icon={<CreditCard className="h-5 w-5" />}
          variant="blue"
        />

        <PageStatCard
          title="Épargne"
          value={formatCurrency(savingsTotal)}
          description="Argent mis de côté"
          icon={<Coins className="h-5 w-5" />}
          variant="amber"
        />

        <PageStatCard
          title="Investissements"
          value={formatCurrency(investmentTotal)}
          description="Comptes long terme"
          icon={<TrendingUp className="h-5 w-5" />}
          variant="violet"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-emerald-600">
                Liste des comptes
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-950">
                {accounts.length} compte{accounts.length > 1 ? 's' : ''}
              </h2>
            </div>

            <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
              <Building2 className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4">
            {accounts.length === 0 ? (
              <EmptyAccountsCard onCreateAccount={openAccountForm} />
            ) : isGroupedByHolder ? (
              accountGroups.map((group) => {
                const subtotal = group.accounts.reduce(
                  (total, account) => total + account.balance,
                  0,
                )

                return (
                  <div key={group.holder} className="space-y-3">
                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50 px-4 py-2.5">
                      <p className="text-sm font-black text-slate-700">
                        {group.holder} · {group.accounts.length} compte
                        {group.accounts.length > 1 ? 's' : ''}
                      </p>
                      <p className="tabular text-sm font-black text-slate-900">
                        {formatCurrency(subtotal)}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {group.accounts.map(renderAccountCard)}
                    </div>
                  </div>
                )
              })
            ) : (
              accounts.map(renderAccountCard)
            )}
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-emerald-600">
                  Lecture rapide
                </p>

                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  Répartition
                </h2>
              </div>

              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                <CircleDollarSign className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {accounts.length > 0 ? (
                accounts.map((account) => {
                  const percentage =
                    totalBalance > 0
                      ? Math.round((account.balance / totalBalance) * 100)
                      : 0

                  return (
                    <div key={`ratio-${account.id}`}>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-black text-slate-800">
                          {account.emoji} {account.name}
                        </p>

                        <p className="text-sm font-black text-slate-500">
                          {percentage} %
                        </p>
                      </div>

                      <div className="h-3 overflow-hidden rounded-full bg-stone-100">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{
                            width: `${account.balance > 0 ? Math.max(percentage, 3) : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-stone-200 bg-stone-50 p-8 text-center">
                  <p className="text-3xl">📊</p>

                  <h3 className="mt-4 text-xl font-black text-slate-950">
                    Répartition vide
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Ajoutez un compte pour voir la répartition de votre argent.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-emerald-600">
                  Activité récente
                </p>

                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  Derniers mouvements
                </h2>
              </div>

              <div className="rounded-2xl bg-stone-100 p-3 text-slate-700">
                <ReceiptText className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => (
                  <RecentAccountTransaction
                    key={transaction.id}
                    transaction={transaction}
                    sourceAccountName={getAccountName(transaction.accountId)}
                    destinationAccountName={getAccountName(
                      transaction.toAccountId,
                    )}
                  />
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-stone-200 bg-stone-50 p-8 text-center">
                  <p className="text-3xl">🧾</p>

                  <h3 className="mt-4 text-xl font-black text-slate-950">
                    Aucun mouvement
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Les transactions et virements liés aux comptes apparaîtront
                    ici.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </section>

      {isAccountFormOpen && (
        <AccountFormModal
          formValues={accountFormValues}
          formError={accountFormError}
          isEditing={Boolean(accountToEdit)}
          holderSuggestions={holderSuggestions}
          showDraftNotice={showDraftNotice}
          onDiscardDraft={discardDraft}
          onClose={closeAccountForm}
          onChange={setAccountFormValues}
          onSubmit={handleAccountSubmit}
        />
      )}

      {accountToDelete && (
        <ConfirmActionModal
          eyebrow={
            accountToDeleteHasLinkedItems ? 'Compte utilisé' : 'Suppression'
          }
          title={
            accountToDeleteHasLinkedItems
              ? 'Impossible de supprimer ce compte'
              : 'Supprimer ce compte ?'
          }
          description={
            accountToDeleteHasLinkedItems
              ? `"${accountToDelete.name}" est lié à ${accountToDeleteTransactionCount} mouvement${
                  accountToDeleteTransactionCount > 1 ? 's' : ''
                } et ${accountToDeleteRecurringPaymentCount} charge${
                  accountToDeleteRecurringPaymentCount > 1 ? 's' : ''
                } fixe${
                  accountToDeleteRecurringPaymentCount > 1 ? 's' : ''
                }. Pour éviter de casser vos données, supprimez ou réattribuez d’abord ces éléments.`
              : `Vous êtes sur le point de supprimer "${accountToDelete.name}". Cette action retirera ce compte de votre suivi.`
          }
          confirmLabel={
            accountToDeleteHasLinkedItems ? 'Compris' : 'Supprimer le compte'
          }
          cancelLabel="Annuler"
          icon={<Trash2 className="h-5 w-5" />}
          variant={accountToDeleteHasLinkedItems ? 'warning' : 'danger'}
          onCancel={() => setAccountToDelete(null)}
          onConfirm={confirmDeleteAccount}
        />
      )}
    </div>
  )
}
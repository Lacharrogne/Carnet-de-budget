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
import { useBudgetData } from '../context/useBudgetData'
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
}

const defaultAccountFormValues: AccountFormValues = {
  name: '',
  type: 'current',
  balance: '',
  emoji: '🏦',
}

const transferCategory: BudgetCategory = {
  id: 'transfer',
  name: 'Virement',
  emoji: '🔁',
  description: 'Mouvement entre deux comptes personnels.',
  colorClass: 'border-blue-100 bg-blue-50 text-blue-900',
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
    return 'border-blue-100 bg-blue-50 text-blue-900'
  }

  if (type === 'savings') {
    return 'border-emerald-100 bg-emerald-50 text-emerald-900'
  }

  if (type === 'cash') {
    return 'border-amber-100 bg-amber-50 text-amber-900'
  }

  return 'border-violet-100 bg-violet-50 text-violet-900'
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
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-900',
    blue: 'border-blue-100 bg-blue-50 text-blue-900',
    amber: 'border-amber-100 bg-amber-50 text-amber-900',
    violet: 'border-violet-100 bg-violet-50 text-violet-900',
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
          <p className="mt-3 text-3xl font-black tracking-tight">{value}</p>
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
        Crée ton premier compte pour pouvoir enregistrer tes revenus, dépenses
        et virements. Chaque transaction viendra ensuite modifier les soldes
        automatiquement.
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
  onClose,
  onChange,
  onSubmit,
}: {
  formValues: AccountFormValues
  formError: string
  isEditing: boolean
  onClose: () => void
  onChange: (values: AccountFormValues) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
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
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-stone-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-stone-100 bg-white/95 p-5 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-emerald-600">
                {isEditing ? 'Modification' : 'Nouveau compte'}
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-950">
                {isEditing
                  ? 'Modifier ce compte'
                  : 'Ajouter un compte bancaire'}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {isEditing
                  ? 'Modifie le nom, le type, l’emoji ou le solde du compte.'
                  : 'Ajoute un compte courant, un livret, des espèces ou un compte d’investissement.'}
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
          <div className="grid gap-4 md:grid-cols-[0.35fr_1fr]">
            <label>
              <span className="text-sm font-bold text-slate-700">Emoji</span>

              <input
                value={formValues.emoji}
                onChange={(event) => updateField('emoji', event.target.value)}
                placeholder="🏦"
                maxLength={4}
                className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-center text-xl font-medium outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>

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

          <div className="grid gap-4 md:grid-cols-2">
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
            className="w-full bg-transparent text-3xl font-black text-slate-950 outline-none"
          />

          <span className="text-xl font-black text-slate-400">€</span>
        </div>

        <p className="mt-2 text-sm text-slate-500">
          Clique sur le montant pour ajuster le solde.
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
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
    accounts,
    transactions,
    recurringPayments,
    addAccount,
    updateAccount,
    updateAccountBalance,
    deleteAccount,
  } = useBudgetData()

  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false)
  const [accountFormValues, setAccountFormValues] =
    useState<AccountFormValues>(defaultAccountFormValues)
  const [accountFormError, setAccountFormError] = useState('')
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null)
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null)

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
      accounts.find((account) => account.id === accountId)?.name ??
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
      setAccountFormError('Ajoute un nom pour le compte.')
      return
    }

    if (!Number.isFinite(balance)) {
      setAccountFormError('Ajoute un solde valide.')
      return
    }

    const nextAccount: Account = {
      id: accountToEdit?.id ?? createAccountId(),
      name,
      type: accountFormValues.type,
      balance,
      emoji,
      colorClass: getAccountColorClass(accountFormValues.type),
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

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm">
        <div className="relative p-6 md:p-8">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-blue-100/70 blur-3xl" />
          <div className="absolute bottom-0 right-24 h-32 w-32 rounded-full bg-emerald-100/70 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-600">
                Comptes bancaires
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                Vue complète de tes comptes
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Suis ton compte courant, ton épargne, tes espèces et tes comptes
                d’investissement. Les revenus, dépenses et virements modifient
                automatiquement les soldes des comptes concernés.
              </p>
            </div>

            <button
              type="button"
              onClick={openAccountForm}
              className="flex w-fit items-center gap-2 rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900"
            >
              <Plus className="h-4 w-4" />
              Nouveau compte
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
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

          <div className="mt-6 grid gap-4">
            {accounts.length > 0 ? (
              accounts.map((account) => {
                const accountTransactions = transactions.filter(
                  (transaction) =>
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
                    key={`${account.id}-${account.name}-${account.type}-${account.balance}-${account.emoji}`}
                    account={account}
                    transactionCount={accountTransactions.length}
                    recurringPaymentCount={accountRecurringPayments.length}
                    lastTransactionTitle={lastTransaction?.title}
                    onBalanceChange={updateAccountBalance}
                    onEditRequest={openEditAccountForm}
                    onDeleteRequest={setAccountToDelete}
                  />
                )
              })
            ) : (
              <EmptyAccountsCard onCreateAccount={openAccountForm} />
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
                    Ajoute un compte pour voir la répartition de ton argent.
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
                }. Pour éviter de casser tes données, supprime ou réattribue d’abord ces éléments.`
              : `Tu es sur le point de supprimer "${accountToDelete.name}". Cette action retirera ce compte de ton suivi.`
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
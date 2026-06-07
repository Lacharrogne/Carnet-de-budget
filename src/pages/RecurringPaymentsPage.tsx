import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Pencil,
  Plus,
  ReceiptText,
  Repeat2,
  ToggleLeft,
  ToggleRight,
  Trash2,
  WalletCards,
  X,
} from 'lucide-react'

import ConfirmActionModal from '../components/ui/ConfirmActionModal'
import { useBudgetData } from '../context/useBudgetData'
import { budgetCategories } from '../data/budgetCategories'
import { getCategoryById } from '../services/budgetStatsService'
import type {
  Account,
  BudgetCategoryId,
  RecurringPayment,
} from '../types/budget'
import { formatCurrency } from '../utils/formatCurrency'

type RecurringPaymentFormValues = {
  title: string
  amount: string
  dayOfMonth: string
  category: BudgetCategoryId
  accountId: string
}

const defaultRecurringPaymentFormValues: RecurringPaymentFormValues = {
  title: '',
  amount: '',
  dayOfMonth: '1',
  category: budgetCategories[0].id,
  accountId: '',
}

function createRecurringPaymentId() {
  return `recurring-payment-${Date.now()}`
}

function getRecurringPaymentFormValues(
  payment: RecurringPayment,
): RecurringPaymentFormValues {
  return {
    title: payment.title,
    amount: String(payment.amount),
    dayOfMonth: String(payment.dayOfMonth),
    category: payment.category,
    accountId: payment.accountId,
  }
}

function getDefaultFormValues(accounts: Account[]): RecurringPaymentFormValues {
  return {
    ...defaultRecurringPaymentFormValues,
    accountId: accounts[0]?.id ?? '',
  }
}

function parseAmount(value: string) {
  const normalizedValue = value.trim().replace(',', '.')

  if (!normalizedValue) {
    return 0
  }

  return Number(normalizedValue)
}

function getDaysBeforePayment(dayOfMonth: number) {
  const today = new Date()
  const currentDay = today.getDate()

  if (dayOfMonth >= currentDay) {
    return dayOfMonth - currentDay
  }

  const lastDayOfCurrentMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
  ).getDate()

  return lastDayOfCurrentMonth - currentDay + dayOfMonth
}

function getNextPaymentLabel(dayOfMonth: number) {
  const daysBeforePayment = getDaysBeforePayment(dayOfMonth)

  if (daysBeforePayment === 0) {
    return 'Aujourd’hui'
  }

  if (daysBeforePayment === 1) {
    return 'Demain'
  }

  return `Dans ${daysBeforePayment} jours`
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

function NoAccountWarning() {
  return (
    <section className="rounded-[2rem] border border-amber-100 bg-amber-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-white p-3 text-amber-700 shadow-sm">
            <WalletCards className="h-6 w-6" />
          </div>

          <div>
            <p className="text-sm font-semibold text-amber-700">
              Compte nécessaire
            </p>

            <h2 className="mt-1 text-xl font-black text-amber-950">
              Crée d’abord un compte pour ajouter une charge fixe
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-800/80">
              Un abonnement ou un prélèvement doit être lié à un compte pour
              savoir d’où sort l’argent chaque mois. Une fois ton premier compte
              créé, tu pourras ajouter Netflix, loyer, assurance, forfaits et
              autres paiements récurrents.
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

function RecurringPaymentFormModal({
  formValues,
  formError,
  accounts,
  isEditing,
  onClose,
  onChange,
  onSubmit,
}: {
  formValues: RecurringPaymentFormValues
  formError: string
  accounts: Account[]
  isEditing: boolean
  onClose: () => void
  onChange: (values: RecurringPaymentFormValues) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  const selectedCategory =
    budgetCategories.find((category) => category.id === formValues.category) ??
    budgetCategories[0]

  function updateField<Field extends keyof RecurringPaymentFormValues>(
    field: Field,
    value: RecurringPaymentFormValues[Field],
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
                {isEditing ? 'Modification' : 'Nouveau paiement récurrent'}
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-950">
                {isEditing
                  ? 'Modifier cette charge fixe'
                  : 'Ajouter une charge fixe'}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {isEditing
                  ? 'Modifie le nom, le montant, le jour, la catégorie ou le compte associé.'
                  : 'Ajoute un abonnement, un loyer, une assurance ou un prélèvement mensuel.'}
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
          <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-white p-4">
                <span className="text-3xl">{selectedCategory.emoji}</span>
              </div>

              <div>
                <p className="font-black text-slate-950">
                  {selectedCategory.name}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {selectedCategory.description}
                </p>
              </div>
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">Nom</span>

            <input
              value={formValues.title}
              onChange={(event) => updateField('title', event.target.value)}
              placeholder="Ex : Netflix, loyer, assurance..."
              className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="text-sm font-bold text-slate-700">
                Montant mensuel
              </span>

              <input
                value={formValues.amount}
                onChange={(event) => updateField('amount', event.target.value)}
                placeholder="Ex : 14"
                inputMode="decimal"
                className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label>
              <span className="text-sm font-bold text-slate-700">
                Jour du mois
              </span>

              <input
                value={formValues.dayOfMonth}
                onChange={(event) =>
                  updateField('dayOfMonth', event.target.value)
                }
                placeholder="Ex : 5"
                inputMode="numeric"
                className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="text-sm font-bold text-slate-700">
                Catégorie
              </span>

              <select
                value={formValues.category}
                onChange={(event) =>
                  updateField('category', event.target.value as BudgetCategoryId)
                }
                className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              >
                {budgetCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.emoji} {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="text-sm font-bold text-slate-700">Compte</span>

              <select
                value={formValues.accountId}
                onChange={(event) =>
                  updateField('accountId', event.target.value)
                }
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
          </div>

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
                : 'Ajouter le paiement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function RecurringPaymentCard({
  payment,
  accountName,
  onToggle,
  onEditRequest,
  onDeleteRequest,
}: {
  payment: RecurringPayment
  accountName: string
  onToggle: (paymentId: string) => void
  onEditRequest: (payment: RecurringPayment) => void
  onDeleteRequest: (payment: RecurringPayment) => void
}) {
  const category = getCategoryById(payment.category)

  return (
    <article className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className={`rounded-3xl border p-4 ${category.colorClass}`}>
            <span className="text-3xl">{category.emoji}</span>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-black text-slate-950">
                {payment.title}
              </h2>

              <span
                className={`rounded-full px-3 py-1 text-xs font-black ${
                  payment.isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-stone-100 text-slate-500'
                }`}
              >
                {payment.isActive ? 'Actif' : 'Désactivé'}
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {category.name} · {accountName} · Le {payment.dayOfMonth} du mois
            </p>
          </div>
        </div>

        <div className="text-left md:text-right">
          <p className="text-2xl font-black text-rose-700">
            -{formatCurrency(payment.amount)}
          </p>

          <p className="mt-1 text-sm font-bold text-slate-500">
            {getNextPaymentLabel(payment.dayOfMonth)}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-stone-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Montant
          </p>

          <p className="mt-2 text-xl font-black text-slate-950">
            {formatCurrency(payment.amount)}
          </p>
        </div>

        <div className="rounded-2xl bg-stone-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Prochain paiement
          </p>

          <p className="mt-2 text-xl font-black text-amber-700">
            {getNextPaymentLabel(payment.dayOfMonth)}
          </p>
        </div>

        <div className="rounded-2xl bg-stone-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Compte
          </p>

          <p className="mt-2 text-xl font-black text-slate-950">
            {accountName}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onEditRequest(payment)}
          className="flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-stone-200 hover:text-slate-950"
        >
          <Pencil className="h-4 w-4" />
          Modifier
        </button>

        <button
          type="button"
          onClick={() => onToggle(payment.id)}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black transition ${
            payment.isActive
              ? 'bg-stone-100 text-slate-600 hover:bg-stone-200'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          {payment.isActive ? (
            <ToggleLeft className="h-4 w-4" />
          ) : (
            <ToggleRight className="h-4 w-4" />
          )}
          {payment.isActive ? 'Désactiver' : 'Réactiver'}
        </button>

        <button
          type="button"
          onClick={() => onDeleteRequest(payment)}
          className="flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-sm font-black text-rose-700 transition hover:bg-rose-100"
        >
          <Trash2 className="h-4 w-4" />
          Supprimer
        </button>
      </div>
    </article>
  )
}

export default function RecurringPaymentsPage() {
  const {
    accounts,
    recurringPayments,
    addRecurringPayment,
    updateRecurringPayment,
    toggleRecurringPayment,
    deleteRecurringPayment,
  } = useBudgetData()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formValues, setFormValues] = useState<RecurringPaymentFormValues>(() =>
    getDefaultFormValues(accounts),
  )
  const [formError, setFormError] = useState('')
  const [paymentToEdit, setPaymentToEdit] =
    useState<RecurringPayment | null>(null)
  const [paymentToDelete, setPaymentToDelete] =
    useState<RecurringPayment | null>(null)

  const [searchParams, setSearchParams] = useSearchParams()
  const action = searchParams.get('action')
  const hasAccounts = accounts.length > 0
  const shouldShowForm = hasAccounts && (isFormOpen || action === 'new')

  const activePayments = recurringPayments.filter((payment) => payment.isActive)
  const inactivePayments = recurringPayments.filter(
    (payment) => !payment.isActive,
  )

  const monthlyTotal = activePayments.reduce((total, payment) => {
    return total + payment.amount
  }, 0)

  const yearlyTotal = monthlyTotal * 12

  const averagePayment =
    activePayments.length > 0
      ? Math.round(monthlyTotal / activePayments.length)
      : 0

  const nextPayment = [...activePayments].sort((firstPayment, secondPayment) => {
    return (
      getDaysBeforePayment(firstPayment.dayOfMonth) -
      getDaysBeforePayment(secondPayment.dayOfMonth)
    )
  })[0]

  function clearActionParam() {
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete('action')
    setSearchParams(nextSearchParams, { replace: true })
  }

  function openForm() {
    if (!hasAccounts) {
      setFormError('Crée d’abord un compte avant d’ajouter une charge fixe.')

      if (action === 'new') {
        clearActionParam()
      }

      return
    }

    setPaymentToEdit(null)
    setFormValues(getDefaultFormValues(accounts))
    setFormError('')
    setIsFormOpen(true)
  }

  function openEditForm(payment: RecurringPayment) {
    if (!hasAccounts) {
      setFormError('Crée d’abord un compte avant de modifier une charge fixe.')
      return
    }

    setPaymentToEdit(payment)
    setFormValues(getRecurringPaymentFormValues(payment))
    setFormError('')
    setIsFormOpen(true)

    if (action === 'new') {
      clearActionParam()
    }
  }

  function closeForm() {
    setIsFormOpen(false)
    setPaymentToEdit(null)
    setFormValues(getDefaultFormValues(accounts))
    setFormError('')

    if (action === 'new') {
      clearActionParam()
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const title = formValues.title.trim()
    const amount = parseAmount(formValues.amount)
    const dayOfMonth = Number(formValues.dayOfMonth)

    if (!hasAccounts) {
      setFormError('Crée d’abord un compte avant d’ajouter une charge fixe.')
      return
    }

    if (!title) {
      setFormError('Ajoute un nom pour ce paiement.')
      return
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError('Ajoute un montant supérieur à 0 €.')
      return
    }

    if (
      !Number.isInteger(dayOfMonth) ||
      dayOfMonth < 1 ||
      dayOfMonth > 31
    ) {
      setFormError('Le jour du mois doit être compris entre 1 et 31.')
      return
    }

    if (!formValues.accountId) {
      setFormError('Choisis le compte associé à ce paiement.')
      return
    }

    const nextPayment: RecurringPayment = {
      id: paymentToEdit?.id ?? createRecurringPaymentId(),
      title,
      amount,
      dayOfMonth,
      category: formValues.category,
      accountId: formValues.accountId,
      isActive: paymentToEdit?.isActive ?? true,
    }

    if (paymentToEdit) {
      updateRecurringPayment(nextPayment)
    } else {
      addRecurringPayment(nextPayment)
    }

    closeForm()
  }

  function confirmDeletePayment() {
    if (!paymentToDelete) {
      return
    }

    deleteRecurringPayment(paymentToDelete.id)
    setPaymentToDelete(null)
  }

  function getAccountName(accountId: string) {
    return (
      accounts.find((account) => account.id === accountId)?.name ??
      'Compte inconnu'
    )
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm">
        <div className="relative p-6 md:p-8">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-rose-100/70 blur-3xl" />
          <div className="absolute bottom-0 right-24 h-32 w-32 rounded-full bg-amber-100/70 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-600">
                Abonnements et charges fixes
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                Anticiper les paiements récurrents
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Suis tes abonnements, loyers, assurances et prélèvements
                mensuels. Les charges fixes sont synchronisées avec Supabase et
                restent après rafraîchissement.
              </p>
            </div>

            {hasAccounts ? (
              <button
                type="button"
                onClick={openForm}
                className="flex w-fit items-center gap-2 rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900"
              >
                <Plus className="h-4 w-4" />
                Nouveau paiement
              </button>
            ) : (
              <Link
                to="/comptes"
                className="flex w-fit items-center gap-2 rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900"
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
          title="Charges actives"
          value={formatCurrency(monthlyTotal)}
          description="Total mensuel"
          icon={<Repeat2 className="h-5 w-5" />}
          variant="rose"
        />

        <PageStatCard
          title="Coût annuel"
          value={formatCurrency(yearlyTotal)}
          description="Projection sur 12 mois"
          icon={<CalendarDays className="h-5 w-5" />}
          variant="amber"
        />

        <PageStatCard
          title="Paiements actifs"
          value={String(activePayments.length)}
          description={`${inactivePayments.length} désactivé${
            inactivePayments.length > 1 ? 's' : ''
          }`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          variant="emerald"
        />

        <PageStatCard
          title="Moyenne"
          value={formatCurrency(averagePayment)}
          description="Par paiement actif"
          icon={<WalletCards className="h-5 w-5" />}
          variant="blue"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-emerald-600">
                Prochain paiement
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-950">
                À surveiller bientôt
              </h2>
            </div>

            <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
              <Clock className="h-5 w-5" />
            </div>
          </div>

          {nextPayment ? (
            <div className="mt-6 rounded-[1.5rem] bg-amber-50 p-5">
              <p className="text-sm font-semibold text-amber-700">
                {getNextPaymentLabel(nextPayment.dayOfMonth)}
              </p>

              <p className="mt-2 text-3xl font-black text-amber-950">
                {nextPayment.title}
              </p>

              <p className="mt-2 text-sm text-amber-800/80">
                Montant prévu : {formatCurrency(nextPayment.amount)}.
              </p>
            </div>
          ) : (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-stone-200 bg-stone-50 p-8 text-center">
              <p className="text-3xl">☕</p>

              <h3 className="mt-4 text-xl font-black text-slate-950">
                Rien de prévu
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Aucun paiement récurrent actif pour le moment.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-emerald-600">
                Lecture rapide
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-950">
                Poids des charges fixes
              </h2>
            </div>

            <div className="rounded-2xl bg-rose-50 p-3 text-rose-700">
              <ReceiptText className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-6 text-sm leading-6 text-slate-600">
            Les charges fixes sont les dépenses les plus importantes à prévoir,
            car elles reviennent automatiquement. Elles sont sauvegardées dans
            Supabase et pourront plus tard générer automatiquement les paiements
            du mois.
          </p>

          <div className="mt-5 rounded-[1.5rem] bg-rose-50 p-5">
            <p className="text-sm font-semibold text-rose-700">
              Total à anticiper
            </p>

            <p className="mt-2 text-3xl font-black text-rose-950">
              {formatCurrency(monthlyTotal)}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-600">
              Liste des paiements
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-950">
              {recurringPayments.length} paiement
              {recurringPayments.length > 1 ? 's' : ''}
            </h2>
          </div>

          {hasAccounts ? (
            <button
              type="button"
              onClick={openForm}
              className="flex w-fit items-center gap-2 rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900"
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </button>
          ) : (
            <Link
              to="/comptes"
              className="flex w-fit items-center gap-2 rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900"
            >
              <Plus className="h-4 w-4" />
              Créer un compte
            </Link>
          )}
        </div>

        <div className="mt-6 space-y-4">
          {recurringPayments.length > 0 ? (
            recurringPayments.map((payment) => (
              <RecurringPaymentCard
                key={`${payment.id}-${payment.title}-${payment.amount}-${payment.dayOfMonth}-${payment.category}-${payment.accountId}-${payment.isActive}`}
                payment={payment}
                accountName={getAccountName(payment.accountId)}
                onToggle={toggleRecurringPayment}
                onEditRequest={openEditForm}
                onDeleteRequest={setPaymentToDelete}
              />
            ))
          ) : (
            <div className="rounded-[2rem] border border-dashed border-stone-200 bg-stone-50 p-8 text-center">
              <p className="text-3xl">{hasAccounts ? '🔁' : '🏦'}</p>

              <h3 className="mt-4 text-xl font-black text-slate-950">
                {hasAccounts
                  ? 'Aucun paiement récurrent'
                  : 'Aucun compte disponible'}
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {hasAccounts
                  ? 'Ajoute tes charges fixes pour mieux anticiper le mois.'
                  : 'Crée ton premier compte pour pouvoir enregistrer des abonnements et prélèvements.'}
              </p>
            </div>
          )}
        </div>
      </section>

      {shouldShowForm && (
        <RecurringPaymentFormModal
          formValues={formValues}
          formError={formError}
          accounts={accounts}
          isEditing={Boolean(paymentToEdit)}
          onClose={closeForm}
          onChange={setFormValues}
          onSubmit={handleSubmit}
        />
      )}

      {paymentToDelete && (
        <ConfirmActionModal
          eyebrow="Suppression"
          title="Supprimer ce paiement ?"
          description={`Tu es sur le point de supprimer "${paymentToDelete.title}". Cette charge fixe sera supprimée de Supabase.`}
          confirmLabel="Supprimer le paiement"
          cancelLabel="Annuler"
          icon={<Trash2 className="h-5 w-5" />}
          variant="danger"
          onCancel={() => setPaymentToDelete(null)}
          onConfirm={confirmDeletePayment}
        />
      )}
    </div>
  )
}
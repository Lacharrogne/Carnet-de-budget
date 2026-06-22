import { useState, type FormEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Coins,
  Landmark,
  Pencil,
  Percent,
  Plus,
  Trash2,
  TrendingUp,
  WalletCards,
  X,
} from 'lucide-react'

import ConfirmActionModal from '../components/ui/ConfirmActionModal'
import { useDialogA11y } from '../hooks/useDialogA11y'
import { useBudgetData } from '../context/useBudgetData'
import type { Investment, InvestmentType } from '../types/investment'
import { formatCurrency } from '../utils/formatCurrency'

type InvestmentFormValues = {
  title: string
  emoji: string
  type: InvestmentType
  platform: string
  investedAmount: string
  currentValue: string
  note: string
}

type StatVariant = 'emerald' | 'blue' | 'rose' | 'amber' | 'violet'

const defaultInvestmentFormValues: InvestmentFormValues = {
  title: '',
  emoji: '📈',
  type: 'etf',
  platform: '',
  investedAmount: '',
  currentValue: '',
  note: '',
}

function createInvestmentId() {
  return `investment-${Date.now()}`
}

function getInvestmentFormValues(investment: Investment): InvestmentFormValues {
  return {
    title: investment.title,
    emoji: investment.emoji,
    type: investment.type,
    platform: investment.platform,
    investedAmount: String(investment.investedAmount),
    currentValue: String(investment.currentValue),
    note: investment.note ?? '',
  }
}

function parseAmount(value: string) {
  const normalizedValue = value.trim().replace(',', '.')

  if (!normalizedValue) {
    return 0
  }

  return Number(normalizedValue)
}

function getInvestmentTypeLabel(type: InvestmentType) {
  if (type === 'etf') {
    return 'ETF'
  }

  if (type === 'stock') {
    return 'Action'
  }

  if (type === 'crypto') {
    return 'Crypto'
  }

  if (type === 'real_estate') {
    return 'Immobilier'
  }

  if (type === 'cash') {
    return 'Liquidités'
  }

  return 'Autre'
}

function getInvestmentTypeClasses(type: InvestmentType) {
  if (type === 'etf') {
    return {
      card: 'border-blue-100 bg-blue-50 text-blue-900',
      icon: 'bg-blue-100 text-blue-700',
      bar: 'bg-blue-500',
    }
  }

  if (type === 'stock') {
    return {
      card: 'border-emerald-100 bg-emerald-50 text-emerald-900',
      icon: 'bg-emerald-100 text-emerald-700',
      bar: 'bg-emerald-500',
    }
  }

  if (type === 'crypto') {
    return {
      card: 'border-amber-100 bg-amber-50 text-amber-900',
      icon: 'bg-amber-100 text-amber-700',
      bar: 'bg-amber-500',
    }
  }

  if (type === 'real_estate') {
    return {
      card: 'border-violet-100 bg-violet-50 text-violet-900',
      icon: 'bg-violet-100 text-violet-700',
      bar: 'bg-violet-500',
    }
  }

  if (type === 'cash') {
    return {
      card: 'border-stone-200 bg-stone-50 text-slate-900',
      icon: 'bg-stone-100 text-slate-700',
      bar: 'bg-slate-500',
    }
  }

  return {
    card: 'border-rose-100 bg-rose-50 text-rose-900',
    icon: 'bg-rose-100 text-rose-700',
    bar: 'bg-rose-500',
  }
}

function getInvestmentGain(investment: Investment) {
  return investment.currentValue - investment.investedAmount
}

function getInvestmentReturn(investment: Investment) {
  if (investment.investedAmount <= 0) {
    return 0
  }

  return Math.round(
    ((investment.currentValue - investment.investedAmount) /
      investment.investedAmount) *
      100,
  )
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
  variant: StatVariant
}) {
  const variants = {
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-900',
    blue: 'border-blue-100 bg-blue-50 text-blue-900',
    rose: 'border-rose-100 bg-rose-50 text-rose-900',
    amber: 'border-amber-100 bg-amber-50 text-amber-900',
    violet: 'border-violet-100 bg-violet-50 text-violet-900',
  }

  const iconVariants = {
    emerald: 'bg-emerald-100 text-emerald-700',
    blue: 'bg-blue-100 text-blue-700',
    rose: 'bg-rose-100 text-rose-700',
    amber: 'bg-amber-100 text-amber-700',
    violet: 'bg-violet-100 text-violet-700',
  }

  return (
    <article className={`rounded-[1.75rem] border p-5 ${variants[variant]}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="tabular mt-3 text-3xl font-black tracking-tight">{value}</p>
          <p className="mt-2 text-sm opacity-75">{description}</p>
        </div>

        <div className={`rounded-2xl p-3 ${iconVariants[variant]}`}>
          {icon}
        </div>
      </div>
    </article>
  )
}

function InvestmentFormModal({
  formValues,
  formError,
  isEditing,
  onClose,
  onChange,
  onSubmit,
}: {
  formValues: InvestmentFormValues
  formError: string
  isEditing: boolean
  onClose: () => void
  onChange: (values: InvestmentFormValues) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  const dialogRef = useDialogA11y<HTMLDivElement>(onClose)

  function updateField<Field extends keyof InvestmentFormValues>(
    field: Field,
    value: InvestmentFormValues[Field],
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
        aria-labelledby="investment-modal-title"
        tabIndex={-1}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-stone-200 bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-10 border-b border-stone-100 bg-white/95 p-5 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-emerald-600">
                {isEditing ? 'Modification' : 'Nouvel investissement'}
              </p>

              <h2
                id="investment-modal-title"
                className="mt-1 text-2xl font-black text-slate-950"
              >
                {isEditing ? 'Modifier ce placement' : 'Ajouter un placement'}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {isEditing
                  ? 'Modifiez le nom, le type, la plateforme, les montants ou la note.'
                  : 'Ajoutez un ETF, une action, une crypto ou un autre placement à suivre.'}
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
                placeholder="📈"
                maxLength={4}
                className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-center text-xl font-medium outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label>
              <span className="text-sm font-bold text-slate-700">
                Nom du placement
              </span>

              <input
                value={formValues.title}
                onChange={(event) => updateField('title', event.target.value)}
                placeholder="Ex : MSCI World, Bitcoin, Apple..."
                className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="text-sm font-bold text-slate-700">
                Type de placement
              </span>

              <select
                value={formValues.type}
                onChange={(event) =>
                  updateField('type', event.target.value as InvestmentType)
                }
                className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              >
                <option value="etf">ETF</option>
                <option value="stock">Action</option>
                <option value="crypto">Crypto</option>
                <option value="real_estate">Immobilier</option>
                <option value="cash">Liquidités</option>
                <option value="other">Autre</option>
              </select>
            </label>

            <label>
              <span className="text-sm font-bold text-slate-700">
                Plateforme / enveloppe
              </span>

              <input
                value={formValues.platform}
                onChange={(event) =>
                  updateField('platform', event.target.value)
                }
                placeholder="Ex : PEA, Trade Republic, CTO..."
                className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="text-sm font-bold text-slate-700">
                Montant investi
              </span>

              <input
                value={formValues.investedAmount}
                onChange={(event) =>
                  updateField('investedAmount', event.target.value)
                }
                placeholder="Ex : 1200"
                inputMode="decimal"
                className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label>
              <span className="text-sm font-bold text-slate-700">
                Valeur actuelle
              </span>

              <input
                value={formValues.currentValue}
                onChange={(event) =>
                  updateField('currentValue', event.target.value)
                }
                placeholder="Ex : 1260"
                inputMode="decimal"
                className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">
              Note facultative
            </span>

            <textarea
              value={formValues.note}
              onChange={(event) => updateField('note', event.target.value)}
              placeholder="Ex : stratégie long terme, DCA mensuel, placement risqué..."
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
              {isEditing ? 'Enregistrer les modifications' : 'Ajouter le placement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function InvestmentCard({
  investment,
  onCurrentValueChange,
  onEditRequest,
  onDeleteRequest,
}: {
  investment: Investment
  onCurrentValueChange: (investmentId: string, currentValue: number) => void
  onEditRequest: (investment: Investment) => void
  onDeleteRequest: (investment: Investment) => void
}) {
  const [currentValueInput, setCurrentValueInput] = useState(
    String(investment.currentValue),
  )

  const gain = getInvestmentGain(investment)
  const returnPercentage = getInvestmentReturn(investment)
  const isPositive = gain >= 0
  const classes = getInvestmentTypeClasses(investment.type)

  function handleBlur() {
    const nextValue = parseAmount(currentValueInput)

    if (!Number.isFinite(nextValue) || nextValue < 0) {
      setCurrentValueInput(String(investment.currentValue))
      return
    }

    onCurrentValueChange(investment.id, nextValue)
  }

  function increaseValue() {
    const nextValue = investment.currentValue + 50
    setCurrentValueInput(String(nextValue))
    onCurrentValueChange(investment.id, nextValue)
  }

  function decreaseValue() {
    const nextValue = Math.max(investment.currentValue - 50, 0)
    setCurrentValueInput(String(nextValue))
    onCurrentValueChange(investment.id, nextValue)
  }

  return (
    <article className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className={`rounded-3xl border p-4 text-3xl ${classes.card}`}>
            {investment.emoji}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-black text-slate-950">
                {investment.title}
              </h2>

              <span
                className={`rounded-full px-3 py-1 text-xs font-black ${classes.card}`}
              >
                {getInvestmentTypeLabel(investment.type)}
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {investment.platform || 'Plateforme non renseignée'}
            </p>

            {investment.note && (
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {investment.note}
              </p>
            )}
          </div>
        </div>

        <div className="text-left md:text-right">
          <p
            className={`tabular text-2xl font-black ${
              isPositive ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {isPositive ? '+' : '-'}
            {formatCurrency(Math.abs(gain))}
          </p>

          <p
            className={`mt-1 text-sm font-black ${
              isPositive ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {isPositive ? '+' : ''}
            {returnPercentage} %
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-stone-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Investi
          </p>

          <p className="tabular mt-2 text-xl font-black text-slate-950">
            {formatCurrency(investment.investedAmount)}
          </p>
        </div>

        <div className="rounded-2xl bg-stone-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Valeur actuelle
          </p>

          <div className="mt-2 flex items-center gap-2">
            <input
              value={currentValueInput}
              onChange={(event) => setCurrentValueInput(event.target.value)}
              onBlur={handleBlur}
              inputMode="decimal"
              className="tabular w-full bg-transparent text-xl font-black text-slate-950 outline-none"
            />

            <span className="font-black text-slate-400">€</span>
          </div>
        </div>

        <div className="rounded-2xl bg-stone-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Performance
          </p>

          <p
            className={`mt-2 text-xl font-black ${
              isPositive ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {isPositive ? '+' : ''}
            {returnPercentage} %
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onEditRequest(investment)}
          className="flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-stone-200 hover:text-slate-950"
        >
          <Pencil className="h-4 w-4" />
          Modifier
        </button>

        <button
          type="button"
          onClick={increaseValue}
          className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
        >
          + 50 €
        </button>

        <button
          type="button"
          onClick={decreaseValue}
          className="rounded-full bg-stone-100 px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-stone-200"
        >
          - 50 €
        </button>

        <button
          type="button"
          onClick={() => onDeleteRequest(investment)}
          className="flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-sm font-black text-rose-700 transition hover:bg-rose-100"
        >
          <Trash2 className="h-4 w-4" />
          Supprimer
        </button>
      </div>
    </article>
  )
}

function InvestmentTypeCard({
  type,
  amount,
  total,
}: {
  type: InvestmentType
  amount: number
  total: number
}) {
  const percentage = total > 0 ? Math.round((amount / total) * 100) : 0
  const classes = getInvestmentTypeClasses(type)

  return (
    <article className={`rounded-[1.5rem] border p-4 ${classes.card}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">
            {getInvestmentTypeLabel(type)}
          </p>

          <p className="tabular mt-2 text-2xl font-black">{formatCurrency(amount)}</p>

          <p className="mt-1 text-sm opacity-75">
            {percentage} % du portefeuille
          </p>
        </div>

        <div className={`rounded-2xl p-3 ${classes.icon}`}>
          <BarChart3 className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/70">
        <div
          className={`h-full rounded-full ${classes.bar}`}
          style={{ width: `${Math.max(percentage, amount > 0 ? 4 : 0)}%` }}
        />
      </div>
    </article>
  )
}

export default function InvestmentsPage() {
  const {
    investments,
    addInvestment,
    updateInvestment,
    updateInvestmentCurrentValue,
    deleteInvestment,
  } = useBudgetData()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formValues, setFormValues] = useState<InvestmentFormValues>(
    defaultInvestmentFormValues,
  )
  const [formError, setFormError] = useState('')
  const [investmentToEdit, setInvestmentToEdit] =
    useState<Investment | null>(null)
  const [investmentToDelete, setInvestmentToDelete] =
    useState<Investment | null>(null)

  const [searchParams, setSearchParams] = useSearchParams()
  const action = searchParams.get('action')
  const shouldShowForm = isFormOpen || action === 'new'

  const totalInvested = investments.reduce((total, investment) => {
    return total + investment.investedAmount
  }, 0)

  const totalCurrentValue = investments.reduce((total, investment) => {
    return total + investment.currentValue
  }, 0)

  const totalGain = totalCurrentValue - totalInvested

  const totalReturn =
    totalInvested > 0 ? Math.round((totalGain / totalInvested) * 100) : 0

  const bestInvestment = [...investments].sort((first, second) => {
    return getInvestmentReturn(second) - getInvestmentReturn(first)
  })[0]

  const investmentTypes: InvestmentType[] = [
    'etf',
    'stock',
    'crypto',
    'real_estate',
    'cash',
    'other',
  ]

  function clearActionParam() {
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete('action')
    setSearchParams(nextSearchParams, { replace: true })
  }

  function openForm() {
    setInvestmentToEdit(null)
    setFormValues(defaultInvestmentFormValues)
    setFormError('')
    setIsFormOpen(true)
  }

  function openEditForm(investment: Investment) {
    setInvestmentToEdit(investment)
    setFormValues(getInvestmentFormValues(investment))
    setFormError('')
    setIsFormOpen(true)

    if (action === 'new') {
      clearActionParam()
    }
  }

  function closeForm() {
    setIsFormOpen(false)
    setInvestmentToEdit(null)
    setFormValues(defaultInvestmentFormValues)
    setFormError('')

    if (action === 'new') {
      clearActionParam()
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const title = formValues.title.trim()
    const emoji = formValues.emoji.trim() || '📈'
    const platform = formValues.platform.trim()
    const investedAmount = parseAmount(formValues.investedAmount)
    const currentValue = formValues.currentValue.trim()
      ? parseAmount(formValues.currentValue)
      : investedAmount

    if (!title) {
      setFormError('Ajoutez un nom pour ce placement.')
      return
    }

    if (!Number.isFinite(investedAmount) || investedAmount <= 0) {
      setFormError('Ajoutez un montant investi supérieur à 0 €.')
      return
    }

    if (!Number.isFinite(currentValue) || currentValue < 0) {
      setFormError('Ajoutez une valeur actuelle valide.')
      return
    }

    const nextInvestment: Investment = {
      id: investmentToEdit?.id ?? createInvestmentId(),
      title,
      emoji,
      type: formValues.type,
      platform,
      investedAmount,
      currentValue,
      note: formValues.note.trim() || undefined,
    }

    if (investmentToEdit) {
      updateInvestment(nextInvestment)
    } else {
      addInvestment(nextInvestment)
    }

    closeForm()
  }

  function confirmDeleteInvestment() {
    if (!investmentToDelete) {
      return
    }

    deleteInvestment(investmentToDelete.id)
    setInvestmentToDelete(null)
  }

  return (
    <div className="space-y-6">
      <section className="animate-rise card-premium overflow-hidden">
        <div className="relative p-6 md:p-8">
          <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="absolute bottom-0 right-24 h-32 w-32 rounded-full bg-blue-200/40 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                Investissements
              </p>

              <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-950 md:text-[2.4rem] md:leading-[1.1]">
                Suivez votre portefeuille
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Suivez vos ETF, actions, cryptos et autres placements. Vous
                pouvez maintenant ajouter, modifier, ajuster la valeur actuelle
                ou supprimer un investissement.
              </p>
            </div>

            <button
              type="button"
              onClick={openForm}
              className="flex w-fit items-center gap-2 rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-emerald-900"
            >
              <Plus className="h-4 w-4" />
              Nouvel investissement
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PageStatCard
          title="Valeur actuelle"
          value={formatCurrency(totalCurrentValue)}
          description="Total du portefeuille"
          icon={<WalletCards className="h-5 w-5" />}
          variant="emerald"
        />

        <PageStatCard
          title="Montant investi"
          value={formatCurrency(totalInvested)}
          description="Capital placé"
          icon={<Coins className="h-5 w-5" />}
          variant="blue"
        />

        <PageStatCard
          title="Gain / perte"
          value={`${totalGain >= 0 ? '+' : '-'}${formatCurrency(
            Math.abs(totalGain),
          )}`}
          description="Différence actuelle"
          icon={
            totalGain >= 0 ? (
              <ArrowUpRight className="h-5 w-5" />
            ) : (
              <ArrowDownRight className="h-5 w-5" />
            )
          }
          variant={totalGain >= 0 ? 'emerald' : 'rose'}
        />

        <PageStatCard
          title="Rendement"
          value={`${totalReturn >= 0 ? '+' : ''}${totalReturn} %`}
          description="Performance globale"
          icon={<Percent className="h-5 w-5" />}
          variant={totalReturn >= 0 ? 'amber' : 'rose'}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-emerald-600">
                Vue globale
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-950">
                Performance du portefeuille
              </h2>
            </div>

            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 rounded-[1.5rem] bg-stone-50 p-5">
            <p className="text-sm font-semibold text-slate-500">
              Résultat global
            </p>

            <p
              className={`tabular mt-2 text-4xl font-black ${
                totalGain >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {totalGain >= 0 ? '+' : '-'}
              {formatCurrency(Math.abs(totalGain))}
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Votre portefeuille vaut actuellement{' '}
              <span className="font-black text-slate-950">
                {formatCurrency(totalCurrentValue)}
              </span>{' '}
              pour un montant investi de{' '}
              <span className="font-black text-slate-950">
                {formatCurrency(totalInvested)}
              </span>
              .
            </p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-emerald-600">
                Lecture rapide
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-950">
                Meilleur placement
              </h2>
            </div>

            <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
              <Landmark className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 rounded-[1.5rem] bg-blue-50 p-5">
            <p className="text-sm font-semibold text-blue-700">
              Meilleure performance
            </p>

            <p className="mt-2 text-2xl font-black text-blue-950">
              {bestInvestment
                ? `${bestInvestment.emoji} ${bestInvestment.title}`
                : 'Aucun'}
            </p>

            <p className="mt-2 text-sm text-blue-800/80">
              {bestInvestment
                ? `${getInvestmentReturn(
                    bestInvestment,
                  )} % de performance actuelle.`
                : 'Ajoutez un placement pour obtenir une analyse.'}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-emerald-600">
                Répartition
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-950">
                Par type d’actif
              </h2>
            </div>

            <div className="rounded-2xl bg-violet-50 p-3 text-violet-700">
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {investmentTypes.map((type) => {
              const amount = investments
                .filter((investment) => investment.type === type)
                .reduce((total, investment) => {
                  return total + investment.currentValue
                }, 0)

              return (
                <InvestmentTypeCard
                  key={type}
                  type={type}
                  amount={amount}
                  total={totalCurrentValue}
                />
              )
            })}
          </div>
        </div>

        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-600">
                Portefeuille
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-950">
                {investments.length} placement
                {investments.length > 1 ? 's' : ''}
              </h2>
            </div>

            <button
              type="button"
              onClick={openForm}
              className="flex w-fit items-center gap-2 rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900"
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {investments.length > 0 ? (
              investments.map((investment) => (
                <InvestmentCard
                  key={`${investment.id}-${investment.title}-${investment.type}-${investment.investedAmount}-${investment.currentValue}-${investment.platform}-${investment.emoji}`}
                  investment={investment}
                  onCurrentValueChange={updateInvestmentCurrentValue}
                  onEditRequest={openEditForm}
                  onDeleteRequest={setInvestmentToDelete}
                />
              ))
            ) : (
              <div className="rounded-[2rem] border border-dashed border-stone-200 bg-stone-50 p-8 text-center">
                <p className="text-3xl">📈</p>

                <h3 className="mt-4 text-xl font-black text-slate-950">
                  Aucun investissement
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Ajoutez un placement pour commencer à suivre votre
                  portefeuille.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {shouldShowForm && (
        <InvestmentFormModal
          formValues={formValues}
          formError={formError}
          isEditing={Boolean(investmentToEdit)}
          onClose={closeForm}
          onChange={setFormValues}
          onSubmit={handleSubmit}
        />
      )}

      {investmentToDelete && (
        <ConfirmActionModal
          eyebrow="Suppression"
          title="Supprimer cet investissement ?"
          description={`Vous êtes sur le point de supprimer "${investmentToDelete.title}". Ce placement sera retiré du suivi temporaire actuel.`}
          confirmLabel="Supprimer le placement"
          cancelLabel="Annuler"
          icon={<Trash2 className="h-5 w-5" />}
          variant="danger"
          onCancel={() => setInvestmentToDelete(null)}
          onConfirm={confirmDeleteInvestment}
        />
      )}
    </div>
  )
}
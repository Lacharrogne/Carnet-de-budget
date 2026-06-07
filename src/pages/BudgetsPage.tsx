import { useState, type FormEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import {
  AlertTriangle,
  CheckCircle2,
  Gauge,
  PiggyBank,
  Plus,
  ReceiptText,
  RotateCcw,
  TrendingDown,
  WalletCards,
  X,
} from 'lucide-react'

import { useBudgetData } from '../context/useBudgetData'
import { budgetCategories } from '../data/budgetCategories'
import {
  getBudgetUsages,
  getCurrentMonthKey,
  getMonthLabel,
} from '../services/budgetStatsService'
import type { BudgetCategoryId, MonthlyBudget } from '../types/budget'
import { formatCurrency } from '../utils/formatCurrency'

type BudgetFilter = 'all' | 'safe' | 'warning' | 'danger'

type BudgetFormValues = {
  category: BudgetCategoryId
  limit: string
}

const defaultBudgetFormValues: BudgetFormValues = {
  category: budgetCategories[0].id,
  limit: '',
}

function parseBudgetAmount(value: string) {
  const normalizedValue = value.trim().replace(',', '.')

  if (!normalizedValue) {
    return 0
  }

  return Number(normalizedValue)
}

function getFirstCategoryWithoutBudget(
  monthlyBudgets: MonthlyBudget[],
  monthKey: string,
) {
  return (
    budgetCategories.find((category) => {
      return !monthlyBudgets.some((budget) => {
        return budget.month === monthKey && budget.category === category.id
      })
    }) ?? budgetCategories[0]
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

function EmptyBudgetsGuide({
  onCreateBudget,
}: {
  onCreateBudget: () => void
}) {
  return (
    <section className="rounded-[2rem] border border-amber-100 bg-amber-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-white p-3 text-amber-700 shadow-sm">
            <PiggyBank className="h-6 w-6" />
          </div>

          <div>
            <p className="text-sm font-semibold text-amber-700">
              Aucun budget pour ce mois
            </p>

            <h2 className="mt-1 text-xl font-black text-amber-950">
              Crée tes premières limites mensuelles
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-800/80">
              Les budgets servent à savoir rapidement si une catégorie est
              maîtrisée, proche de la limite ou dépassée. Commence par une
              catégorie simple comme courses, logement, transport ou loisirs.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCreateBudget}
          className="flex w-fit items-center justify-center gap-2 rounded-full bg-emerald-950 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-900"
        >
          <Plus className="h-4 w-4" />
          Créer un budget
        </button>
      </div>
    </section>
  )
}

function FilterButton({
  label,
  isActive,
  onClick,
}: {
  label: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-5 py-3 text-left text-sm font-black transition ${
        isActive
          ? 'bg-emerald-950 text-white shadow-sm'
          : 'bg-stone-50 text-slate-600 hover:bg-stone-100'
      }`}
    >
      {label}
    </button>
  )
}

function getBudgetStatusLabel(status: string) {
  if (status === 'danger') {
    return 'Dépassé'
  }

  if (status === 'warning') {
    return 'Attention'
  }

  return 'Maîtrisé'
}

function getBudgetStatusClasses(status: string) {
  if (status === 'danger') {
    return {
      badge: 'border-rose-200 bg-rose-50 text-rose-700',
      bar: 'bg-rose-500',
      remaining: 'text-rose-700',
    }
  }

  if (status === 'warning') {
    return {
      badge: 'border-amber-200 bg-amber-50 text-amber-700',
      bar: 'bg-amber-400',
      remaining: 'text-amber-700',
    }
  }

  return {
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    bar: 'bg-emerald-500',
    remaining: 'text-emerald-700',
  }
}

function BudgetCategoryCard({
  categoryId,
  emoji,
  name,
  description,
  spent,
  limit,
  remaining,
  percentage,
  status,
  onLimitChange,
}: {
  categoryId: BudgetCategoryId
  emoji: string
  name: string
  description: string
  spent: number
  limit: number
  remaining: number
  percentage: number
  status: string
  onLimitChange: (categoryId: BudgetCategoryId, value: number) => void
}) {
  const statusClasses = getBudgetStatusClasses(status)
  const [limitInput, setLimitInput] = useState(String(limit))

  function handleLimitBlur() {
    const nextLimit = parseBudgetAmount(limitInput)

    if (!Number.isFinite(nextLimit) || nextLimit < 0) {
      setLimitInput(String(limit))
      return
    }

    onLimitChange(categoryId, nextLimit)
  }

  return (
    <article className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <div className="rounded-[1.4rem] border border-stone-200 bg-stone-50 p-4">
            <span className="text-3xl">{emoji}</span>
          </div>

          <div className="min-w-0">
            <h3 className="text-xl font-black text-slate-950">{name}</h3>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              {description}
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-sm font-black ${statusClasses.badge}`}
        >
          {getBudgetStatusLabel(status)}
        </span>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-stone-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Dépensé
          </p>

          <p className="mt-2 text-2xl font-black text-slate-950">
            {formatCurrency(spent)}
          </p>
        </div>

        <div className="rounded-2xl bg-stone-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Budget
          </p>

          <div className="mt-2 flex items-center gap-2">
            <input
              value={limitInput}
              onChange={(event) => setLimitInput(event.target.value)}
              onBlur={handleLimitBlur}
              inputMode="decimal"
              className="w-32 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-lg font-black text-slate-950 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />

            <span className="font-black text-slate-500">€</span>
          </div>
        </div>

        <div className="rounded-2xl bg-stone-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Restant
          </p>

          <p className={`mt-2 text-2xl font-black ${statusClasses.remaining}`}>
            {remaining >= 0
              ? formatCurrency(remaining)
              : `-${formatCurrency(Math.abs(remaining))}`}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="font-black text-slate-800">Progression du budget</p>

          <p className="font-black text-slate-500">{percentage} %</p>
        </div>

        <div className="h-4 overflow-hidden rounded-full bg-stone-100">
          <div
            className={`h-full rounded-full ${statusClasses.bar}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>

        <p className="mt-3 text-sm text-slate-500">
          {remaining >= 0
            ? `Il reste ${formatCurrency(remaining)} pour cette catégorie.`
            : `Tu as dépassé ce budget de ${formatCurrency(
                Math.abs(remaining),
              )}.`}
        </p>
      </div>
    </article>
  )
}

function BudgetFormModal({
  formValues,
  formError,
  onClose,
  onChange,
  onSubmit,
}: {
  formValues: BudgetFormValues
  formError: string
  onClose: () => void
  onChange: (values: BudgetFormValues) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  const selectedCategory =
    budgetCategories.find((category) => category.id === formValues.category) ??
    budgetCategories[0]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-3 backdrop-blur-sm md:items-center">
      <form
        onSubmit={onSubmit}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-stone-200 bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-10 border-b border-stone-100 bg-white/95 p-5 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-emerald-600">
                Nouveau budget
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-950">
                Ajouter une limite mensuelle
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Choisis une catégorie et définis le montant maximum à ne pas
                dépasser ce mois-ci.
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

        <div className="space-y-5 p-5">
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
            <span className="text-sm font-black text-slate-700">
              Catégorie
            </span>

            <select
              value={formValues.category}
              onChange={(event) =>
                onChange({
                  ...formValues,
                  category: event.target.value as BudgetCategoryId,
                })
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

          <label className="block">
            <span className="text-sm font-black text-slate-700">
              Budget prévu
            </span>

            <div className="mt-2 flex h-12 items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 transition focus-within:border-emerald-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
              <input
                value={formValues.limit}
                onChange={(event) =>
                  onChange({
                    ...formValues,
                    limit: event.target.value,
                  })
                }
                placeholder="Ex : 250"
                inputMode="decimal"
                className="w-full bg-transparent text-sm font-medium text-slate-950 outline-none placeholder:text-slate-400"
              />

              <span className="font-black text-slate-500">€</span>
            </div>
          </label>

          {formError && (
            <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
              {formError}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-stone-100 p-5 md:flex-row md:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-stone-100 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-stone-200 hover:text-slate-950"
          >
            Annuler
          </button>

          <button
            type="submit"
            className="rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900"
          >
            Ajouter le budget
          </button>
        </div>
      </form>
    </div>
  )
}

export default function BudgetsPage() {
  const {
    transactions,
    monthlyBudgets,
    addMonthlyBudget,
    updateMonthlyBudgetLimit,
    resetMonthlyBudgets,
  } = useBudgetData()

  const [activeFilter, setActiveFilter] = useState<BudgetFilter>('all')
  const [isBudgetFormOpen, setIsBudgetFormOpen] = useState(false)
  const [budgetFormValues, setBudgetFormValues] = useState<BudgetFormValues>(
    defaultBudgetFormValues,
  )
  const [budgetFormError, setBudgetFormError] = useState('')

  const [searchParams, setSearchParams] = useSearchParams()
  const action = searchParams.get('action')
  const shouldShowBudgetForm = isBudgetFormOpen || action === 'new'

  const monthKey = getCurrentMonthKey()
  const monthLabel = getMonthLabel(monthKey)

  const firstCategoryWithoutBudget = getFirstCategoryWithoutBudget(
    monthlyBudgets,
    monthKey,
  )

  const displayedBudgetFormValues =
    action === 'new' &&
    !isBudgetFormOpen &&
    budgetFormValues.category === defaultBudgetFormValues.category &&
    budgetFormValues.limit === ''
      ? {
          category: firstCategoryWithoutBudget.id,
          limit: '',
        }
      : budgetFormValues

  const budgetUsages = getBudgetUsages(transactions, monthlyBudgets, monthKey)
  const hasBudgets = budgetUsages.length > 0

  const totalBudget = budgetUsages.reduce((total, budget) => {
    return total + budget.limit
  }, 0)

  const totalSpent = budgetUsages.reduce((total, budget) => {
    return total + budget.spent
  }, 0)

  const totalRemaining = totalBudget - totalSpent

  const totalProgress =
    totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

  const alertsCount = budgetUsages.filter((budget) => {
    return budget.status === 'warning' || budget.status === 'danger'
  }).length

  const safeBudgets = budgetUsages.filter((budget) => budget.status === 'safe')

  const warningBudgets = budgetUsages.filter(
    (budget) => budget.status === 'warning',
  )

  const dangerBudgets = budgetUsages.filter(
    (budget) => budget.status === 'danger',
  )

  const filteredBudgets = budgetUsages.filter((budget) => {
    if (activeFilter === 'all') {
      return true
    }

    if (activeFilter === 'safe') {
      return budget.status === 'safe'
    }

    if (activeFilter === 'warning') {
      return budget.status === 'warning'
    }

    return budget.status === 'danger'
  })

  function handleLimitChange(categoryId: BudgetCategoryId, value: number) {
    updateMonthlyBudgetLimit(categoryId, Math.max(value, 0), monthKey)
  }

  function clearActionParam() {
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete('action')
    setSearchParams(nextSearchParams, { replace: true })
  }

  function openBudgetForm() {
    const nextCategory = getFirstCategoryWithoutBudget(monthlyBudgets, monthKey)

    setBudgetFormValues({
      category: nextCategory.id,
      limit: '',
    })
    setBudgetFormError('')
    setIsBudgetFormOpen(true)
  }

  function closeBudgetForm() {
    setIsBudgetFormOpen(false)
    setBudgetFormValues(defaultBudgetFormValues)
    setBudgetFormError('')

    if (action === 'new') {
      clearActionParam()
    }
  }

  function handleBudgetSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const limit = parseBudgetAmount(displayedBudgetFormValues.limit)

    if (!displayedBudgetFormValues.category) {
      setBudgetFormError('Choisis une catégorie.')
      return
    }

    if (!Number.isFinite(limit) || limit <= 0) {
      setBudgetFormError('Entre un budget supérieur à 0 €.')
      return
    }

    addMonthlyBudget({
      id: `${monthKey}-${displayedBudgetFormValues.category}`,
      month: monthKey,
      category: displayedBudgetFormValues.category,
      limit,
    })

    setBudgetFormValues(defaultBudgetFormValues)
    setBudgetFormError('')
    setIsBudgetFormOpen(false)

    if (action === 'new') {
      clearActionParam()
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm">
        <div className="relative p-6 md:p-8">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-100/70 blur-3xl" />
          <div className="absolute bottom-0 right-24 h-32 w-32 rounded-full bg-amber-100/70 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-600">
                Budgets mensuels
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                Piloter ton mois sans stress
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Suis tes limites par catégorie pour le mois de{' '}
                <span className="font-semibold text-slate-950">
                  {monthLabel}
                </span>
                . Les budgets sont synchronisés avec Supabase et se mettent à
                jour avec tes transactions.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={openBudgetForm}
                className="flex w-fit items-center gap-2 rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900"
              >
                <Plus className="h-4 w-4" />
                Nouveau budget
              </button>

              <button
                type="button"
                onClick={resetMonthlyBudgets}
                className="flex w-fit items-center gap-2 rounded-full bg-stone-100 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-stone-200 hover:text-slate-950"
              >
                <RotateCcw className="h-4 w-4" />
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      </section>

      {!hasBudgets && <EmptyBudgetsGuide onCreateBudget={openBudgetForm} />}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PageStatCard
          title="Budget total"
          value={formatCurrency(totalBudget)}
          description="Limite prévue ce mois-ci"
          icon={<PiggyBank className="h-5 w-5" />}
          variant="emerald"
        />

        <PageStatCard
          title="Dépensé"
          value={formatCurrency(totalSpent)}
          description="Dépenses suivies dans les budgets"
          icon={<ReceiptText className="h-5 w-5" />}
          variant="rose"
        />

        <PageStatCard
          title="Restant"
          value={formatCurrency(totalRemaining)}
          description="Budget disponible"
          icon={<WalletCards className="h-5 w-5" />}
          variant={totalRemaining >= 0 ? 'blue' : 'rose'}
        />

        <PageStatCard
          title="Alertes"
          value={String(alertsCount)}
          description="Budgets proches ou dépassés"
          icon={<AlertTriangle className="h-5 w-5" />}
          variant={alertsCount > 0 ? 'amber' : 'emerald'}
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
                {hasBudgets
                  ? `Budget utilisé à ${totalProgress} %`
                  : 'Aucun budget à analyser'}
              </h2>
            </div>

            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
              <Gauge className="h-5 w-5" />
            </div>
          </div>

          {hasBudgets ? (
            <>
              <div className="mt-6 h-5 overflow-hidden rounded-full bg-stone-100">
                <div
                  className={`h-full rounded-full ${
                    totalProgress >= 100
                      ? 'bg-rose-500'
                      : totalProgress >= 75
                        ? 'bg-amber-400'
                        : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(totalProgress, 100)}%` }}
                />
              </div>

              <p className="mt-5 text-sm leading-6 text-slate-600">
                Tu as dépensé{' '}
                <span className="font-black text-slate-950">
                  {formatCurrency(totalSpent)}
                </span>{' '}
                sur un budget prévu de{' '}
                <span className="font-black text-slate-950">
                  {formatCurrency(totalBudget)}
                </span>
                . Il te reste donc{' '}
                <span
                  className={`font-black ${
                    totalRemaining >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {formatCurrency(totalRemaining)}
                </span>
                .
              </p>
            </>
          ) : (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-stone-200 bg-stone-50 p-8 text-center">
              <p className="text-3xl">🐷</p>

              <h3 className="mt-4 text-xl font-black text-slate-950">
                Crée un budget pour commencer
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Une fois tes limites créées, cette jauge montrera la part du
                budget déjà utilisée.
              </p>

              <button
                type="button"
                onClick={openBudgetForm}
                className="mt-5 inline-flex rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-900"
              >
                Créer un budget
              </button>
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-emerald-600">Filtrer</p>

              <h2 className="mt-1 text-2xl font-black text-slate-950">
                Voir les priorités
              </h2>
            </div>

            <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            <FilterButton
              label={`Tous les budgets (${budgetUsages.length})`}
              isActive={activeFilter === 'all'}
              onClick={() => setActiveFilter('all')}
            />

            <FilterButton
              label={`Maîtrisés (${safeBudgets.length})`}
              isActive={activeFilter === 'safe'}
              onClick={() => setActiveFilter('safe')}
            />

            <FilterButton
              label={`À surveiller (${warningBudgets.length})`}
              isActive={activeFilter === 'warning'}
              onClick={() => setActiveFilter('warning')}
            />

            <FilterButton
              label={`Dépassés (${dangerBudgets.length})`}
              isActive={activeFilter === 'danger'}
              onClick={() => setActiveFilter('danger')}
            />
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-600">
              Catégories
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-950">
              {filteredBudgets.length} budget
              {filteredBudgets.length > 1 ? 's' : ''}
            </h2>
          </div>

          <p className="text-sm text-slate-500">
            Les limites sont sauvegardées et modifiables à tout moment.
          </p>
        </div>

        <div className="mt-6 space-y-5">
          {filteredBudgets.length > 0 ? (
            filteredBudgets.map((budget) => (
              <BudgetCategoryCard
                key={budget.category.id}
                categoryId={budget.category.id}
                emoji={budget.category.emoji}
                name={budget.category.name}
                description={budget.category.description}
                spent={budget.spent}
                limit={budget.limit}
                remaining={budget.remaining}
                percentage={budget.percentage}
                status={budget.status}
                onLimitChange={handleLimitChange}
              />
            ))
          ) : (
            <div className="rounded-[2rem] border border-dashed border-stone-200 bg-stone-50 p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="h-6 w-6" />
              </div>

              <h3 className="mt-4 text-xl font-black text-slate-950">
                {hasBudgets
                  ? 'Aucun budget dans ce filtre'
                  : 'Aucun budget créé'}
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {hasBudgets
                  ? 'Change de filtre pour afficher les autres catégories.'
                  : 'Crée une première limite mensuelle pour commencer le suivi.'}
              </p>

              {!hasBudgets && (
                <button
                  type="button"
                  onClick={openBudgetForm}
                  className="mt-5 inline-flex rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-900"
                >
                  Créer un budget
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {shouldShowBudgetForm && (
        <BudgetFormModal
          formValues={displayedBudgetFormValues}
          formError={budgetFormError}
          onClose={closeBudgetForm}
          onChange={setBudgetFormValues}
          onSubmit={handleBudgetSubmit}
        />
      )}
    </div>
  )
}
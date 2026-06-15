import { type ReactNode } from 'react'
import { Link } from 'react-router'
import {
  AlertTriangle,
  Banknote,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Circle,
  CreditCard,
  Landmark,
  PiggyBank,
  Plus,
  ReceiptText,
  Repeat2,
  ShieldCheck,
  Target,
  TrendingUp,
  WalletCards,
} from 'lucide-react'

import { useBudgetData } from '../context/useBudgetData'
import {
  getBudgetUsages,
  getCategoryById,
  getCurrentMonthKey,
  getMonthLabel,
} from '../services/budgetStatsService'
import type { BudgetCategoryId, Transaction } from '../types/budget'
import { formatCurrency } from '../utils/formatCurrency'

type StatVariant = 'emerald' | 'blue' | 'rose' | 'amber' | 'violet'

type SetupStep = {
  title: string
  description: string
  href: string
  cta: string
  isCompleted: boolean
  icon: ReactNode
  variant: StatVariant
}

type WatchItem = {
  title: string
  description: string
  value: string
  href: string
  icon: ReactNode
  variant: StatVariant
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
  }).format(new Date(`${date}T12:00:00`))
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

  return `Dans ${daysBeforePayment} jour${daysBeforePayment > 1 ? 's' : ''}`
}

function getProgress(currentAmount: number, targetAmount: number) {
  if (targetAmount <= 0) {
    return 0
  }

  return Math.min(Math.round((currentAmount / targetAmount) * 100), 100)
}

function getTransactionDateValue(transaction: Transaction) {
  return new Date(`${transaction.date}T12:00:00`).getTime()
}

type HealthTier = 'confortable' | 'equilibre' | 'attention' | 'tension'

type FinancialHealth = {
  score: number
  tier: HealthTier
  label: string
  message: string
  savingsRate: number
}

function getFinancialHealth({
  monthlyIncome,
  monthlyBalance,
  alertCount,
  budgetCount,
}: {
  monthlyIncome: number
  monthlyBalance: number
  alertCount: number
  budgetCount: number
}): FinancialHealth | null {
  // Sans revenu déclaré ce mois-ci, on ne juge pas : le score n'aurait pas de sens.
  if (monthlyIncome <= 0) {
    return null
  }

  const savingsRate = monthlyBalance / monthlyIncome

  // 0 % d'épargne → 50, +25 % d'épargne → 100, déficit → tend vers 0.
  let score = 50 + savingsRate * 200

  // Les budgets en alerte pèsent un peu sur la note, sans la faire plonger.
  if (budgetCount > 0) {
    score -= (alertCount / budgetCount) * 15
  }

  score = Math.max(0, Math.min(100, Math.round(score)))

  let tier: HealthTier = 'tension'

  if (score >= 78) {
    tier = 'confortable'
  } else if (score >= 58) {
    tier = 'equilibre'
  } else if (score >= 40) {
    tier = 'attention'
  }

  const ratePercent = Math.round(savingsRate * 100)

  const tierContent: Record<HealthTier, { label: string; message: string }> = {
    confortable: {
      label: 'Mois confortable',
      message:
        ratePercent > 0
          ? `Tu mets de côté environ ${ratePercent} % de tes revenus. Belle marge, tu gardes le contrôle.`
          : 'Tes finances sont bien tenues ce mois-ci. Tu gardes le contrôle.',
    },
    equilibre: {
      label: 'Budget équilibré',
      message:
        'Tes dépenses restent sous tes revenus. Un mois sain, avec encore un peu de marge.',
    },
    attention: {
      label: 'À surveiller',
      message:
        'Ton mois est juste. Quelques ajustements suffiraient à retrouver de la marge.',
    },
    tension: {
      label: 'Mois en tension',
      message:
        'Tes dépenses dépassent tes revenus ce mois-ci. Pas de panique : on regarde où agir en priorité.',
    },
  }

  return {
    score,
    tier,
    savingsRate,
    label: tierContent[tier].label,
    message: tierContent[tier].message,
  }
}

const healthTierStyles: Record<
  HealthTier,
  { ring: string; track: string; bar: string; chip: string; dot: string }
> = {
  confortable: {
    ring: 'text-emerald-500',
    track: 'text-emerald-100',
    bar: 'bg-emerald-500',
    chip: 'bg-emerald-50 text-emerald-800',
    dot: 'bg-emerald-500',
  },
  equilibre: {
    ring: 'text-teal-500',
    track: 'text-teal-100',
    bar: 'bg-teal-500',
    chip: 'bg-teal-50 text-teal-800',
    dot: 'bg-teal-500',
  },
  attention: {
    ring: 'text-amber-500',
    track: 'text-amber-100',
    bar: 'bg-amber-500',
    chip: 'bg-amber-50 text-amber-800',
    dot: 'bg-amber-500',
  },
  tension: {
    ring: 'text-rose-500',
    track: 'text-rose-100',
    bar: 'bg-rose-500',
    chip: 'bg-rose-50 text-rose-800',
    dot: 'bg-rose-500',
  },
}

function HealthScoreCard({ health }: { health: FinancialHealth }) {
  const styles = healthTierStyles[health.tier]
  const radius = 32
  const circumference = 2 * Math.PI * radius
  const dash = (health.score / 100) * circumference

  return (
    <div className="flex items-center gap-4 rounded-[1.5rem] border border-stone-200/70 bg-white/70 p-4 backdrop-blur">
      <div className="relative flex h-[5.5rem] w-[5.5rem] shrink-0 items-center justify-center">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            strokeWidth="8"
            className={styles.track}
            stroke="currentColor"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className={styles.ring}
            stroke="currentColor"
            strokeDasharray={`${dash} ${circumference}`}
          />
        </svg>

        <div className="absolute flex flex-col items-center">
          <span className="text-2xl font-black leading-none text-slate-950">
            {health.score}
          </span>
          <span className="text-[0.6rem] font-bold uppercase tracking-wide text-slate-400">
            / 100
          </span>
        </div>
      </div>

      <div className="min-w-0">
        <div
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${styles.chip}`}
        >
          <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
          Santé financière
        </div>

        <p className="mt-2 font-display text-lg font-semibold text-slate-950">
          {health.label}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {health.message}
        </p>
      </div>
    </div>
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

function SectionHeader({
  eyebrow,
  title,
  icon,
  action,
}: {
  eyebrow: string
  title: string
  icon: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
          {eyebrow}
        </p>
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-slate-950">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {action}

        <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
          {icon}
        </div>
      </div>
    </div>
  )
}

function QuickLinkCard({
  title,
  description,
  href,
  icon,
  variant,
}: {
  title: string
  description: string
  href: string
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

  return (
    <Link
      to={href}
      className={`rounded-[1.5rem] border p-4 transition hover:-translate-y-0.5 hover:shadow-sm ${variants[variant]}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-black">{title}</p>
          <p className="mt-1 text-sm opacity-75">{description}</p>
        </div>

        <div className="rounded-2xl bg-white/70 p-3">{icon}</div>
      </div>
    </Link>
  )
}

function SetupStepCard({ step }: { step: SetupStep }) {
  const variants = {
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-900',
    blue: 'border-blue-100 bg-blue-50 text-blue-900',
    rose: 'border-rose-100 bg-rose-50 text-rose-900',
    amber: 'border-amber-100 bg-amber-50 text-amber-900',
    violet: 'border-violet-100 bg-violet-50 text-violet-900',
  }

  return (
    <Link
      to={step.href}
      className={`rounded-[1.5rem] border p-4 transition hover:-translate-y-0.5 hover:shadow-sm ${variants[step.variant]}`}
    >
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-white/70 p-3">{step.icon}</div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {step.isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-700" />
            ) : (
              <Circle className="h-5 w-5 opacity-50" />
            )}

            <p className="font-black">{step.title}</p>
          </div>

          <p className="mt-2 text-sm leading-5 opacity-75">
            {step.description}
          </p>

          <p className="mt-3 text-sm font-black">
            {step.isCompleted ? 'Terminé' : step.cta}
          </p>
        </div>
      </div>
    </Link>
  )
}

function SetupProgressSection({
  steps,
  setupProgress,
}: {
  steps: SetupStep[]
  setupProgress: number
}) {
  const completedSteps = steps.filter((step) => step.isCompleted).length

  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-600">
            Démarrage du carnet
          </p>

          <h2 className="mt-1 text-2xl font-black text-slate-950">
            Configuration à {setupProgress} %
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Avance étape par étape : crée un compte, ajoute tes mouvements,
            fixe tes budgets puis commence à prévoir tes projets.
          </p>
        </div>

        <div className="rounded-[1.5rem] bg-emerald-50 p-4 text-emerald-900">
          <p className="text-sm font-semibold text-emerald-700">
            Étapes terminées
          </p>

          <p className="mt-1 text-3xl font-black">
            {completedSteps} / {steps.length}
          </p>
        </div>
      </div>

      <div className="mt-6 h-4 overflow-hidden rounded-full bg-stone-100">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{ width: `${setupProgress}%` }}
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {steps.map((step) => (
          <SetupStepCard key={step.title} step={step} />
        ))}
      </div>
    </section>
  )
}

function NewUserDashboard({ steps }: { steps: SetupStep[] }) {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm">
        <div className="relative p-6 md:p-8">
          <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-emerald-100/70 blur-3xl" />
          <div className="absolute bottom-0 right-24 h-36 w-36 rounded-full bg-amber-100/70 blur-3xl" />

          <div className="relative max-w-3xl">
            <p className="text-sm font-semibold text-emerald-600">
              Bienvenue dans Carnet de budget
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
              Construis ton cockpit financier
            </h1>

            <p className="mt-4 text-sm leading-6 text-slate-600 md:text-base">
              Commence par créer ton premier compte. Ensuite, ton accueil
              deviendra une vraie page de pilotage avec tes priorités, tes
              alertes, tes prochaines charges et tes dernières transactions.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/comptes"
                className="flex w-fit items-center gap-2 rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900"
              >
                <Plus className="h-4 w-4" />
                Créer mon premier compte
              </Link>

              <Link
                to="/budgets"
                className="flex w-fit items-center gap-2 rounded-full bg-stone-100 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-stone-200"
              >
                Voir les budgets
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SetupProgressSection steps={steps} setupProgress={0} />

      <section className="grid gap-6 xl:grid-cols-3">
        <QuickLinkCard
          title="1. Créer un compte"
          description="Compte courant, épargne, espèces ou investissement."
          href="/comptes"
          icon={<Landmark className="h-5 w-5" />}
          variant="emerald"
        />

        <QuickLinkCard
          title="2. Ajouter une transaction"
          description="Après la création d’un compte."
          href="/transactions"
          icon={<ReceiptText className="h-5 w-5" />}
          variant="blue"
        />

        <QuickLinkCard
          title="3. Fixer un budget"
          description="Créer une limite par catégorie."
          href="/budgets"
          icon={<PiggyBank className="h-5 w-5" />}
          variant="amber"
        />
      </section>
    </div>
  )
}

function WatchItemCard({ item }: { item: WatchItem }) {
  const variants = {
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-900',
    blue: 'border-blue-100 bg-blue-50 text-blue-900',
    rose: 'border-rose-100 bg-rose-50 text-rose-900',
    amber: 'border-amber-100 bg-amber-50 text-amber-900',
    violet: 'border-violet-100 bg-violet-50 text-violet-900',
  }

  return (
    <Link
      to={item.href}
      className={`rounded-[1.5rem] border p-4 transition hover:-translate-y-0.5 hover:shadow-sm ${variants[item.variant]}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-black">{item.title}</p>
          <p className="mt-1 text-sm opacity-75">{item.description}</p>
          <p className="mt-3 text-lg font-black">{item.value}</p>
        </div>

        <div className="rounded-2xl bg-white/70 p-3">{item.icon}</div>
      </div>
    </Link>
  )
}

function TransactionLine({ transaction }: { transaction: Transaction }) {
  const category = getCategoryById(transaction.category)
  const isIncome = transaction.type === 'income'
  const isTransfer = transaction.type === 'transfer'

  const amountLabel = isTransfer
    ? `↔ ${formatCurrency(transaction.amount)}`
    : `${isIncome ? '+' : '-'}${formatCurrency(transaction.amount)}`

  const amountColor = isTransfer
    ? 'text-blue-700'
    : isIncome
      ? 'text-emerald-700'
      : 'text-rose-700'

  const cardColor = isTransfer
    ? 'border-blue-100 bg-blue-50'
    : isIncome
      ? 'border-emerald-100 bg-emerald-50'
      : 'border-rose-100 bg-rose-50'

  return (
    <article className="rounded-[1.5rem] border border-stone-100 bg-stone-50 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`rounded-2xl border p-3 ${cardColor}`}>
            <span className="text-xl">{isTransfer ? '↔️' : category.emoji}</span>
          </div>

          <div className="min-w-0">
            <p className="truncate font-black text-slate-950">
              {transaction.title}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {isTransfer ? 'Virement' : category.name} ·{' '}
              {formatDate(transaction.date)}
            </p>
          </div>
        </div>

        <p className={`font-black ${amountColor}`}>{amountLabel}</p>
      </div>
    </article>
  )
}

export default function DashboardPage() {
  const {
    accounts,
    transactions,
    monthlyBudgets,
    recurringPayments,
    savingGoals,
    sinkingFunds,
    debts,
    investments,
  } = useBudgetData()

  const monthKey = getCurrentMonthKey()
  const monthLabel = getMonthLabel(monthKey)

  const hasAccounts = accounts.length > 0
  const hasTransactions = transactions.length > 0
  const hasBudgets = monthlyBudgets.length > 0
  const hasRecurringPayments = recurringPayments.length > 0
  const hasSavingsProjects = savingGoals.length > 0 || sinkingFunds.length > 0
  const hasDebts = debts.length > 0
  const hasInvestments = investments.length > 0

  const hasAnyData =
    hasAccounts ||
    hasTransactions ||
    hasBudgets ||
    hasRecurringPayments ||
    hasSavingsProjects ||
    hasDebts ||
    hasInvestments

  const setupSteps: SetupStep[] = [
    {
      title: 'Créer un compte',
      description: 'Base indispensable pour lier tes mouvements.',
      href: '/comptes',
      cta: 'Commencer',
      isCompleted: hasAccounts,
      icon: <Landmark className="h-5 w-5" />,
      variant: 'emerald',
    },
    {
      title: 'Ajouter un mouvement',
      description: 'Revenu, dépense ou virement entre comptes.',
      href: hasAccounts ? '/transactions?action=new' : '/comptes',
      cta: hasAccounts ? 'Ajouter' : 'Compte requis',
      isCompleted: hasTransactions,
      icon: <ReceiptText className="h-5 w-5" />,
      variant: 'blue',
    },
    {
      title: 'Créer un budget',
      description: 'Fixer une limite mensuelle par catégorie.',
      href: '/budgets?action=new',
      cta: 'Créer',
      isCompleted: hasBudgets,
      icon: <PiggyBank className="h-5 w-5" />,
      variant: 'amber',
    },
    {
      title: 'Fixer un objectif',
      description: 'Projet, épargne ou placement à suivre.',
      href: '/objectifs?action=new',
      cta: 'Prévoir',
      isCompleted: hasSavingsProjects || hasInvestments,
      icon: <Target className="h-5 w-5" />,
      variant: 'violet',
    },
  ]

  const completedSetupSteps = setupSteps.filter((step) => step.isCompleted)
  const setupProgress = Math.round(
    (completedSetupSteps.length / setupSteps.length) * 100,
  )

  if (!hasAnyData) {
    return <NewUserDashboard steps={setupSteps} />
  }

  const monthlyTransactions = transactions.filter((transaction) => {
    return transaction.date.startsWith(monthKey)
  })

  const monthlyIncome = monthlyTransactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((total, transaction) => total + transaction.amount, 0)

  const monthlyExpenses = monthlyTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((total, transaction) => total + transaction.amount, 0)

  const monthlyBalance = monthlyIncome - monthlyExpenses

  const liquidAccountsTotal = accounts
    .filter((account) => account.type !== 'investment')
    .reduce((total, account) => total + account.balance, 0)

  const totalDebts = debts.reduce((total, debt) => {
    return total + debt.remainingAmount
  }, 0)

  const totalInvestments = investments.reduce((total, investment) => {
    return total + investment.currentValue
  }, 0)

  const netWorth = liquidAccountsTotal + totalInvestments - totalDebts

  const budgetUsages = getBudgetUsages(transactions, monthlyBudgets, monthKey)

  const totalBudgetLimit = budgetUsages.reduce((total, budget) => {
    return total + budget.limit
  }, 0)

  const totalBudgetSpent = budgetUsages.reduce((total, budget) => {
    return total + budget.spent
  }, 0)

  const totalBudgetRemaining = totalBudgetLimit - totalBudgetSpent

  const alertBudgets = budgetUsages.filter((budget) => {
    return budget.status === 'warning' || budget.status === 'danger'
  })

  const activeRecurringPayments = recurringPayments.filter((payment) => {
    return payment.isActive
  })

  const recurringMonthlyTotal = activeRecurringPayments.reduce(
    (total, payment) => {
      return total + payment.amount
    },
    0,
  )

  const nextRecurringPayments = [...activeRecurringPayments]
    .sort((firstPayment, secondPayment) => {
      return (
        getDaysBeforePayment(firstPayment.dayOfMonth) -
        getDaysBeforePayment(secondPayment.dayOfMonth)
      )
    })
    .slice(0, 3)

  const nextRecurringPayment = nextRecurringPayments[0]

  const totalMonthlyDebtPayment = debts.reduce((total, debt) => {
    return total + debt.monthlyPayment
  }, 0)

  const goalsPreview = [
    ...savingGoals.map((goal) => ({
      id: goal.id,
      emoji: goal.emoji,
      title: goal.title,
      currentAmount: goal.currentAmount,
      targetAmount: goal.targetAmount,
      label: 'Objectif',
    })),
    ...sinkingFunds.map((fund) => ({
      id: fund.id,
      emoji: fund.emoji,
      title: fund.title,
      currentAmount: fund.currentAmount,
      targetAmount: fund.targetAmount,
      label: 'Fonds',
    })),
  ]
    .filter((goal) => goal.currentAmount < goal.targetAmount)
    .sort((firstGoal, secondGoal) => {
      return (
        getProgress(secondGoal.currentAmount, secondGoal.targetAmount) -
        getProgress(firstGoal.currentAmount, firstGoal.targetAmount)
      )
    })
    .slice(0, 3)

  const recentTransactions = [...transactions]
    .sort((firstTransaction, secondTransaction) => {
      return (
        getTransactionDateValue(secondTransaction) -
        getTransactionDateValue(firstTransaction)
      )
    })
    .slice(0, 5)

const expenseCategories = monthlyTransactions
  .filter((transaction) => transaction.type === 'expense')
  .reduce<Record<string, number>>((categories, transaction) => {
    categories[transaction.category] =
      (categories[transaction.category] ?? 0) + transaction.amount

    return categories
  }, {})

const topExpenseCategoryEntry = Object.entries(expenseCategories).sort(
  ([, firstAmount], [, secondAmount]) => secondAmount - firstAmount,
)[0]

const topExpenseCategory = topExpenseCategoryEntry
  ? getCategoryById(topExpenseCategoryEntry[0] as BudgetCategoryId)
  : null

const topExpenseAmount = topExpenseCategoryEntry?.[1] ?? 0

  const cockpitMessage = topExpenseCategory
    ? `Ce mois-ci, ton plus gros poste est ${topExpenseCategory.emoji} ${topExpenseCategory.name} avec ${formatCurrency(topExpenseAmount)}.`
    : 'Ajoute quelques transactions ce mois-ci pour obtenir un résumé intelligent.'

  const financialHealth = getFinancialHealth({
    monthlyIncome,
    monthlyBalance,
    alertCount: alertBudgets.length,
    budgetCount: budgetUsages.length,
  })

  const watchItems: WatchItem[] = [
    {
      title:
        alertBudgets.length > 0
          ? 'Budgets à surveiller'
          : 'Budgets maîtrisés',
      description:
        alertBudgets.length > 0
          ? 'Certains budgets sont proches de la limite ou dépassés.'
          : 'Aucun budget en alerte pour le moment.',
      value:
        alertBudgets.length > 0
          ? `${alertBudgets.length} alerte${alertBudgets.length > 1 ? 's' : ''}`
          : 'OK',
      href: '/budgets',
      icon: <AlertTriangle className="h-5 w-5" />,
      variant: alertBudgets.length > 0 ? 'amber' : 'emerald',
    },
    {
      title: nextRecurringPayment
        ? 'Prochaine charge fixe'
        : 'Aucune charge à venir',
      description: nextRecurringPayment
        ? `${nextRecurringPayment.title} · ${getNextPaymentLabel(
            nextRecurringPayment.dayOfMonth,
          )}`
        : 'Ajoute tes abonnements pour mieux anticiper.',
      value: nextRecurringPayment
        ? `-${formatCurrency(nextRecurringPayment.amount)}`
        : formatCurrency(0),
      href: '/abonnements',
      icon: <Repeat2 className="h-5 w-5" />,
      variant: nextRecurringPayment ? 'rose' : 'blue',
    },
    {
      title: hasDebts ? 'Dettes à suivre' : 'Aucune dette suivie',
      description: hasDebts
        ? 'Remboursements prévus et capital restant.'
        : 'Tu peux ajouter une dette si besoin.',
      value: hasDebts
        ? `${formatCurrency(totalMonthlyDebtPayment)} / mois`
        : 'OK',
      href: '/dettes',
      icon: <CreditCard className="h-5 w-5" />,
      variant: hasDebts ? 'rose' : 'emerald',
    },
    {
      title: goalsPreview.length > 0 ? 'Objectifs actifs' : 'Objectifs',
      description:
        goalsPreview.length > 0
          ? 'Projets en cours à alimenter.'
          : 'Ajoute un projet pour donner un but à ton argent.',
      value:
        goalsPreview.length > 0
          ? `${goalsPreview.length} à continuer`
          : 'À créer',
      href: '/objectifs',
      icon: <Target className="h-5 w-5" />,
      variant: goalsPreview.length > 0 ? 'violet' : 'blue',
    },
  ]

  return (
    <div className="space-y-6">
      <section className="animate-rise card-premium overflow-hidden">
        <div className="relative p-6 md:p-8">
          <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="absolute bottom-0 right-24 h-32 w-32 rounded-full bg-amber-200/40 blur-3xl" />

          <div className="relative grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                {getMonthLabel(monthKey)}
              </p>

              <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-950 md:text-[2.6rem] md:leading-[1.1]">
                Voilà où en est votre argent
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Une vue calme et complète pour{' '}
                <span className="font-bold text-slate-950">{monthLabel}</span> :
                ce qui rentre, ce qui sort, ce qu’il reste et ce qui mérite votre
                attention.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to={hasAccounts ? '/transactions?action=new' : '/comptes'}
                  className="flex w-fit items-center gap-2 rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-emerald-900"
                >
                  <Plus className="h-4 w-4" />
                  {hasAccounts ? 'Ajouter une transaction' : 'Créer un compte'}
                </Link>

                <Link
                  to="/calendrier"
                  className="flex w-fit items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-stone-300"
                >
                  <CalendarDays className="h-4 w-4" />
                  Voir le calendrier
                </Link>
              </div>
            </div>

            {financialHealth ? (
              <HealthScoreCard health={financialHealth} />
            ) : (
              <div className="flex items-center gap-4 rounded-[1.5rem] border border-stone-200/70 bg-white/70 p-5 backdrop-blur">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <p className="text-sm leading-6 text-slate-600">
                  Ajoutez vos revenus du mois pour activer votre{' '}
                  <span className="font-bold text-slate-950">
                    score de santé financière
                  </span>
                  .
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {setupProgress < 100 && (
        <SetupProgressSection steps={setupSteps} setupProgress={setupProgress} />
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PageStatCard
          title="Argent disponible"
          value={formatCurrency(liquidAccountsTotal)}
          description="Comptes hors investissements"
          icon={<WalletCards className="h-5 w-5" />}
          variant={liquidAccountsTotal >= 0 ? 'emerald' : 'rose'}
        />

        <PageStatCard
          title="Reste du mois"
          value={formatCurrency(monthlyBalance)}
          description="Revenus - dépenses du mois"
          icon={<PiggyBank className="h-5 w-5" />}
          variant={monthlyBalance >= 0 ? 'amber' : 'rose'}
        />

        <PageStatCard
          title="Dépenses du mois"
          value={formatCurrency(monthlyExpenses)}
          description="Sorties du mois en cours"
          icon={<ReceiptText className="h-5 w-5" />}
          variant="rose"
        />

        <PageStatCard
          title="Patrimoine rapide"
          value={formatCurrency(netWorth)}
          description="Disponible + placements - dettes"
          icon={<TrendingUp className="h-5 w-5" />}
          variant={netWorth >= 0 ? 'blue' : 'rose'}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow="À faire rapidement"
            title="Actions utiles"
            icon={<ShieldCheck className="h-5 w-5" />}
          />

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <QuickLinkCard
              title="Ajouter une transaction"
              description="Revenu, dépense ou virement."
              href={hasAccounts ? '/transactions?action=new' : '/comptes'}
              icon={<ReceiptText className="h-5 w-5" />}
              variant="emerald"
            />

            <QuickLinkCard
              title="Mettre de côté"
              description="Alimenter un objectif depuis un compte."
              href="/objectifs"
              icon={<PiggyBank className="h-5 w-5" />}
              variant="violet"
            />

            <QuickLinkCard
              title="Rembourser une dette"
              description="Créer un vrai remboursement."
              href="/dettes"
              icon={<CreditCard className="h-5 w-5" />}
              variant="rose"
            />

            <QuickLinkCard
              title="Voir le calendrier"
              description="Anticiper les mouvements."
              href="/calendrier"
              icon={<CalendarDays className="h-5 w-5" />}
              variant="amber"
            />
          </div>
        </div>

        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow="Résumé intelligent"
            title="Ce qu’il faut retenir"
            icon={<Banknote className="h-5 w-5" />}
            action={
              <Link
                to="/statistiques"
                className="hidden rounded-full bg-stone-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-stone-200 md:inline-flex"
              >
                Analyse
              </Link>
            }
          />

          <div className="mt-6 rounded-[1.75rem] border border-emerald-100 bg-emerald-50 p-5 text-emerald-900">
            <p className="text-sm font-semibold text-emerald-700">
              Point rapide
            </p>

            <p className="mt-2 text-lg font-black leading-7">
              {cockpitMessage}
            </p>

            <p className="mt-3 text-sm leading-6 text-emerald-800/80">
              Pour une analyse plus complète avec tendances, catégories et
              comparaisons, va dans la page Analyse.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
        <SectionHeader
          eyebrow="À surveiller"
          title="Priorités du moment"
          icon={<AlertTriangle className="h-5 w-5" />}
        />

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {watchItems.map((item) => (
            <WatchItemCard key={item.title} item={item} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow="Activité récente"
            title="Dernières transactions"
            icon={<ReceiptText className="h-5 w-5" />}
            action={
              <Link
                to="/transactions"
                className="hidden rounded-full bg-stone-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-stone-200 md:inline-flex"
              >
                Voir
              </Link>
            }
          />

          <div className="mt-6 space-y-3">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) => (
                <TransactionLine
                  key={transaction.id}
                  transaction={transaction}
                />
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-stone-200 bg-stone-50 p-8 text-center">
                <p className="text-3xl">{hasAccounts ? '🧾' : '🏦'}</p>

                <h3 className="mt-4 text-xl font-black text-slate-950">
                  {hasAccounts ? 'Aucune transaction' : 'Compte requis'}
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  {hasAccounts
                    ? 'Ajoute une transaction pour alimenter ton cockpit.'
                    : 'Crée un compte avant d’ajouter tes premiers mouvements.'}
                </p>

                <Link
                  to={hasAccounts ? '/transactions?action=new' : '/comptes'}
                  className="mt-5 inline-flex rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-900"
                >
                  {hasAccounts ? 'Ajouter une transaction' : 'Créer un compte'}
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow="Prochaines charges"
            title="À anticiper"
            icon={<Repeat2 className="h-5 w-5" />}
            action={
              <Link
                to="/abonnements"
                className="hidden rounded-full bg-stone-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-stone-200 md:inline-flex"
              >
                Gérer
              </Link>
            }
          />

          <div className="mt-6 rounded-[1.5rem] bg-rose-50 p-5">
            <p className="text-sm font-semibold text-rose-700">
              Charges fixes mensuelles
            </p>

            <p className="mt-2 text-3xl font-black text-rose-950">
              {formatCurrency(recurringMonthlyTotal)}
            </p>

            <p className="mt-2 text-sm text-rose-800/80">
              {activeRecurringPayments.length} paiement
              {activeRecurringPayments.length > 1 ? 's' : ''} actif
              {activeRecurringPayments.length > 1 ? 's' : ''}.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {nextRecurringPayments.length > 0 ? (
              nextRecurringPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="rounded-[1.25rem] bg-stone-50 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-black text-slate-950">
                        {payment.title}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {getNextPaymentLabel(payment.dayOfMonth)}
                      </p>
                    </div>

                    <p className="font-black text-rose-700">
                      -{formatCurrency(payment.amount)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-stone-200 bg-stone-50 p-6 text-center">
                <p className="text-3xl">🔁</p>

                <h3 className="mt-3 text-lg font-black text-slate-950">
                  Aucun abonnement
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Ajoute tes charges fixes pour mieux anticiper ton mois.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow="Budgets"
            title={
              hasBudgets
                ? `Reste ${formatCurrency(totalBudgetRemaining)}`
                : 'Aucun budget'
            }
            icon={<BarChart3 className="h-5 w-5" />}
            action={
              <Link
                to="/budgets"
                className="hidden rounded-full bg-stone-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-stone-200 md:inline-flex"
              >
                Voir
              </Link>
            }
          />

          {hasBudgets ? (
            <div className="mt-6 space-y-4">
              {budgetUsages.slice(0, 4).map((budget) => {
                const barColor =
                  budget.status === 'danger'
                    ? 'bg-rose-500'
                    : budget.status === 'warning'
                      ? 'bg-amber-400'
                      : 'bg-emerald-500'

                return (
                  <div key={budget.category.id}>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <p className="font-black text-slate-800">
                        {budget.category.emoji} {budget.category.name}
                      </p>

                      <p className="text-sm font-black text-slate-500">
                        {formatCurrency(budget.spent)} /{' '}
                        {formatCurrency(budget.limit)}
                      </p>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-stone-100">
                      <div
                        className={`h-full rounded-full ${barColor}`}
                        style={{
                          width: `${Math.min(budget.percentage, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-stone-200 bg-stone-50 p-8 text-center">
              <p className="text-3xl">🐷</p>

              <h3 className="mt-4 text-xl font-black text-slate-950">
                Crée ton premier budget
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Fixe une limite par catégorie pour mieux suivre ton mois.
              </p>

              <Link
                to="/budgets?action=new"
                className="mt-5 inline-flex rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-900"
              >
                Créer un budget
              </Link>
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow="Objectifs"
            title="Projets à alimenter"
            icon={<Target className="h-5 w-5" />}
            action={
              <Link
                to="/objectifs"
                className="hidden rounded-full bg-stone-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-stone-200 md:inline-flex"
              >
                Voir
              </Link>
            }
          />

          <div className="mt-6 space-y-3">
            {goalsPreview.length > 0 ? (
              goalsPreview.map((goal) => {
                const progress = getProgress(
                  goal.currentAmount,
                  goal.targetAmount,
                )

                return (
                  <div
                    key={`${goal.label}-${goal.id}`}
                    className="rounded-[1.5rem] bg-stone-50 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-black text-slate-950">
                          {goal.emoji} {goal.title}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {goal.label} · {formatCurrency(goal.currentAmount)} /{' '}
                          {formatCurrency(goal.targetAmount)}
                        </p>
                      </div>

                      <p className="font-black text-violet-700">
                        {progress} %
                      </p>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-violet-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-stone-200 bg-stone-50 p-8 text-center">
                <p className="text-3xl">🎯</p>

                <h3 className="mt-4 text-xl font-black text-slate-950">
                  Aucun objectif actif
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Ajoute un objectif pour donner un but à ton argent.
                </p>

                <Link
                  to="/objectifs?action=new"
                  className="mt-5 inline-flex rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-900"
                >
                  Créer un objectif
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
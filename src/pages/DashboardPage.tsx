import { type ReactNode } from 'react'
import { Link } from 'react-router'
import {
  ArrowDownRight,
  ArrowUpRight,
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
import type { Transaction } from '../types/budget'
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
        <p className="text-sm font-semibold text-emerald-600">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-black text-slate-950">{title}</h2>
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
            Avance étape par étape : commence par créer un compte, puis ajoute
            tes mouvements, tes budgets et tes premiers objectifs.
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
              Construis ton tableau de bord financier
            </h1>

            <p className="mt-4 text-sm leading-6 text-slate-600 md:text-base">
              Pour commencer proprement, crée ton premier compte. Ensuite, tu
              pourras suivre tes revenus, tes dépenses, tes budgets, tes charges
              fixes, tes objectifs, tes dettes et tes investissements.
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

function TransactionLine({ transaction }: { transaction: Transaction }) {
  const category = getCategoryById(transaction.category)
  const isIncome = transaction.type === 'income'

  return (
    <article className="rounded-[1.5rem] border border-stone-100 bg-stone-50 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`rounded-2xl border p-3 ${
              isIncome
                ? 'border-emerald-100 bg-emerald-50'
                : 'border-rose-100 bg-rose-50'
            }`}
          >
            <span className="text-xl">{category.emoji}</span>
          </div>

          <div className="min-w-0">
            <p className="truncate font-black text-slate-950">
              {transaction.title}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {category.name} · {formatDate(transaction.date)}
            </p>
          </div>
        </div>

        <p
          className={`font-black ${
            isIncome ? 'text-emerald-700' : 'text-rose-700'
          }`}
        >
          {isIncome ? '+' : '-'}
          {formatCurrency(transaction.amount)}
        </p>
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
      description: 'Revenu, dépense ou paiement important.',
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

  const budgetUsages = getBudgetUsages(transactions, monthlyBudgets, monthKey)

  const totalIncome = transactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((total, transaction) => total + transaction.amount, 0)

  const totalExpenses = transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((total, transaction) => total + transaction.amount, 0)

  const monthlyBalance = totalIncome - totalExpenses

  const totalAccountsBalance = accounts.reduce((total, account) => {
    return total + account.balance
  }, 0)

  const liquidAccountsTotal = accounts
    .filter((account) => account.type !== 'investment')
    .reduce((total, account) => total + account.balance, 0)

  const totalInvestments = investments.reduce((total, investment) => {
    return total + investment.currentValue
  }, 0)

  const totalInvestedAmount = investments.reduce((total, investment) => {
    return total + investment.investedAmount
  }, 0)

  const investmentGain = totalInvestments - totalInvestedAmount

  const totalDebts = debts.reduce((total, debt) => {
    return total + debt.remainingAmount
  }, 0)

  const netWorth = liquidAccountsTotal + totalInvestments - totalDebts

  const totalBudgetLimit = budgetUsages.reduce((total, budget) => {
    return total + budget.limit
  }, 0)

  const totalBudgetSpent = budgetUsages.reduce((total, budget) => {
    return total + budget.spent
  }, 0)

  const totalBudgetRemaining = totalBudgetLimit - totalBudgetSpent

  const budgetProgress =
    totalBudgetLimit > 0
      ? Math.round((totalBudgetSpent / totalBudgetLimit) * 100)
      : 0

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

  const recentTransactions = [...transactions]
    .sort((firstTransaction, secondTransaction) => {
      return secondTransaction.date.localeCompare(firstTransaction.date)
    })
    .slice(0, 5)

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
    .sort((firstGoal, secondGoal) => {
      return (
        getProgress(secondGoal.currentAmount, secondGoal.targetAmount) -
        getProgress(firstGoal.currentAmount, firstGoal.targetAmount)
      )
    })
    .slice(0, 3)

  const topBudgets = [...budgetUsages]
    .sort((firstBudget, secondBudget) => {
      return secondBudget.percentage - firstBudget.percentage
    })
    .slice(0, 4)

  const bestInvestment = [...investments].sort(
    (firstInvestment, secondInvestment) => {
      const firstReturn =
        firstInvestment.investedAmount > 0
          ? (firstInvestment.currentValue - firstInvestment.investedAmount) /
            firstInvestment.investedAmount
          : 0

      const secondReturn =
        secondInvestment.investedAmount > 0
          ? (secondInvestment.currentValue - secondInvestment.investedAmount) /
            secondInvestment.investedAmount
          : 0

      return secondReturn - firstReturn
    },
  )[0]

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm">
        <div className="relative p-6 md:p-8">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-100/70 blur-3xl" />
          <div className="absolute bottom-0 right-24 h-32 w-32 rounded-full bg-amber-100/70 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-600">
                Carnet de budget
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                Tableau de bord
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Une vue claire de ton argent pour le mois de{' '}
                <span className="font-black text-slate-950">{monthLabel}</span>{' '}
                : comptes, dépenses, budgets, abonnements, dettes, patrimoine et
                investissements.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to={hasAccounts ? '/transactions?action=new' : '/comptes'}
                className="flex w-fit items-center gap-2 rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900"
              >
                {hasAccounts ? 'Ajouter une transaction' : 'Créer un compte'}
              </Link>

              <Link
                to="/patrimoine"
                className="flex w-fit items-center gap-2 rounded-full bg-stone-100 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-stone-200"
              >
                Voir le patrimoine
              </Link>
            </div>
          </div>
        </div>
      </section>

      {setupProgress < 100 && (
        <SetupProgressSection steps={setupSteps} setupProgress={setupProgress} />
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PageStatCard
          title="Patrimoine net"
          value={formatCurrency(netWorth)}
          description="Comptes + placements - dettes"
          icon={<WalletCards className="h-5 w-5" />}
          variant={netWorth >= 0 ? 'emerald' : 'rose'}
        />

        <PageStatCard
          title="Solde comptes"
          value={formatCurrency(totalAccountsBalance)}
          description="Tous les comptes réunis"
          icon={<Landmark className="h-5 w-5" />}
          variant="blue"
        />

        <PageStatCard
          title="Dépenses du mois"
          value={formatCurrency(totalExpenses)}
          description="Transactions sortantes"
          icon={<ArrowDownRight className="h-5 w-5" />}
          variant="rose"
        />

        <PageStatCard
          title="Reste disponible"
          value={formatCurrency(monthlyBalance)}
          description="Revenus moins dépenses"
          icon={<PiggyBank className="h-5 w-5" />}
          variant={monthlyBalance >= 0 ? 'amber' : 'rose'}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow="Budgets du mois"
            title={
              hasBudgets
                ? `Budget utilisé à ${budgetProgress} %`
                : 'Aucun budget pour le moment'
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
            <>
              <div className="mt-6 h-5 overflow-hidden rounded-full bg-stone-100">
                <div
                  className={`h-full rounded-full ${
                    budgetProgress >= 100
                      ? 'bg-rose-500'
                      : budgetProgress >= 75
                        ? 'bg-amber-400'
                        : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(budgetProgress, 100)}%` }}
                />
              </div>

              <p className="mt-5 text-sm leading-6 text-slate-600">
                Tu as dépensé{' '}
                <span className="font-black text-slate-950">
                  {formatCurrency(totalBudgetSpent)}
                </span>{' '}
                sur un budget prévu de{' '}
                <span className="font-black text-slate-950">
                  {formatCurrency(totalBudgetLimit)}
                </span>
                . Il te reste{' '}
                <span
                  className={`font-black ${
                    totalBudgetRemaining >= 0
                      ? 'text-emerald-700'
                      : 'text-rose-700'
                  }`}
                >
                  {formatCurrency(totalBudgetRemaining)}
                </span>
                .
              </p>

              <div className="mt-6 space-y-4">
                {topBudgets.map((budget) => {
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
            </>
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
                    ? 'Ajoute une transaction pour alimenter le tableau de bord.'
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
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow="Abonnements"
            title="Charges fixes"
            icon={<Repeat2 className="h-5 w-5" />}
          />

          <div className="mt-6 rounded-[1.5rem] bg-rose-50 p-5">
            <p className="text-sm font-semibold text-rose-700">
              Total mensuel actif
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
            {nextRecurringPayments.map((payment) => (
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
            ))}
          </div>

          <Link
            to={hasAccounts ? '/abonnements' : '/comptes'}
            className="mt-5 inline-flex rounded-full bg-stone-100 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-stone-200"
          >
            {hasAccounts ? 'Gérer' : 'Créer un compte'}
          </Link>
        </div>

        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow="Dettes"
            title="Remboursements"
            icon={<CreditCard className="h-5 w-5" />}
          />

          <div className="mt-6 rounded-[1.5rem] bg-rose-50 p-5">
            <p className="text-sm font-semibold text-rose-700">
              Dette restante
            </p>

            <p className="mt-2 text-3xl font-black text-rose-950">
              {formatCurrency(totalDebts)}
            </p>

            <p className="mt-2 text-sm text-rose-800/80">
              {debts.length} dette{debts.length > 1 ? 's' : ''} suivie
              {debts.length > 1 ? 's' : ''}.
            </p>
          </div>

          <Link
            to="/dettes"
            className="mt-5 inline-flex rounded-full bg-stone-100 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-stone-200"
          >
            Voir les dettes
          </Link>
        </div>

        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow="Investissements"
            title="Portefeuille"
            icon={<TrendingUp className="h-5 w-5" />}
          />

          <div className="mt-6 rounded-[1.5rem] bg-violet-50 p-5">
            <p className="text-sm font-semibold text-violet-700">
              Valeur actuelle
            </p>

            <p className="mt-2 text-3xl font-black text-violet-950">
              {formatCurrency(totalInvestments)}
            </p>

            <p
              className={`mt-2 text-sm font-black ${
                investmentGain >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {investmentGain >= 0 ? '+' : '-'}
              {formatCurrency(Math.abs(investmentGain))}
            </p>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-500">
            Meilleur placement :{' '}
            <span className="font-black text-slate-950">
              {bestInvestment
                ? `${bestInvestment.emoji} ${bestInvestment.title}`
                : 'Aucun'}
            </span>
          </p>

          <Link
            to="/investissements"
            className="mt-5 inline-flex rounded-full bg-stone-100 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-stone-200"
          >
            Voir le portefeuille
          </Link>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow="Objectifs"
            title="Projets d’épargne"
            icon={<Target className="h-5 w-5" />}
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
                  Aucun objectif
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Ajoute un objectif pour suivre tes projets.
                </p>
              </div>
            )}
          </div>

          <Link
            to="/objectifs"
            className="mt-5 inline-flex rounded-full bg-stone-100 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-stone-200"
          >
            Voir les objectifs
          </Link>
        </div>

        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow="Accès rapide"
            title="Continuer le suivi"
            icon={<CalendarDays className="h-5 w-5" />}
          />

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <QuickLinkCard
              title="Comptes"
              description="Modifier les soldes."
              href="/comptes"
              icon={<Landmark className="h-5 w-5" />}
              variant="blue"
            />

            <QuickLinkCard
              title="Transactions"
              description={
                hasAccounts
                  ? 'Ajouter ou consulter.'
                  : 'Crée d’abord un compte.'
              }
              href={hasAccounts ? '/transactions' : '/comptes'}
              icon={<ReceiptText className="h-5 w-5" />}
              variant={hasAccounts ? 'emerald' : 'amber'}
            />

            <QuickLinkCard
              title="Budgets"
              description={`${alertBudgets.length} alerte${
                alertBudgets.length > 1 ? 's' : ''
              } à surveiller.`}
              href="/budgets"
              icon={<PiggyBank className="h-5 w-5" />}
              variant={alertBudgets.length > 0 ? 'amber' : 'emerald'}
            />

            <QuickLinkCard
              title="Stats"
              description="Analyser ton mois."
              href="/statistiques"
              icon={<BarChart3 className="h-5 w-5" />}
              variant="violet"
            />

            <QuickLinkCard
              title="Calendrier"
              description="Voir les mouvements."
              href="/calendrier"
              icon={<CalendarDays className="h-5 w-5" />}
              variant="amber"
            />

            <QuickLinkCard
              title="Patrimoine"
              description="Voir le bilan complet."
              href="/patrimoine"
              icon={<WalletCards className="h-5 w-5" />}
              variant="emerald"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PageStatCard
          title="Revenus"
          value={formatCurrency(totalIncome)}
          description="Argent reçu"
          icon={<ArrowUpRight className="h-5 w-5" />}
          variant="emerald"
        />

        <PageStatCard
          title="Budgets alertes"
          value={String(alertBudgets.length)}
          description="Proches ou dépassés"
          icon={<BarChart3 className="h-5 w-5" />}
          variant={alertBudgets.length > 0 ? 'amber' : 'emerald'}
        />

        <PageStatCard
          title="Abonnements"
          value={formatCurrency(recurringMonthlyTotal)}
          description="Charges fixes"
          icon={<Repeat2 className="h-5 w-5" />}
          variant="rose"
        />

        <PageStatCard
          title="Placements"
          value={formatCurrency(totalInvestments)}
          description="Valeur actuelle"
          icon={<TrendingUp className="h-5 w-5" />}
          variant="violet"
        />
      </section>
    </div>
  )
}
import { type ReactNode } from 'react'
import { Link } from 'react-router'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Landmark,
  Lightbulb,
  Percent,
  PieChart,
  Plus,
  Repeat2,
  Target,
  TrendingUp,
  WalletCards,
} from 'lucide-react'

import MonthSwitcher from '../components/layout/MonthSwitcher'
import { useBudgetData } from '../context/useBudgetData'
import { useSelectedMonth } from '../context/useSelectedMonth'
import {
  getBudgetUsages,
  getCategoryById,
  getMonthLabel,
} from '../services/budgetStatsService'
import type { Transaction } from '../types/budget'
import { formatCurrency } from '../utils/formatCurrency'

type StatVariant = 'emerald' | 'blue' | 'rose' | 'amber' | 'violet'

type Insight = {
  title: string
  value: string
  description: string
  icon: ReactNode
  variant: StatVariant
}

function getPercentage(value: number, total: number) {
  if (total <= 0) {
    return 0
  }

  return Math.round((value / total) * 100)
}

function getBarWidth(value: number, total: number) {
  const percentage = getPercentage(value, total)

  if (value <= 0) {
    return 0
  }

  return Math.min(Math.max(percentage, 4), 100)
}

function getPreviousMonthKey(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number)
  const date = new Date(year, month - 2, 1)

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}`
}

function getTransactionDateLabel(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
  }).format(new Date(`${date}T12:00:00`))
}

function getEvolutionLabel(currentValue: number, previousValue: number) {
  if (previousValue <= 0 && currentValue <= 0) {
    return 'Aucune donnée le mois précédent'
  }

  if (previousValue <= 0) {
    return 'Nouvelle donnée ce mois-ci'
  }

  const difference = currentValue - previousValue
  const percentage = Math.round((difference / previousValue) * 100)

  if (difference === 0) {
    return 'Stable par rapport au mois précédent'
  }

  return `${difference > 0 ? '+' : ''}${percentage} % par rapport au mois précédent`
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

function EmptyStatsGuide({ hasAccounts }: { hasAccounts: boolean }) {
  return (
    <section className="rounded-[2rem] border border-amber-100 bg-amber-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-white p-3 text-amber-700 shadow-sm">
            {hasAccounts ? (
              <BarChart3 className="h-6 w-6" />
            ) : (
              <WalletCards className="h-6 w-6" />
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-amber-700">
              Analyse en préparation
            </p>

            <h2 className="mt-1 text-xl font-black text-amber-950">
              {hasAccounts
                ? 'Ajoutez quelques mouvements pour obtenir de vraies analyses'
                : 'Créez d’abord un compte pour commencer l’analyse'}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-800/80">
              {hasAccounts
                ? 'L’analyse devient utile quand vous ajoutez des revenus, des dépenses, des budgets, des charges fixes, des objectifs ou des investissements.'
                : 'Un compte sert de base à tout le suivi financier. Ensuite, vous pourrez ajouter vos transactions et obtenir une analyse complète.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to={hasAccounts ? '/transactions?action=new' : '/comptes'}
            className="flex w-fit items-center justify-center gap-2 rounded-full bg-emerald-950 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-900"
          >
            <Plus className="h-4 w-4" />
            {hasAccounts ? 'Ajouter une transaction' : 'Créer un compte'}
          </Link>

          {hasAccounts && (
            <Link
              to="/budgets?action=new"
              className="flex w-fit items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-amber-800 shadow-sm transition hover:bg-amber-100"
            >
              Créer un budget
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}

function ProgressRow({
  label,
  value,
  total,
  amountLabel,
  colorClass,
}: {
  label: string
  value: number
  total: number
  amountLabel: string
  colorClass: string
}) {
  const percentage = getPercentage(value, total)

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="font-black text-slate-800">{label}</p>

        <p className="text-sm font-black text-slate-500">
          {amountLabel} · {percentage} %
        </p>
      </div>

      <div className="h-4 overflow-hidden rounded-full bg-stone-100">
        <div
          className={`h-full rounded-full ${colorClass}`}
          style={{ width: `${getBarWidth(value, total)}%` }}
        />
      </div>
    </div>
  )
}

function InsightCard({ insight }: { insight: Insight }) {
  const variants = {
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-900',
    blue: 'border-blue-100 bg-blue-50 text-blue-900',
    rose: 'border-rose-100 bg-rose-50 text-rose-900',
    amber: 'border-amber-100 bg-amber-50 text-amber-900',
    violet: 'border-violet-100 bg-violet-50 text-violet-900',
  }

  return (
    <article className={`rounded-[1.5rem] border p-4 ${variants[insight.variant]}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-black">{insight.title}</p>
          <p className="mt-2 text-2xl font-black">{insight.value}</p>
          <p className="mt-2 text-sm leading-5 opacity-75">
            {insight.description}
          </p>
        </div>

        <div className="rounded-2xl bg-white/70 p-3">{insight.icon}</div>
      </div>
    </article>
  )
}

function CategoryExpenseRow({
  categoryId,
  spent,
  totalExpenses,
}: {
  categoryId: Transaction['category']
  spent: number
  totalExpenses: number
}) {
  const category = getCategoryById(categoryId)
  const percentage = getPercentage(spent, totalExpenses)

  return (
    <article className="rounded-[1.5rem] border border-stone-100 bg-stone-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`rounded-2xl border p-3 ${category.colorClass}`}>
            <span className="text-xl">{category.emoji}</span>
          </div>

          <div className="min-w-0">
            <p className="truncate font-black text-slate-950">
              {category.name}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {percentage} % des dépenses du mois
            </p>
          </div>
        </div>

        <p className="tabular font-black text-rose-700">{formatCurrency(spent)}</p>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-rose-500"
          style={{ width: `${getBarWidth(spent, totalExpenses)}%` }}
        />
      </div>
    </article>
  )
}

function BudgetAlertRow({
  emoji,
  name,
  spent,
  limit,
  percentage,
  status,
}: {
  emoji: string
  name: string
  spent: number
  limit: number
  percentage: number
  status: string
}) {
  const isDanger = status === 'danger'
  const isWarning = status === 'warning'

  return (
    <article className="rounded-[1.5rem] border border-stone-100 bg-stone-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <p className="font-black text-slate-950">
            {emoji} {name}
          </p>

          <p className="tabular mt-1 text-sm text-slate-500">
            {formatCurrency(spent)} / {formatCurrency(limit)}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-black ${
            isDanger
              ? 'bg-rose-50 text-rose-700'
              : isWarning
                ? 'bg-amber-50 text-amber-700'
                : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {percentage} %
        </span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-white">
        <div
          className={`h-full rounded-full ${
            isDanger
              ? 'bg-rose-500'
              : isWarning
                ? 'bg-amber-400'
                : 'bg-emerald-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </article>
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
              {getTransactionDateLabel(transaction.date)}
            </p>
          </div>
        </div>

        <p className={`tabular font-black ${amountColor}`}>{amountLabel}</p>
      </div>
    </article>
  )
}

export default function StatsPage() {
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

  const { monthKey } = useSelectedMonth()
  const previousMonthKey = getPreviousMonthKey(monthKey)
  const monthLabel = getMonthLabel(monthKey)

  const hasAccounts = accounts.length > 0
  const hasBudgets = monthlyBudgets.length > 0
  const hasRecurringPayments = recurringPayments.length > 0
  const hasDebts = debts.length > 0
  const hasInvestments = investments.length > 0
  const hasGoals = savingGoals.length > 0 || sinkingFunds.length > 0

  const monthlyTransactions = transactions.filter((transaction) => {
    return transaction.date.startsWith(monthKey)
  })

  const previousMonthTransactions = transactions.filter((transaction) => {
    return transaction.date.startsWith(previousMonthKey)
  })

  const hasTransactions = monthlyTransactions.length > 0

  const hasEnoughDataForStats =
    hasTransactions ||
    hasBudgets ||
    hasRecurringPayments ||
    hasDebts ||
    hasInvestments ||
    hasGoals

  const budgetUsages = getBudgetUsages(transactions, monthlyBudgets, monthKey)

  const incomeTransactions = monthlyTransactions.filter((transaction) => {
    return transaction.type === 'income'
  })

  const expenseTransactions = monthlyTransactions.filter((transaction) => {
    return transaction.type === 'expense'
  })

  const previousIncomeTransactions = previousMonthTransactions.filter(
    (transaction) => {
      return transaction.type === 'income'
    },
  )

  const previousExpenseTransactions = previousMonthTransactions.filter(
    (transaction) => {
      return transaction.type === 'expense'
    },
  )

  const totalIncome = incomeTransactions.reduce((total, transaction) => {
    return total + transaction.amount
  }, 0)

  const totalExpenses = expenseTransactions.reduce((total, transaction) => {
    return total + transaction.amount
  }, 0)

  const previousIncome = previousIncomeTransactions.reduce(
    (total, transaction) => {
      return total + transaction.amount
    },
    0,
  )

  const previousExpenses = previousExpenseTransactions.reduce(
    (total, transaction) => {
      return total + transaction.amount
    },
    0,
  )

  const netCashFlow = totalIncome - totalExpenses

  const savingsRate =
    totalIncome > 0 ? Math.round((netCashFlow / totalIncome) * 100) : 0

  const totalBudgetLimit = budgetUsages.reduce((total, budget) => {
    return total + budget.limit
  }, 0)

  const totalBudgetSpent = budgetUsages.reduce((total, budget) => {
    return total + budget.spent
  }, 0)

  const budgetUsageRate = getPercentage(totalBudgetSpent, totalBudgetLimit)

  const budgetAlerts = budgetUsages.filter((budget) => {
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

  const recurringWeightOnIncome = getPercentage(
    recurringMonthlyTotal,
    totalIncome,
  )

  const liquidAssets = accounts
    .filter((account) => account.type !== 'investment')
    .reduce((total, account) => {
      return total + account.balance
    }, 0)

  const totalInvestments = investments.reduce((total, investment) => {
    return total + investment.currentValue
  }, 0)

  const totalInvestedAmount = investments.reduce((total, investment) => {
    return total + investment.investedAmount
  }, 0)

  const investmentGain = totalInvestments - totalInvestedAmount

  const investmentReturn =
    totalInvestedAmount > 0
      ? Math.round((investmentGain / totalInvestedAmount) * 100)
      : 0

  const totalDebts = debts.reduce((total, debt) => {
    return total + debt.remainingAmount
  }, 0)

  const totalAssets = liquidAssets + totalInvestments
  const netWorth = totalAssets - totalDebts
  const debtWeightOnAssets = getPercentage(totalDebts, totalAssets)

  const totalGoalsSaved = savingGoals.reduce((total, goal) => {
    return total + goal.currentAmount
  }, 0)

  const totalGoalsTarget = savingGoals.reduce((total, goal) => {
    return total + goal.targetAmount
  }, 0)

  const totalFundsSaved = sinkingFunds.reduce((total, fund) => {
    return total + fund.currentAmount
  }, 0)

  const totalFundsTarget = sinkingFunds.reduce((total, fund) => {
    return total + fund.targetAmount
  }, 0)

  const totalReserved = totalGoalsSaved + totalFundsSaved
  const totalReservedTarget = totalGoalsTarget + totalFundsTarget
  const reservedProgress = getPercentage(totalReserved, totalReservedTarget)

  const expensesByCategory = expenseTransactions.reduce(
    (accumulator, transaction) => {
      const previousAmount = accumulator.get(transaction.category) ?? 0
      accumulator.set(transaction.category, previousAmount + transaction.amount)

      return accumulator
    },
    new Map<Transaction['category'], number>(),
  )

  const topExpenseCategories = Array.from(expensesByCategory.entries())
    .map(([categoryId, spent]) => ({
      categoryId,
      spent,
    }))
    .sort((firstCategory, secondCategory) => {
      return secondCategory.spent - firstCategory.spent
    })
    .slice(0, 6)

  const biggestExpense = [...expenseTransactions].sort(
    (firstTransaction, secondTransaction) => {
      return secondTransaction.amount - firstTransaction.amount
    },
  )[0]

  const biggestIncome = [...incomeTransactions].sort(
    (firstTransaction, secondTransaction) => {
      return secondTransaction.amount - firstTransaction.amount
    },
  )[0]

  const topBudgetAlerts = [...budgetAlerts]
    .sort((firstBudget, secondBudget) => {
      return secondBudget.percentage - firstBudget.percentage
    })
    .slice(0, 5)

  function getInvestmentReturn(investedAmount: number, currentValue: number) {
    if (investedAmount <= 0) {
      return 0
    }

    return Math.round(((currentValue - investedAmount) / investedAmount) * 100)
  }

  const bestInvestment = [...investments].sort((first, second) => {
    return (
      getInvestmentReturn(second.investedAmount, second.currentValue) -
      getInvestmentReturn(first.investedAmount, first.currentValue)
    )
  })[0]

  const worstInvestment = [...investments].sort((first, second) => {
    return (
      getInvestmentReturn(first.investedAmount, first.currentValue) -
      getInvestmentReturn(second.investedAmount, second.currentValue)
    )
  })[0]

  const insights: Insight[] = [
    {
      title: 'Épargne du mois',
      value: totalIncome > 0 ? `${savingsRate} %` : 'À calculer',
      description:
        totalIncome <= 0
          ? 'Ajoutez des revenus pour calculer votre taux d’épargne.'
          : savingsRate >= 20
            ? 'Très bon rythme : vous conservez une belle part de vos revenus.'
            : savingsRate >= 0
              ? 'Votre mois reste positif, et il y a peut-être une marge pour épargner un peu plus.'
              : 'Votre mois est négatif : les dépenses dépassent les revenus enregistrés.',
      icon: <Percent className="h-5 w-5" />,
      variant:
        totalIncome <= 0
          ? 'blue'
          : savingsRate >= 20
            ? 'emerald'
            : savingsRate >= 0
              ? 'amber'
              : 'rose',
    },
    {
      title: 'Charges fixes',
      value:
        totalIncome > 0 ? `${recurringWeightOnIncome} %` : formatCurrency(0),
      description:
        totalIncome > 0
          ? `Vos abonnements représentent ${recurringWeightOnIncome} % de vos revenus du mois.`
          : 'Ajoutez vos revenus pour mesurer le poids réel des charges fixes.',
      icon: <Repeat2 className="h-5 w-5" />,
      variant:
        recurringWeightOnIncome >= 30
          ? 'rose'
          : recurringWeightOnIncome >= 15
            ? 'amber'
            : 'emerald',
    },
    {
      title: 'Budgets',
      value:
        budgetAlerts.length > 0
          ? `${budgetAlerts.length} alerte${budgetAlerts.length > 1 ? 's' : ''}`
          : 'OK',
      description:
        budgetAlerts.length > 0
          ? 'Certains budgets sont proches de la limite ou déjà dépassés.'
          : 'Aucun budget critique pour le moment.',
      icon: <AlertTriangle className="h-5 w-5" />,
      variant: budgetAlerts.length > 0 ? 'amber' : 'emerald',
    },
    {
      title: 'Endettement',
      value: totalAssets > 0 ? `${debtWeightOnAssets} %` : 'À suivre',
      description:
        totalDebts > 0
          ? `Vos dettes représentent ${debtWeightOnAssets} % de vos actifs connus.`
          : 'Aucune dette suivie actuellement.',
      icon: <WalletCards className="h-5 w-5" />,
      variant:
        totalDebts <= 0
          ? 'emerald'
          : debtWeightOnAssets >= 50
            ? 'rose'
            : debtWeightOnAssets >= 25
              ? 'amber'
              : 'blue',
    },
  ]

  return (
    <div className="space-y-6">
      <section className="animate-rise card-premium overflow-hidden">
        <div className="relative p-6 md:p-8">
          <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-violet-200/40 blur-3xl" />
          <div className="absolute bottom-0 right-24 h-32 w-32 rounded-full bg-emerald-200/40 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                Analyse financière
              </p>

              <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-950 md:text-[2.4rem] md:leading-[1.1]">
                Comprendre votre argent
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Analysez votre mois de{' '}
                <span className="font-black text-slate-950">{monthLabel}</span>{' '}
                avec les revenus, dépenses, budgets, abonnements, dettes,
                objectifs, patrimoine et investissements.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <MonthSwitcher />

              <Link
                to="/patrimoine"
                className="flex w-fit items-center gap-2 rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-emerald-900"
              >
                Voir le patrimoine
              </Link>
            </div>
          </div>
        </div>
      </section>

      {!hasEnoughDataForStats && <EmptyStatsGuide hasAccounts={hasAccounts} />}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PageStatCard
          title="Solde du mois"
          value={formatCurrency(netCashFlow)}
          description="Revenus moins dépenses du mois"
          icon={
            netCashFlow >= 0 ? (
              <ArrowUpRight className="h-5 w-5" />
            ) : (
              <ArrowDownRight className="h-5 w-5" />
            )
          }
          variant={netCashFlow >= 0 ? 'emerald' : 'rose'}
        />

        <PageStatCard
          title="Taux d’épargne"
          value={totalIncome > 0 ? `${savingsRate} %` : '—'}
          description="Part des revenus conservée"
          icon={<Percent className="h-5 w-5" />}
          variant={
            totalIncome <= 0
              ? 'blue'
              : savingsRate >= 20
                ? 'emerald'
                : savingsRate >= 0
                  ? 'amber'
                  : 'rose'
          }
        />

        <PageStatCard
          title="Patrimoine net"
          value={formatCurrency(netWorth)}
          description="Actifs moins dettes"
          icon={<WalletCards className="h-5 w-5" />}
          variant={netWorth >= 0 ? 'blue' : 'rose'}
        />

        <PageStatCard
          title="Alertes budgets"
          value={String(budgetAlerts.length)}
          description="Budgets proches ou dépassés"
          icon={<BarChart3 className="h-5 w-5" />}
          variant={budgetAlerts.length > 0 ? 'amber' : 'emerald'}
        />
      </section>

      <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
        <SectionHeader
          eyebrow="Lecture automatique"
          title="Ce que racontent vos chiffres"
          icon={<Lightbulb className="h-5 w-5" />}
        />

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {insights.map((insight) => (
            <InsightCard key={insight.title} insight={insight} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow="Flux du mois"
            title="Revenus contre dépenses"
            icon={<PieChart className="h-5 w-5" />}
          />

          {hasTransactions ? (
            <div className="mt-6 space-y-5">
              <ProgressRow
                label="Revenus"
                value={totalIncome}
                total={Math.max(totalIncome, totalExpenses)}
                amountLabel={formatCurrency(totalIncome)}
                colorClass="bg-emerald-500"
              />

              <ProgressRow
                label="Dépenses"
                value={totalExpenses}
                total={Math.max(totalIncome, totalExpenses)}
                amountLabel={formatCurrency(totalExpenses)}
                colorClass="bg-rose-500"
              />

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-[1.5rem] bg-stone-50 p-5">
                  <p className="text-sm font-semibold text-slate-500">
                    Évolution revenus
                  </p>

                  <p className="mt-2 font-black text-slate-950">
                    {getEvolutionLabel(totalIncome, previousIncome)}
                  </p>
                </div>

                <div className="rounded-[1.5rem] bg-stone-50 p-5">
                  <p className="text-sm font-semibold text-slate-500">
                    Évolution dépenses
                  </p>

                  <p className="mt-2 font-black text-slate-950">
                    {getEvolutionLabel(totalExpenses, previousExpenses)}
                  </p>
                </div>
              </div>

              <div className="rounded-[1.5rem] bg-stone-50 p-5">
                <p className="text-sm font-semibold text-slate-500">
                  Résultat du mois
                </p>

                <p
                  className={`tabular mt-2 text-4xl font-black ${
                    netCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {netCashFlow >= 0 ? '+' : '-'}
                  {formatCurrency(Math.abs(netCashFlow))}
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {netCashFlow >= 0
                    ? 'Vous avez conservé plus d’argent que vous n’en avez dépensé.'
                    : 'Vous avez dépensé plus que vos revenus enregistrés ce mois-ci.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-stone-200 bg-stone-50 p-8 text-center">
              <p className="text-3xl">📊</p>

              <h3 className="mt-4 text-xl font-black text-slate-950">
                Aucun flux à analyser
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Ajoutez des revenus et des dépenses pour comparer les entrées et
                les sorties du mois.
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

        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow="Budgets"
            title={
              hasBudgets ? `Utilisation à ${budgetUsageRate} %` : 'Aucun budget créé'
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
                    budgetUsageRate >= 100
                      ? 'bg-rose-500'
                      : budgetUsageRate >= 75
                        ? 'bg-amber-400'
                        : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(budgetUsageRate, 100)}%` }}
                />
              </div>

              <p className="mt-5 text-sm leading-6 text-slate-600">
                Vous avez utilisé{' '}
                <span className="tabular font-black text-slate-950">
                  {formatCurrency(totalBudgetSpent)}
                </span>{' '}
                sur{' '}
                <span className="tabular font-black text-slate-950">
                  {formatCurrency(totalBudgetLimit)}
                </span>{' '}
                de budget prévu.
              </p>

              <div className="mt-6 space-y-3">
                {topBudgetAlerts.length > 0 ? (
                  topBudgetAlerts.map((budget) => (
                    <BudgetAlertRow
                      key={budget.category.id}
                      emoji={budget.category.emoji}
                      name={budget.category.name}
                      spent={budget.spent}
                      limit={budget.limit}
                      percentage={budget.percentage}
                      status={budget.status}
                    />
                  ))
                ) : (
                  <div className="rounded-[1.5rem] bg-emerald-50 p-5">
                    <p className="font-black text-emerald-900">
                      Aucun budget critique
                    </p>

                    <p className="mt-2 text-sm text-emerald-800/80">
                      Tous les budgets sont maîtrisés pour le moment.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-stone-200 bg-stone-50 p-8 text-center">
              <p className="text-3xl">🐷</p>

              <h3 className="mt-4 text-xl font-black text-slate-950">
                Créez votre premier budget
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Les budgets permettent de détecter les catégories qui dépassent
                ou approchent de leur limite.
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
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow="Dépenses"
            title="Où part votre argent ?"
            icon={<ArrowDownRight className="h-5 w-5" />}
          />

          <div className="mt-6 space-y-3">
            {topExpenseCategories.length > 0 ? (
              topExpenseCategories.map((category) => (
                <CategoryExpenseRow
                  key={category.categoryId}
                  categoryId={category.categoryId}
                  spent={category.spent}
                  totalExpenses={totalExpenses}
                />
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-stone-200 bg-stone-50 p-8 text-center">
                <p className="text-3xl">🧾</p>

                <h3 className="mt-4 text-xl font-black text-slate-950">
                  Aucune dépense ce mois-ci
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Ajoutez des dépenses pour obtenir une analyse par catégorie.
                </p>

                <Link
                  to={hasAccounts ? '/transactions?action=new' : '/comptes'}
                  className="mt-5 inline-flex rounded-full bg-stone-100 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-stone-200"
                >
                  {hasAccounts ? 'Ajouter une dépense' : 'Créer un compte'}
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
            <SectionHeader
              eyebrow="Transactions clés"
              title="Plus gros mouvements du mois"
              icon={<Landmark className="h-5 w-5" />}
            />

            <div className="mt-6 space-y-3">
              {biggestIncome && <TransactionLine transaction={biggestIncome} />}
              {biggestExpense && (
                <TransactionLine transaction={biggestExpense} />
              )}

              {!biggestIncome && !biggestExpense && (
                <div className="rounded-[1.5rem] bg-stone-50 p-5">
                  <p className="font-black text-slate-950">
                    Aucun mouvement majeur
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    Ajoutez des transactions pour voir les plus gros mouvements
                    du mois.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
            <SectionHeader
              eyebrow="Abonnements"
              title="Poids des charges fixes"
              icon={<Repeat2 className="h-5 w-5" />}
            />

            <div className="mt-6 rounded-[1.5rem] bg-rose-50 p-5">
              <p className="text-sm font-semibold text-rose-700">
                Charges fixes mensuelles
              </p>

              <p className="tabular mt-2 text-3xl font-black text-rose-950">
                {formatCurrency(recurringMonthlyTotal)}
              </p>

              <p className="mt-2 text-sm text-rose-800/80">
                {totalIncome > 0
                  ? `Cela représente environ ${recurringWeightOnIncome} % des revenus enregistrés ce mois-ci.`
                  : 'Ajoutez des revenus pour calculer le poids des charges fixes.'}
              </p>
            </div>

            <Link
              to={hasAccounts ? '/abonnements?action=new' : '/comptes'}
              className="mt-5 inline-flex rounded-full bg-stone-100 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-stone-200"
            >
              {hasAccounts ? 'Ajouter une charge fixe' : 'Créer un compte'}
            </Link>
          </section>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow="Patrimoine"
            title="Structure globale"
            icon={<WalletCards className="h-5 w-5" />}
          />

          {totalAssets > 0 || totalDebts > 0 ? (
            <div className="mt-6 space-y-5">
              <ProgressRow
                label="Argent liquide"
                value={liquidAssets}
                total={totalAssets}
                amountLabel={formatCurrency(liquidAssets)}
                colorClass="bg-blue-500"
              />

              <ProgressRow
                label="Investissements"
                value={totalInvestments}
                total={totalAssets}
                amountLabel={formatCurrency(totalInvestments)}
                colorClass="bg-violet-500"
              />

              <ProgressRow
                label="Dettes"
                value={totalDebts}
                total={Math.max(totalAssets, totalDebts)}
                amountLabel={`${debtWeightOnAssets} % des actifs`}
                colorClass="bg-rose-500"
              />
            </div>
          ) : (
            <div className="mt-6 rounded-[1.5rem] bg-stone-50 p-5">
              <p className="font-black text-slate-950">
                Patrimoine à construire
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Ajoutez un compte, une dette ou un investissement pour obtenir
                une vue globale.
              </p>
            </div>
          )}

          <Link
            to="/patrimoine"
            className="mt-6 inline-flex rounded-full bg-stone-100 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-stone-200"
          >
            Voir le détail
          </Link>
        </div>

        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow="Investissements"
            title="Performance"
            icon={<TrendingUp className="h-5 w-5" />}
          />

          {hasInvestments ? (
            <>
              <div className="mt-6 rounded-[1.5rem] bg-violet-50 p-5">
                <p className="text-sm font-semibold text-violet-700">
                  Gain / perte global
                </p>

                <p
                  className={`tabular mt-2 text-3xl font-black ${
                    investmentGain >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {investmentGain >= 0 ? '+' : '-'}
                  {formatCurrency(Math.abs(investmentGain))}
                </p>

                <p className="mt-2 text-sm text-violet-800/80">
                  Soit {investmentReturn >= 0 ? '+' : ''}
                  {investmentReturn} % de rendement.
                </p>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-[1.5rem] bg-stone-50 p-4">
                  <p className="text-sm font-semibold text-slate-500">
                    Meilleur placement
                  </p>

                  <p className="mt-1 font-black text-slate-950">
                    {bestInvestment
                      ? `${bestInvestment.emoji} ${bestInvestment.title}`
                      : 'Aucun'}
                  </p>
                </div>

                <div className="rounded-[1.5rem] bg-stone-50 p-4">
                  <p className="text-sm font-semibold text-slate-500">
                    À surveiller
                  </p>

                  <p className="mt-1 font-black text-slate-950">
                    {worstInvestment
                      ? `${worstInvestment.emoji} ${worstInvestment.title}`
                      : 'Aucun'}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-stone-200 bg-stone-50 p-8 text-center">
              <p className="text-3xl">📈</p>

              <h3 className="mt-4 text-xl font-black text-slate-950">
                Aucun investissement
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Ajoutez vos placements pour suivre leur performance.
              </p>

              <Link
                to="/investissements?action=new"
                className="mt-5 inline-flex rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-900"
              >
                Ajouter un placement
              </Link>
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow="Objectifs"
            title="Progression réservée"
            icon={<Target className="h-5 w-5" />}
          />

          {hasGoals ? (
            <>
              <div className="mt-6 rounded-[1.5rem] bg-emerald-50 p-5">
                <p className="text-sm font-semibold text-emerald-700">
                  Argent réservé
                </p>

                <p className="tabular mt-2 text-3xl font-black text-emerald-950">
                  {formatCurrency(totalReserved)}
                </p>

                <p className="tabular mt-2 text-sm text-emerald-800/80">
                  Sur un objectif total de{' '}
                  {formatCurrency(totalReservedTarget)}.
                </p>
              </div>

              <div className="mt-5 h-4 overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${reservedProgress}%` }}
                />
              </div>

              <p className="mt-3 text-sm font-black text-emerald-700">
                {reservedProgress} % complété
              </p>
            </>
          ) : (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-stone-200 bg-stone-50 p-8 text-center">
              <p className="text-3xl">🎯</p>

              <h3 className="mt-4 text-xl font-black text-slate-950">
                Aucun objectif
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Ajoutez un objectif pour suivre votre épargne réservée.
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
      </section>
    </div>
  )
}
import { type ReactNode } from 'react'
import { Link } from 'react-router'
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Circle,
  Landmark,
  Lightbulb,
  LineChart,
  PiggyBank,
  Plus,
  ReceiptText,
  Repeat2,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  WalletCards,
} from 'lucide-react'

import { useBudgetData } from '../context/useBudgetData'
import { useHolderFilter } from '../context/useHolderFilter'
import {
  filterAccountsByHolder,
  filterTransactionsByHolder,
} from '../lib/holderFilter'
import {
  getBudgetUsages,
  getCategoryById,
  getCurrentMonthKey,
  getEndOfMonthForecast,
  getMonthLabel,
  type EndOfMonthForecast,
} from '../services/budgetStatsService'
import { detectSubscriptions } from '../services/subscriptionDetectionService'
import {
  getFinancialTips,
  type FinancialTip,
} from '../services/financialTipsService'
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
          ? `Vous mettez de côté environ ${ratePercent} % de vos revenus. Belle marge, vous gardez le contrôle.`
          : 'Vos finances sont bien tenues ce mois-ci. Vous gardez le contrôle.',
    },
    equilibre: {
      label: 'Budget équilibré',
      message:
        'Vos dépenses restent sous vos revenus. Un mois sain, avec encore un peu de marge.',
    },
    attention: {
      label: 'À surveiller',
      message:
        'Votre mois est juste. Quelques ajustements suffiraient à retrouver de la marge.',
    },
    tension: {
      label: 'Mois en tension',
      message:
        'Vos dépenses dépassent vos revenus ce mois-ci. Pas de panique : on regarde où agir en priorité.',
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

const forecastToneStyles: Record<
  EndOfMonthForecast['tone'],
  { panel: string; chip: string; dot: string; amount: string; bar: string }
> = {
  serein: {
    panel: 'border-emerald-100 bg-emerald-50',
    chip: 'bg-emerald-100 text-emerald-800',
    dot: 'bg-emerald-500',
    amount: 'text-emerald-900',
    bar: 'bg-emerald-500',
  },
  juste: {
    panel: 'border-amber-100 bg-amber-50',
    chip: 'bg-amber-100 text-amber-800',
    dot: 'bg-amber-500',
    amount: 'text-amber-900',
    bar: 'bg-amber-500',
  },
  risque: {
    panel: 'border-rose-100 bg-rose-50',
    chip: 'bg-rose-100 text-rose-800',
    dot: 'bg-rose-500',
    amount: 'text-rose-900',
    bar: 'bg-rose-500',
  },
}

function ForecastCard({ forecast }: { forecast: EndOfMonthForecast }) {
  const styles = forecastToneStyles[forecast.tone]
  const monthProgress = Math.round(
    (forecast.daysElapsed / forecast.daysInMonth) * 100,
  )

  const breakdown = [
    {
      label: 'Rythme quotidien',
      value: formatCurrency(forecast.dailyPace),
      hint: 'dépenses du quotidien par jour',
    },
    {
      label: 'Charges fixes à venir',
      value: `-${formatCurrency(forecast.upcomingRecurring)}`,
      hint: 'd’ici la fin du mois',
    },
    ...(forecast.upcomingRecurringIncome > 0
      ? [
          {
            label: 'Revenus à venir',
            value: `+${formatCurrency(forecast.upcomingRecurringIncome)}`,
            hint: 'salaire et revenus récurrents attendus',
          },
        ]
      : []),
    {
      label: 'Dépenses restantes estimées',
      value: `-${formatCurrency(forecast.projectedRemainingExpenses)}`,
      hint: 'rythme + charges fixes',
    },
    {
      label: 'Résultat du mois projeté',
      value: formatCurrency(forecast.projectedMonthResult),
      hint: 'revenus - dépenses estimées',
    },
  ]

  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
      <SectionHeader
        eyebrow="Prévision"
        title="Votre fin de mois, anticipée"
        icon={<LineChart className="h-5 w-5" />}
        action={
          <Link
            to="/calendrier"
            className="hidden rounded-full bg-stone-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-stone-200 md:inline-flex"
          >
            Calendrier
          </Link>
        }
      />

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className={`rounded-[1.75rem] border p-5 ${styles.panel}`}>
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${styles.chip}`}
          >
            <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
            {forecast.label}
          </div>

          <p className="mt-3 text-sm font-semibold text-slate-500">
            Argent disponible estimé en fin de mois
          </p>

          <p
            className={`tabular mt-1 text-4xl font-black tracking-tight ${styles.amount}`}
          >
            {formatCurrency(forecast.projectedEndBalance)}
          </p>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {forecast.message}
          </p>

          <div className="mt-5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>
                Jour {forecast.daysElapsed} sur {forecast.daysInMonth}
              </span>
              <span>
                {forecast.daysRemaining} jour
                {forecast.daysRemaining > 1 ? 's' : ''} restant
                {forecast.daysRemaining > 1 ? 's' : ''}
              </span>
            </div>

            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/70">
              <div
                className={`h-full rounded-full ${styles.bar}`}
                style={{ width: `${Math.max(monthProgress, 3)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {breakdown.map((item) => (
            <div
              key={item.label}
              className="rounded-[1.5rem] border border-stone-100 bg-stone-50 p-4"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                {item.label}
              </p>
              <p className="tabular mt-2 text-xl font-black text-slate-950">
                {item.value}
              </p>
              <p className="mt-1 text-xs text-slate-500">{item.hint}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-400">
        Estimation basée sur votre rythme de dépenses du mois, vos charges fixes
        et vos revenus récurrents encore attendus d’ici la fin du mois.
      </p>
    </section>
  )
}

const tipToneStyles: Record<
  FinancialTip['tone'],
  { card: string; icon: string; link: string; Icon: typeof Lightbulb }
> = {
  positive: {
    card: 'border-emerald-100 bg-emerald-50',
    icon: 'bg-emerald-100 text-emerald-700',
    link: 'text-emerald-800 hover:text-emerald-950',
    Icon: Sparkles,
  },
  info: {
    card: 'border-blue-100 bg-blue-50',
    icon: 'bg-blue-100 text-blue-700',
    link: 'text-blue-800 hover:text-blue-950',
    Icon: Lightbulb,
  },
  warning: {
    card: 'border-amber-100 bg-amber-50',
    icon: 'bg-amber-100 text-amber-700',
    link: 'text-amber-900 hover:text-amber-950',
    Icon: AlertTriangle,
  },
}

function TipCard({ tip }: { tip: FinancialTip }) {
  const styles = tipToneStyles[tip.tone]
  const Icon = styles.Icon

  return (
    <article className={`flex flex-col rounded-[1.5rem] border p-5 ${styles.card}`}>
      <div className="flex items-start gap-3">
        <div className={`shrink-0 rounded-2xl p-2.5 ${styles.icon}`}>
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <p className="font-display text-base font-semibold text-slate-950">
            {tip.title}
          </p>
          <p className="mt-1.5 text-sm leading-6 text-slate-600">
            {tip.message}
          </p>
        </div>
      </div>

      {tip.href && tip.actionLabel && (
        <Link
          to={tip.href}
          className={`mt-3 inline-flex w-fit items-center gap-1 text-sm font-bold transition ${styles.link}`}
        >
          {tip.actionLabel}
          <span aria-hidden>→</span>
        </Link>
      )}
    </article>
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
    emerald: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/70 text-emerald-900',
    blue: 'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/70 text-blue-900',
    rose: 'border-rose-200 bg-gradient-to-br from-rose-50 to-rose-100/70 text-rose-900',
    amber: 'border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/70 text-amber-900',
    violet: 'border-violet-200 bg-gradient-to-br from-violet-50 to-violet-100/70 text-violet-900',
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
    emerald: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/70 text-emerald-900',
    blue: 'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/70 text-blue-900',
    rose: 'border-rose-200 bg-gradient-to-br from-rose-50 to-rose-100/70 text-rose-900',
    amber: 'border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/70 text-amber-900',
    violet: 'border-violet-200 bg-gradient-to-br from-violet-50 to-violet-100/70 text-violet-900',
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
    emerald: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/70 text-emerald-900',
    blue: 'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/70 text-blue-900',
    rose: 'border-rose-200 bg-gradient-to-br from-rose-50 to-rose-100/70 text-rose-900',
    amber: 'border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/70 text-amber-900',
    violet: 'border-violet-200 bg-gradient-to-br from-violet-50 to-violet-100/70 text-violet-900',
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
            Avancez étape par étape : créez un compte, ajoutez vos mouvements,
            fixez vos budgets puis commencez à prévoir vos projets.
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

            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
              Construisez votre cockpit financier
            </h1>

            <p className="mt-4 text-sm leading-6 text-slate-600 md:text-base">
              Commencez par créer votre premier compte. Ensuite, votre accueil
              deviendra une vraie page de pilotage avec vos priorités, vos
              alertes, vos prochaines charges et vos dernières transactions.
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
    transactions: allTransactions,
    monthlyBudgets,
    recurringPayments: allRecurringPayments,
    savingGoals,
    sinkingFunds,
    debts,
    investments,
  } = useBudgetData()

  const { selectedHolder } = useHolderFilter()

  // Filtre « par personne » : comptes, transactions et charges récurrentes du
  // titulaire sélectionné. (Objectifs, dettes et placements restent globaux :
  // ils ne sont pas rattachés à un titulaire de compte.)
  const visibleAccounts = filterAccountsByHolder(accounts, selectedHolder)
  const transactions = filterTransactionsByHolder(
    allTransactions,
    accounts,
    selectedHolder,
  )
  const visibleAccountIds = new Set(
    visibleAccounts.map((account) => account.id),
  )
  const recurringPayments =
    selectedHolder === 'all'
      ? allRecurringPayments
      : allRecurringPayments.filter((payment) =>
          visibleAccountIds.has(payment.accountId),
        )

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
      description: 'Base indispensable pour lier vos mouvements.',
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

  const liquidAccountsTotal = visibleAccounts
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
    return payment.isActive && payment.type !== 'income'
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

  const financialHealth = getFinancialHealth({
    monthlyIncome,
    monthlyBalance,
    alertCount: alertBudgets.length,
    budgetCount: budgetUsages.length,
  })

  const endOfMonthForecast = getEndOfMonthForecast({
    transactions,
    recurringPayments,
    liquidBalance: liquidAccountsTotal,
    monthIncome: monthlyIncome,
    monthExpenses: monthlyExpenses,
    monthKey,
  })

  const subscriptionCandidatesCount = detectSubscriptions(
    transactions,
    recurringPayments,
  ).length

  const financialTips = getFinancialTips({
    monthlyIncome,
    monthlyBalance,
    budgetUsages,
    recurringMonthlyTotal,
    savingGoals,
    sinkingFunds,
    subscriptionCandidatesCount,
    forecast: endOfMonthForecast,
  })

  return (
    <div className="space-y-6">
      <section className="animate-rise overflow-hidden rounded-[1.75rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-[#fffdf9] to-amber-50 shadow-md">
        <div className="relative p-6 md:p-8">
          <div className="absolute -right-6 -top-8 h-52 w-52 rounded-full bg-emerald-300/40 blur-3xl" />
          <div className="absolute bottom-0 right-24 h-36 w-36 rounded-full bg-amber-300/45 blur-3xl" />
          <div className="absolute -bottom-10 left-8 h-40 w-40 rounded-full bg-sky-200/35 blur-3xl" />

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

      {endOfMonthForecast && <ForecastCard forecast={endOfMonthForecast} />}

      {financialTips.length > 0 && (
        <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow="Conseils pour vous"
            title="Vos pistes du moment"
            icon={<Lightbulb className="h-5 w-5" />}
          />

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {financialTips.slice(0, 2).map((tip) => (
              <TipCard key={tip.id} tip={tip} />
            ))}
          </div>
        </section>
      )}

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
                    ? 'Ajoutez une transaction pour alimenter votre cockpit.'
                    : 'Créez un compte avant d’ajouter vos premiers mouvements.'}
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
                  Ajoutez vos charges fixes pour mieux anticiper votre mois.
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
                Créez votre premier budget
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Fixez une limite par catégorie pour mieux suivre votre mois.
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
                  Ajoutez un objectif pour donner un but à votre argent.
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
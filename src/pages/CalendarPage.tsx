import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Landmark,
  Plus,
  ReceiptText,
  Repeat2,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from 'lucide-react'

import { useBudgetData } from '../context/useBudgetData'
import { budgetCategories } from '../data/budgetCategories'
import type {
  BudgetCategoryId,
  RecurringPayment,
  Transaction,
  TransactionType,
} from '../types/budget'
import { formatCurrency } from '../utils/formatCurrency'

type CalendarDay = {
  date: Date
  dateKey: string
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
  transactions: Transaction[]
  recurringPayments: RecurringPayment[]
}

type CalendarItem = {
  id: string
  title: string
  amount: number
  type: TransactionType
  dateKey: string
  category: BudgetCategoryId
  label: string
  isRecurring: boolean
}

const weekDays = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM']

function getDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getTodayKey() {
  return getDateKey(new Date())
}

function getMonthKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')

  return `${year}-${month}`
}

function getMonthLabel(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function getDateLabel(dateKey: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${dateKey}T12:00:00`))
}

function getShortDateLabel(dateKey: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${dateKey}T12:00:00`))
}

function getDaysInMonth(monthDate: Date) {
  return new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() + 1,
    0,
  ).getDate()
}

function getRecurringPaymentDateKey(
  monthDate: Date,
  payment: RecurringPayment,
) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const day = Math.min(payment.dayOfMonth, getDaysInMonth(monthDate))

  return getDateKey(new Date(year, month, day))
}

function getCalendarDays(
  monthDate: Date,
  transactions: Transaction[],
  recurringPayments: RecurringPayment[],
) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const firstDayIndex = (firstDayOfMonth.getDay() + 6) % 7

  const calendarStart = new Date(firstDayOfMonth)
  calendarStart.setDate(firstDayOfMonth.getDate() - firstDayIndex)

  const todayKey = getTodayKey()

  return Array.from({ length: 42 }, (_, index) => {
    const currentDate = new Date(calendarStart)
    currentDate.setDate(calendarStart.getDate() + index)

    const dateKey = getDateKey(currentDate)
    const isCurrentMonth = currentDate.getMonth() === month

    const dayTransactions = transactions.filter((transaction) => {
      return transaction.date === dateKey
    })

    const dayRecurringPayments = isCurrentMonth
      ? recurringPayments.filter((payment) => {
          return getRecurringPaymentDateKey(monthDate, payment) === dateKey
        })
      : []

    return {
      date: currentDate,
      dateKey,
      dayNumber: currentDate.getDate(),
      isCurrentMonth,
      isToday: dateKey === todayKey,
      transactions: dayTransactions,
      recurringPayments: dayRecurringPayments,
    }
  })
}

function getCategoryById(categoryId: BudgetCategoryId) {
  return (
    budgetCategories.find((category) => category.id === categoryId) ?? {
      id: categoryId,
      name: 'Autre',
      description: 'Mouvement non classé',
      emoji: '📌',
      colorClass: 'border-stone-100 bg-stone-50 text-slate-700',
    }
  )
}

function getCalendarItemLabel(type: TransactionType) {
  if (type === 'income') {
    return 'Revenu'
  }

  if (type === 'expense') {
    return 'Dépense'
  }

  return 'Virement'
}

function getAmountLabel(item: CalendarItem) {
  if (item.type === 'income') {
    return `+${formatCurrency(item.amount)}`
  }

  if (item.type === 'expense') {
    return `-${formatCurrency(item.amount)}`
  }

  return `↔ ${formatCurrency(item.amount)}`
}

function getAmountColorClass(type: TransactionType) {
  if (type === 'income') {
    return 'text-emerald-700'
  }

  if (type === 'expense') {
    return 'text-rose-700'
  }

  return 'text-blue-700'
}

function createTransactionCalendarItem(transaction: Transaction): CalendarItem {
  return {
    id: `transaction-${transaction.id}`,
    title: transaction.title,
    amount: transaction.amount,
    dateKey: transaction.date,
    category: transaction.category,
    type: transaction.type,
    label: getCalendarItemLabel(transaction.type),
    isRecurring: transaction.isRecurring ?? false,
  }
}

function createRecurringPaymentCalendarItem(
  payment: RecurringPayment,
  monthDate: Date,
): CalendarItem {
  const dateKey = getRecurringPaymentDateKey(monthDate, payment)
  const isIncome = payment.type === 'income'

  return {
    id: `recurring-${payment.id}-${dateKey}`,
    title: payment.title,
    amount: payment.amount,
    dateKey,
    category: payment.category,
    type: isIncome ? 'income' : 'expense',
    label: isIncome ? 'Revenu fixe' : 'Charge fixe',
    isRecurring: true,
  }
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

function EmptyCalendarGuide({ hasAccounts }: { hasAccounts: boolean }) {
  return (
    <section className="rounded-[2rem] border border-amber-100 bg-amber-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-white p-3 text-amber-700 shadow-sm">
            {hasAccounts ? (
              <CalendarDays className="h-6 w-6" />
            ) : (
              <WalletCards className="h-6 w-6" />
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-amber-700">
              Calendrier vide
            </p>

            <h2 className="mt-1 text-xl font-black text-amber-950">
              {hasAccounts
                ? 'Ajoutez des mouvements pour alimenter votre calendrier'
                : 'Créez d’abord un compte pour commencer votre suivi'}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-800/80">
              {hasAccounts
                ? 'Le calendrier affichera vos transactions datées et vos charges fixes actives. Ajoutez une transaction ou un abonnement pour visualiser votre mois.'
                : 'Une transaction ou une charge fixe doit être reliée à un compte. Commencez par créer votre premier compte, puis ajoutez vos mouvements.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to={hasAccounts ? '/transactions?action=new' : '/comptes'}
            className="flex w-fit items-center justify-center gap-2 rounded-full bg-emerald-950 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-900"
          >
            <Plus className="h-4 w-4" />
            {hasAccounts ? 'Nouvelle transaction' : 'Créer un compte'}
          </Link>

          {hasAccounts && (
            <Link
              to="/abonnements?action=new"
              className="flex w-fit items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-amber-800 shadow-sm transition hover:bg-amber-100"
            >
              <Repeat2 className="h-4 w-4" />
              Ajouter une charge fixe
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}

function CalendarItemCard({
  item,
  compact = false,
}: {
  item: CalendarItem
  compact?: boolean
}) {
  const category = getCategoryById(item.category)
  const isIncome = item.type === 'income'
  const isTransfer = item.type === 'transfer'

  return (
    <article
      className={`rounded-[1.5rem] border border-stone-100 bg-stone-50 ${
        compact ? 'p-4' : 'p-5'
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div
            className={`flex shrink-0 items-center justify-center rounded-2xl border ${
              isIncome
                ? 'border-emerald-100 bg-emerald-50'
                : isTransfer
                  ? 'border-blue-100 bg-blue-50'
                  : item.isRecurring
                    ? 'border-amber-100 bg-amber-50'
                    : 'border-rose-100 bg-rose-50'
            } ${compact ? 'h-12 w-12' : 'h-16 w-16'}`}
          >
            <span className={compact ? 'text-xl' : 'text-2xl'}>
              {isTransfer ? '↔️' : item.isRecurring ? '🔁' : category.emoji}
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-black text-slate-950">
                {item.title}
              </h3>

              {item.isRecurring && (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700">
                  Récurrent
                </span>
              )}

              {isTransfer && (
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">
                  Virement
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {item.label}
              {compact ? '' : ` · ${getShortDateLabel(item.dateKey)}`}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className={`tabular font-black ${getAmountColorClass(item.type)}`}>
            {getAmountLabel(item)}
          </p>

          {!compact && (
            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">
              {item.label}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}

function CalendarDayButton({
  day,
  isSelected,
  onSelect,
}: {
  day: CalendarDay
  isSelected: boolean
  onSelect: () => void
}) {
  const incomeCount = day.transactions.filter((transaction) => {
    return transaction.type === 'income'
  }).length

  const expenseCount = day.transactions.filter((transaction) => {
    return transaction.type === 'expense'
  }).length

  const transferCount = day.transactions.filter((transaction) => {
    return transaction.type === 'transfer'
  }).length

  const recurringCount = day.recurringPayments.length
  const itemCount = day.transactions.length + day.recurringPayments.length

  const firstTransaction = day.transactions[0]
  const firstRecurringPayment = day.recurringPayments[0]
  const firstLabel = firstTransaction?.title ?? firstRecurringPayment?.title

  if (!day.isCurrentMonth) {
    return (
      <div className="min-h-24 rounded-[1.5rem] border border-transparent bg-transparent md:min-h-32" />
    )
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`min-h-24 rounded-[1.5rem] border p-3 text-left transition md:min-h-32 ${
        isSelected
          ? 'border-emerald-300 bg-emerald-50 shadow-sm'
          : 'border-stone-200 bg-white hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black ${
            day.isToday
              ? 'bg-emerald-950 text-white'
              : 'bg-stone-50 text-slate-800'
          }`}
        >
          {day.dayNumber}
        </span>

        {itemCount > 0 && (
          <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-stone-50 px-2 text-xs font-black text-slate-500">
            {itemCount}
          </span>
        )}
      </div>

      {itemCount > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex gap-1">
            {incomeCount > 0 && (
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
            )}

            {expenseCount > 0 && (
              <span className="h-3 w-3 rounded-full bg-rose-500" />
            )}

            {transferCount > 0 && (
              <span className="h-3 w-3 rounded-full bg-blue-500" />
            )}

            {recurringCount > 0 && (
              <span className="h-3 w-3 rounded-full bg-amber-400" />
            )}
          </div>

          {firstLabel && (
            <p className="line-clamp-1 text-xs font-black text-slate-600">
              {firstLabel}
            </p>
          )}
        </div>
      )}
    </button>
  )
}

export default function CalendarPage() {
  const { accounts, transactions, recurringPayments } = useBudgetData()

  const today = new Date()
  const [monthDate, setMonthDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  )
  const [selectedDateKey, setSelectedDateKey] = useState(getTodayKey())

  const hasAccounts = accounts.length > 0

  const activeRecurringPayments = recurringPayments.filter((payment) => {
    return payment.isActive
  })

  const hasCalendarData =
    transactions.length > 0 || activeRecurringPayments.length > 0

  const monthKey = getMonthKey(monthDate)
  const monthLabel = getMonthLabel(monthDate)

  const monthTransactions = transactions.filter((transaction) => {
    return transaction.date.startsWith(monthKey)
  })

  const monthRecurringItems = activeRecurringPayments.map((payment) => {
    return createRecurringPaymentCalendarItem(payment, monthDate)
  })

  const selectedDayItems = [
    ...transactions
      .filter((transaction) => transaction.date === selectedDateKey)
      .map(createTransactionCalendarItem),
    ...monthRecurringItems.filter((item) => item.dateKey === selectedDateKey),
  ].sort((firstItem, secondItem) => {
    return secondItem.amount - firstItem.amount
  })

  const upcomingItems = [
    ...monthTransactions.map(createTransactionCalendarItem),
    ...monthRecurringItems,
  ]
    .filter((item) => item.dateKey >= selectedDateKey)
    .sort((firstItem, secondItem) => {
      return firstItem.dateKey.localeCompare(secondItem.dateKey)
    })
    .slice(0, 6)

  const calendarDays = getCalendarDays(
    monthDate,
    transactions,
    activeRecurringPayments,
  )

  const activeDaysCount = new Set([
    ...monthTransactions.map((transaction) => transaction.date),
    ...monthRecurringItems.map((item) => item.dateKey),
  ]).size

  const monthlyIncome = monthTransactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((total, transaction) => total + transaction.amount, 0)

  const monthlyExpenses = monthTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((total, transaction) => total + transaction.amount, 0)

  const recurringAmount = activeRecurringPayments
    .filter((payment) => payment.type !== 'income')
    .reduce((total, payment) => total + payment.amount, 0)

  function goToPreviousMonth() {
    const previousMonth = new Date(monthDate)
    previousMonth.setMonth(monthDate.getMonth() - 1)

    setMonthDate(previousMonth)
    setSelectedDateKey(getDateKey(previousMonth))
  }

  function goToNextMonth() {
    const nextMonth = new Date(monthDate)
    nextMonth.setMonth(monthDate.getMonth() + 1)

    setMonthDate(nextMonth)
    setSelectedDateKey(getDateKey(nextMonth))
  }

  function goToCurrentMonth() {
    const currentDate = new Date()

    setMonthDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1))
    setSelectedDateKey(getDateKey(currentDate))
  }

  return (
    <div className="space-y-6">
      <section className="animate-rise card-premium overflow-hidden">
        <div className="relative p-6 md:p-8">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-blue-100/40 blur-3xl" />
          <div className="absolute bottom-0 right-24 h-32 w-32 rounded-full bg-emerald-100/40 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                Calendrier financier
              </p>

              <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-950 md:text-[2.4rem] md:leading-[1.1]">
                Visualisez votre mois
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Retrouvez vos revenus, vos dépenses, vos virements et vos charges
                fixes par jour. Le calendrier est synchronisé avec les
                transactions et les abonnements enregistrés dans Supabase.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={goToCurrentMonth}
                className="flex w-fit items-center gap-2 rounded-full bg-stone-100 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-stone-200 hover:text-slate-950"
              >
                Aujourd’hui
              </button>

              <Link
                to={hasAccounts ? '/transactions?action=new' : '/comptes'}
                className="flex w-fit items-center gap-2 rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-emerald-900"
              >
                <Plus className="h-4 w-4" />
                {hasAccounts ? 'Nouvelle transaction' : 'Créer un compte'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {!hasCalendarData && <EmptyCalendarGuide hasAccounts={hasAccounts} />}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PageStatCard
          title="Jours actifs"
          value={String(activeDaysCount)}
          description="Jours avec mouvement"
          icon={<CalendarDays className="h-5 w-5" />}
          variant="emerald"
        />

        <PageStatCard
          title="Revenus"
          value={formatCurrency(monthlyIncome)}
          description="Entrées du mois"
          icon={<TrendingUp className="h-5 w-5" />}
          variant="blue"
        />

        <PageStatCard
          title="Dépenses"
          value={formatCurrency(monthlyExpenses)}
          description="Sorties déjà enregistrées"
          icon={<TrendingDown className="h-5 w-5" />}
          variant="rose"
        />

        <PageStatCard
          title="Charges fixes"
          value={formatCurrency(recurringAmount)}
          description="Paiements récurrents actifs"
          icon={<Repeat2 className="h-5 w-5" />}
          variant="amber"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.6fr_0.8fr]">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-600">
                Vue mensuelle
              </p>

              <h2 className="mt-1 text-3xl font-black text-slate-950">
                {monthLabel}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goToPreviousMonth}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-100 text-slate-600 transition hover:bg-stone-200 hover:text-slate-950"
                aria-label="Mois précédent"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={goToNextMonth}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-100 text-slate-600 transition hover:bg-stone-200 hover:text-slate-950"
                aria-label="Mois suivant"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-7 gap-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-black text-slate-400 md:text-sm"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-7 gap-2">
            {calendarDays.map((day) => (
              <CalendarDayButton
                key={day.dateKey}
                day={day}
                isSelected={day.dateKey === selectedDateKey}
                onSelect={() => setSelectedDateKey(day.dateKey)}
              />
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3 text-xs font-bold text-slate-500">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              Revenu
            </span>

            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-500" />
              Dépense
            </span>

            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-blue-500" />
              Virement
            </span>

            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              Charge fixe
            </span>
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-emerald-600">
                  Jour sélectionné
                </p>

                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  {getDateLabel(selectedDateKey)}
                </h2>
              </div>

              <div className="rounded-2xl bg-stone-100 p-3 text-slate-600">
                <ReceiptText className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {selectedDayItems.length > 0 ? (
                selectedDayItems.map((item) => (
                  <CalendarItemCard key={item.id} item={item} />
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-stone-200 bg-stone-50 p-8 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl">
                    ☕
                  </div>

                  <h3 className="mt-4 text-xl font-black text-slate-950">
                    Rien de prévu
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Aucun mouvement enregistré sur cette journée.
                  </p>

                  <Link
                    to={hasAccounts ? '/transactions?action=new' : '/comptes'}
                    className="mt-5 inline-flex rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-900"
                  >
                    {hasAccounts ? 'Ajouter un mouvement' : 'Créer un compte'}
                  </Link>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-emerald-600">
                  À venir
                </p>

                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  Prochains mouvements
                </h2>
              </div>

              <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                <Clock className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {upcomingItems.length > 0 ? (
                upcomingItems.map((item) => (
                  <CalendarItemCard key={item.id} item={item} compact />
                ))
              ) : (
                <div className="rounded-[1.5rem] bg-stone-50 p-5">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-white p-3 text-slate-500">
                      {hasAccounts ? (
                        <CalendarDays className="h-5 w-5" />
                      ) : (
                        <Landmark className="h-5 w-5" />
                      )}
                    </div>

                    <div>
                      <p className="font-black text-slate-950">
                        Aucun mouvement à venir
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {hasAccounts
                          ? 'Ajoutez une transaction ou une charge fixe pour remplir le calendrier.'
                          : 'Créez d’abord un compte pour commencer à suivre votre mois.'}
                      </p>

                      <Link
                        to={hasAccounts ? '/abonnements?action=new' : '/comptes'}
                        className="mt-3 inline-flex rounded-full bg-stone-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-stone-200"
                      >
                        {hasAccounts
                          ? 'Ajouter une charge fixe'
                          : 'Créer un compte'}
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}
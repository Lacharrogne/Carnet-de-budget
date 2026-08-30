import { type ReactNode } from 'react'
import { Link } from 'react-router'
import {
  AlertTriangle,
  Banknote,
  BarChart3,
  Coins,
  CreditCard,
  Landmark,
  Plus,
  ShieldCheck,
  Target,
  TrendingUp,
  WalletCards,
} from 'lucide-react'

import { useBudgetData } from '../context/useBudgetData'
import { useHolderFilter } from '../context/useHolderFilter'
import { filterAccountsByHolder } from '../lib/holderFilter'
import type { Account } from '../types/budget'
import type { Investment, InvestmentType } from '../types/investment'
import { formatCurrency } from '../utils/formatCurrency'

type StatVariant = 'emerald' | 'blue' | 'rose' | 'amber' | 'violet'

function getAccountTypeLabel(type: Account['type']) {
  if (type === 'current') {
    return 'Compte courant'
  }

  if (type === 'savings') {
    return 'Épargne'
  }

  if (type === 'cash') {
    return 'Espèces'
  }

  return 'Compte investissement'
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

function EmptyNetWorthGuide() {
  return (
    <section className="rounded-[2rem] border border-amber-100 bg-amber-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-white p-3 text-amber-700 shadow-sm">
            <WalletCards className="h-6 w-6" />
          </div>

          <div>
            <p className="text-sm font-semibold text-amber-700">
              Patrimoine à construire
            </p>

            <h2 className="mt-1 text-xl font-black text-amber-950">
              Créez votre premier compte pour commencer votre bilan
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-800/80">
              La page patrimoine devient vraiment utile quand vous ajoutez vos
              comptes, vos placements et éventuellement vos dettes. Elle calcule
              ensuite automatiquement ce que vous possédez réellement.
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

function AccountLine({
  account,
  totalLiquidAssets,
}: {
  account: Account
  totalLiquidAssets: number
}) {
  const percentage =
    totalLiquidAssets > 0
      ? Math.round((account.balance / totalLiquidAssets) * 100)
      : 0

  return (
    <article className="rounded-[1.5rem] border border-stone-100 bg-stone-50 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`rounded-2xl border p-3 ${account.colorClass}`}>
            <span className="text-xl">{account.emoji}</span>
          </div>

          <div className="min-w-0">
            <p className="truncate font-black text-slate-950">
              {account.name}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {getAccountTypeLabel(account.type)} · {percentage} %
            </p>
          </div>
        </div>

        <p className="tabular font-black text-slate-950">
          {formatCurrency(account.balance)}
        </p>
      </div>
    </article>
  )
}

function InvestmentLine({
  investment,
  totalInvestments,
}: {
  investment: Investment
  totalInvestments: number
}) {
  const percentage =
    totalInvestments > 0
      ? Math.round((investment.currentValue / totalInvestments) * 100)
      : 0

  const gain = getInvestmentGain(investment)
  const returnPercentage = getInvestmentReturn(investment)
  const isPositive = gain >= 0

  return (
    <article className="rounded-[1.5rem] border border-stone-100 bg-stone-50 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
            <span className="text-xl">{investment.emoji}</span>
          </div>

          <div className="min-w-0">
            <p className="truncate font-black text-slate-950">
              {investment.title}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {getInvestmentTypeLabel(investment.type)} · {percentage} % du
              portefeuille
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="tabular font-black text-slate-950">
            {formatCurrency(investment.currentValue)}
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
    </article>
  )
}

function CompositionBar({
  label,
  value,
  total,
  colorClass,
}: {
  label: string
  value: number
  total: number
  colorClass: string
}) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="font-black text-slate-800">{label}</p>

        <p className="tabular font-black text-slate-500">
          {formatCurrency(value)} · {percentage} %
        </p>
      </div>

      <div className="h-5 overflow-hidden rounded-full bg-stone-100">
        <div
          className={`h-full rounded-full ${colorClass}`}
          style={{ width: `${Math.max(percentage, value > 0 ? 4 : 0)}%` }}
        />
      </div>
    </div>
  )
}

export default function NetWorthPage() {
  const {
    accounts: allAccounts,
    debts,
    investments,
    savingGoals,
    sinkingFunds,
  } = useBudgetData()

  const { selectedHolder } = useHolderFilter()

  // Filtre « par personne » sur les comptes (placements et dettes ne sont pas
  // rattachés à un titulaire : ils restent globaux dans le patrimoine).
  const accounts = filterAccountsByHolder(allAccounts, selectedHolder)

  const liquidAccounts = accounts.filter((account) => {
    return account.type !== 'investment'
  })

  const investmentAccounts = accounts.filter((account) => {
    return account.type === 'investment'
  })

  const totalLiquidAssets = liquidAccounts.reduce((total, account) => {
    return total + account.balance
  }, 0)

  const ignoredInvestmentAccountsTotal = investmentAccounts.reduce(
    (total, account) => {
      return total + account.balance
    },
    0,
  )

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

  const totalAssets = totalLiquidAssets + totalInvestments
  const netWorth = totalAssets - totalDebts

  const reservedInGoals = savingGoals.reduce((total, goal) => {
    return total + goal.currentAmount
  }, 0)

  const reservedInFunds = sinkingFunds.reduce((total, fund) => {
    return total + fund.currentAmount
  }, 0)

  const totalReserved = reservedInGoals + reservedInFunds
  const availableLiquidAfterReserved = totalLiquidAssets - totalReserved

  const debtWeight =
    totalAssets > 0 ? Math.round((totalDebts / totalAssets) * 100) : 0

  const liquidWeight =
    totalAssets > 0 ? Math.round((totalLiquidAssets / totalAssets) * 100) : 0

  const investmentWeight =
    totalAssets > 0 ? Math.round((totalInvestments / totalAssets) * 100) : 0

  const biggestDebt = [...debts].sort((firstDebt, secondDebt) => {
    return secondDebt.remainingAmount - firstDebt.remainingAmount
  })[0]

  const bestInvestment = [...investments].sort((first, second) => {
    return getInvestmentReturn(second) - getInvestmentReturn(first)
  })[0]

  const hasAnyData =
    allAccounts.length > 0 ||
    investments.length > 0 ||
    debts.length > 0 ||
    savingGoals.length > 0 ||
    sinkingFunds.length > 0

  return (
    <div className="space-y-6">
      <section className="animate-rise overflow-hidden rounded-[1.75rem] border border-indigo-200 bg-gradient-to-br from-indigo-100 via-indigo-50 to-[#fffef9] shadow-md">
        <div className="relative p-6 md:p-8">
          <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="absolute bottom-0 right-24 h-32 w-32 rounded-full bg-violet-200/40 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                Patrimoine net
              </p>

              <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-950 md:text-[2.4rem] md:leading-[1.1]">
                Voyez ce que vous possédez vraiment
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Le patrimoine net additionne vos comptes liquides et vos
                investissements détaillés, puis retire les dettes restantes. Les
                comptes de type investissement ne sont pas recomptés pour éviter
                les doublons avec les placements détaillés.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/comptes"
                className="flex w-fit items-center gap-2 rounded-full bg-stone-100 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-stone-200"
              >
                Gérer les comptes
              </Link>

              <Link
                to="/investissements"
                className="flex w-fit items-center gap-2 rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-emerald-900"
              >
                Gérer les investissements
              </Link>
            </div>
          </div>
        </div>
      </section>

      {!hasAnyData && <EmptyNetWorthGuide />}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PageStatCard
          title="Patrimoine net"
          value={formatCurrency(netWorth)}
          description="Actifs moins dettes"
          icon={<WalletCards className="h-5 w-5" />}
          variant={netWorth >= 0 ? 'emerald' : 'rose'}
        />

        <PageStatCard
          title="Comptes liquides"
          value={formatCurrency(totalLiquidAssets)}
          description={`${liquidWeight} % des actifs`}
          icon={<Landmark className="h-5 w-5" />}
          variant="blue"
        />

        <PageStatCard
          title="Investissements"
          value={formatCurrency(totalInvestments)}
          description={`${investmentWeight} % des actifs`}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="violet"
        />

        <PageStatCard
          title="Dettes restantes"
          value={formatCurrency(totalDebts)}
          description={`${debtWeight} % des actifs`}
          icon={<CreditCard className="h-5 w-5" />}
          variant="rose"
        />
      </section>

      {ignoredInvestmentAccountsTotal > 0 && (
        <section className="rounded-[2rem] border border-amber-100 bg-amber-50 p-5 text-amber-900">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-black">
                Comptes investissement non recomptés
              </h2>

              <p className="mt-2 text-sm leading-6 text-amber-800">
                Vous avez <span className="tabular">{formatCurrency(ignoredInvestmentAccountsTotal)}</span> dans
                des comptes de type investissement. Comme la page Investissements
                suit déjà les placements en détail, ces comptes ne sont pas
                ajoutés au patrimoine net pour éviter de compter deux fois la
                même somme.
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow="Vue globale"
            title="Composition du patrimoine"
            icon={<ShieldCheck className="h-5 w-5" />}
          />

          {totalAssets > 0 || totalDebts > 0 ? (
            <div className="mt-6 space-y-5">
              <CompositionBar
                label="Comptes liquides"
                value={totalLiquidAssets}
                total={totalAssets}
                colorClass="bg-blue-500"
              />

              <CompositionBar
                label="Investissements"
                value={totalInvestments}
                total={totalAssets}
                colorClass="bg-violet-500"
              />

              <CompositionBar
                label="Dettes"
                value={totalDebts}
                total={totalAssets}
                colorClass="bg-rose-500"
              />

              <div className="rounded-[1.5rem] bg-emerald-50 p-5">
                <p className="text-sm font-semibold text-emerald-700">
                  Résultat net
                </p>

                <p
                  className={`tabular mt-2 text-3xl font-black ${
                    netWorth >= 0 ? 'text-emerald-950' : 'text-rose-700'
                  }`}
                >
                  {formatCurrency(netWorth)}
                </p>

                <p className="mt-2 text-sm leading-6 text-emerald-800/80">
                  C’est votre patrimoine net actuel avec les données
                  enregistrées.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-stone-200 bg-stone-50 p-8 text-center">
              <p className="text-3xl">🧭</p>

              <h3 className="mt-4 text-xl font-black text-slate-950">
                Rien à analyser pour le moment
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Ajoutez un compte, un investissement ou une dette pour générer
                la composition du patrimoine.
              </p>

              <Link
                to="/comptes"
                className="mt-5 inline-flex rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-900"
              >
                Créer un compte
              </Link>
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow="Lecture rapide"
            title="Ce qu’il faut retenir"
            icon={<BarChart3 className="h-5 w-5" />}
          />

          <div className="mt-6 space-y-3">
            <div className="rounded-[1.5rem] bg-violet-50 p-5">
              <p className="text-sm font-semibold text-violet-700">
                Performance investissements
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
                {investmentReturn} % sur le montant investi.
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-blue-50 p-5">
              <p className="text-sm font-semibold text-blue-700">
                Meilleur placement
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

            <div className="rounded-[1.5rem] bg-amber-50 p-5">
              <p className="text-sm font-semibold text-amber-700">
                Plus grosse dette
              </p>

              <p className="mt-2 text-xl font-black text-amber-950">
                {biggestDebt
                  ? `${biggestDebt.emoji} ${biggestDebt.title}`
                  : 'Aucune'}
              </p>

              <p className="mt-2 text-sm text-amber-800/80">
                {biggestDebt
                  ? `${formatCurrency(
                      biggestDebt.remainingAmount,
                    )} encore à rembourser.`
                  : 'Aucune dette enregistrée pour le moment.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow="Comptes"
            title="Argent liquide disponible"
            icon={<Banknote className="h-5 w-5" />}
            action={
              <Link
                to="/comptes"
                className="hidden rounded-full bg-stone-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-stone-200 md:inline-flex"
              >
                Voir
              </Link>
            }
          />

          <div className="mt-6 space-y-3">
            {liquidAccounts.length > 0 ? (
              liquidAccounts.map((account) => (
                <AccountLine
                  key={account.id}
                  account={account}
                  totalLiquidAssets={totalLiquidAssets}
                />
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-stone-200 bg-stone-50 p-8 text-center">
                <p className="text-3xl">🏦</p>

                <h3 className="mt-4 text-xl font-black text-slate-950">
                  Aucun compte liquide
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Ajoutez un compte courant, épargne ou espèces pour commencer.
                </p>

                <Link
                  to="/comptes"
                  className="mt-5 inline-flex rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-900"
                >
                  Créer un compte
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow="Investissements"
            title="Placements détaillés"
            icon={<TrendingUp className="h-5 w-5" />}
            action={
              <Link
                to="/investissements"
                className="hidden rounded-full bg-stone-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-stone-200 md:inline-flex"
              >
                Voir
              </Link>
            }
          />

          <div className="mt-6 space-y-3">
            {investments.length > 0 ? (
              investments.map((investment) => (
                <InvestmentLine
                  key={investment.id}
                  investment={investment}
                  totalInvestments={totalInvestments}
                />
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-stone-200 bg-stone-50 p-8 text-center">
                <p className="text-3xl">📈</p>

                <h3 className="mt-4 text-xl font-black text-slate-950">
                  Aucun investissement
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Ajoutez un placement pour compléter votre patrimoine.
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
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow="Argent réservé"
            title="Objectifs et fonds"
            icon={<Target className="h-5 w-5" />}
          />

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-[1.5rem] bg-violet-50 p-5">
              <p className="text-sm font-semibold text-violet-700">
                Objectifs
              </p>

              <p className="tabular mt-2 text-2xl font-black text-violet-950">
                {formatCurrency(reservedInGoals)}
              </p>

              <p className="mt-2 text-sm text-violet-800/80">
                Argent mis de côté dans les objectifs d’épargne.
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-emerald-50 p-5">
              <p className="text-sm font-semibold text-emerald-700">
                Fonds d’amortissement
              </p>

              <p className="tabular mt-2 text-2xl font-black text-emerald-950">
                {formatCurrency(reservedInFunds)}
              </p>

              <p className="mt-2 text-sm text-emerald-800/80">
                Argent prévu pour les dépenses futures.
              </p>
            </div>
          </div>

          <p className="mt-5 text-sm leading-6 text-slate-500">
            Après argent réservé, il reste environ{' '}
            <span
              className={`tabular font-black ${
                availableLiquidAfterReserved >= 0
                  ? 'text-slate-950'
                  : 'text-rose-700'
              }`}
            >
              {formatCurrency(availableLiquidAfterReserved)}
            </span>{' '}
            en argent liquide non affecté.
          </p>

          <Link
            to="/objectifs"
            className="mt-5 inline-flex rounded-full bg-stone-100 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-stone-200"
          >
            Gérer les objectifs
          </Link>
        </div>

        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow="Prochaines actions"
            title="Améliorer votre bilan"
            icon={<Coins className="h-5 w-5" />}
          />

          <p className="mt-5 text-sm leading-6 text-slate-600">
            Votre patrimoine devient plus précis quand vous reliez toutes les
            grandes parties du carnet : comptes, investissements, dettes et
            objectifs.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            <Link
              to="/comptes"
              className="rounded-[1.5rem] bg-blue-50 p-4 text-blue-900 transition hover:-translate-y-0.5 hover:shadow-sm"
            >
              <p className="font-black">Comptes</p>
              <p className="mt-1 text-sm text-blue-800/80">
                Ajoutez ou ajustez vos soldes.
              </p>
            </Link>

            <Link
              to="/dettes"
              className="rounded-[1.5rem] bg-rose-50 p-4 text-rose-900 transition hover:-translate-y-0.5 hover:shadow-sm"
            >
              <p className="font-black">Dettes</p>
              <p className="mt-1 text-sm text-rose-800/80">
                Suivez ce qu’il reste à rembourser.
              </p>
            </Link>

            <Link
              to="/investissements"
              className="rounded-[1.5rem] bg-violet-50 p-4 text-violet-900 transition hover:-translate-y-0.5 hover:shadow-sm"
            >
              <p className="font-black">Investissements</p>
              <p className="mt-1 text-sm text-violet-800/80">
                Mesurez vos performances.
              </p>
            </Link>

            <Link
              to="/objectifs"
              className="rounded-[1.5rem] bg-emerald-50 p-4 text-emerald-900 transition hover:-translate-y-0.5 hover:shadow-sm"
            >
              <p className="font-black">Objectifs</p>
              <p className="mt-1 text-sm text-emerald-800/80">
                Donnez un rôle à votre épargne.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
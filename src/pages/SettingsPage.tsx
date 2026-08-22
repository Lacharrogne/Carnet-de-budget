import {
  BadgeCheck,
  Coins,
  CreditCard,
  Download,
  ExternalLink,
  LogOut,
  ShieldCheck,
  UserCircle,
} from 'lucide-react'

import { useAuth } from '../context/useAuth'
import { useBudgetData } from '../context/useBudgetData'
import { useEntitlement } from '../hooks/useEntitlement'
import { SUBSCRIPTION_HUB_URL } from '../config/subscription'
import { CURRENCIES, useCurrency } from '../lib/currencyPreference'
import { exportTransactionsCsv } from '../lib/exportCsv'
import { budgetCategories } from '../data/budgetCategories'

function formatDate(value: string | undefined): string {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const entitlement = useEntitlement(user)
  const { currency, setCurrency } = useCurrency()
  const { transactions, accounts } = useBudgetData()

  const hasTransactions = transactions.length > 0

  function handleExport() {
    exportTransactionsCsv(transactions, accounts, budgetCategories)
  }

  const subscriptionTone =
    entitlement.status === 'premium'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : entitlement.status === 'expired'
        ? 'border-rose-200 bg-rose-50 text-rose-800'
        : 'border-amber-200 bg-amber-50 text-amber-800'

  const subscriptionLabel =
    entitlement.status === 'premium'
      ? 'Abonnement actif'
      : entitlement.status === 'expired'
        ? 'Essai terminé'
        : `Essai gratuit — ${entitlement.daysLeft} jour${entitlement.daysLeft > 1 ? 's' : ''} restant${entitlement.daysLeft > 1 ? 's' : ''}`

  const subscriptionHint =
    entitlement.status === 'premium'
      ? 'Merci de votre confiance. Vous pouvez gérer ou résilier votre abonnement depuis le hub Les Carnets.'
      : entitlement.status === 'expired'
        ? 'Abonnez-vous pour continuer à suivre vos finances sans limite.'
        : 'Profitez de tout pendant l’essai. Abonnez-vous quand vous voulez pour ne rien perdre.'

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
          Réglages
        </p>
        <h1 className="mt-1 font-black text-2xl text-slate-950 sm:text-3xl">
          Votre compte
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Gérez votre abonnement, votre devise et vos données.
        </p>
      </header>

      {/* Compte */}
      <section className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <UserCircle className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-black text-slate-950">Compte</h2>
            <p className="text-sm text-slate-500">Vos informations de connexion.</p>
          </div>
        </div>

        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-stone-50 px-4 py-3">
            <dt className="text-[0.65rem] font-bold uppercase tracking-wide text-slate-400">
              Adresse e-mail
            </dt>
            <dd className="mt-1 truncate text-sm font-black text-slate-950">
              {user?.email ?? '—'}
            </dd>
          </div>

          <div className="rounded-2xl bg-stone-50 px-4 py-3">
            <dt className="text-[0.65rem] font-bold uppercase tracking-wide text-slate-400">
              Membre depuis
            </dt>
            <dd className="mt-1 text-sm font-black text-slate-950">
              {formatDate(user?.created_at)}
            </dd>
          </div>
        </dl>
      </section>

      {/* Abonnement */}
      <section className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <CreditCard className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-black text-slate-950">Abonnement</h2>
            <p className="text-sm text-slate-500">
              Souscription et gestion centralisées sur Les Carnets.
            </p>
          </div>
        </div>

        <div
          className={`mt-5 flex items-center gap-3 rounded-2xl border px-4 py-3 ${subscriptionTone}`}
        >
          {entitlement.status === 'premium' ? (
            <BadgeCheck className="h-5 w-5 shrink-0" />
          ) : (
            <ShieldCheck className="h-5 w-5 shrink-0" />
          )}
          <p className="text-sm font-black">{subscriptionLabel}</p>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-600">{subscriptionHint}</p>

        <a
          href={SUBSCRIPTION_HUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-emerald-700"
        >
          {entitlement.status === 'premium'
            ? 'Gérer mon abonnement'
            : 'S’abonner'}
          <ExternalLink className="h-4 w-4" />
        </a>
      </section>

      {/* Devise */}
      <section className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Coins className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-black text-slate-950">Devise</h2>
            <p className="text-sm text-slate-500">
              Utilisée pour afficher tous vos montants.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {CURRENCIES.map((option) => {
            const isActive = option.code === currency.code
            return (
              <button
                key={option.code}
                type="button"
                onClick={() => setCurrency(option.code)}
                className={[
                  'flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition',
                  isActive
                    ? 'border-emerald-300 bg-emerald-50 ring-1 ring-emerald-200'
                    : 'border-stone-200 bg-white hover:bg-stone-50',
                ].join(' ')}
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-sm font-black text-slate-700">
                    {option.symbol}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-black text-slate-950">
                      {option.label}
                    </span>
                    <span className="block text-xs font-semibold text-slate-400">
                      {option.code}
                    </span>
                  </span>
                </span>

                {isActive && (
                  <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-600" />
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* Données */}
      <section className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Download className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-black text-slate-950">Vos données</h2>
            <p className="text-sm text-slate-500">
              Exportez vos transactions pour Excel ou LibreOffice.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4 rounded-2xl bg-stone-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-600">
            {hasTransactions
              ? `${transactions.length} transaction${transactions.length > 1 ? 's' : ''} à exporter (fichier CSV).`
              : 'Aucune transaction à exporter pour le moment.'}
          </p>

          <button
            type="button"
            onClick={handleExport}
            disabled={!hasTransactions}
            className="inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            <Download className="h-4 w-4" />
            Exporter en CSV
          </button>
        </div>
      </section>

      {/* Déconnexion */}
      <section className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-black text-slate-950">Session</h2>
            <p className="text-sm text-slate-500">
              Déconnectez-vous de cet appareil.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void signOut()}
            className="inline-flex w-fit items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-black text-slate-600 shadow-sm ring-1 ring-stone-200 transition hover:-translate-y-0.5 hover:bg-rose-50 hover:text-rose-700"
          >
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </button>
        </div>
      </section>
    </div>
  )
}

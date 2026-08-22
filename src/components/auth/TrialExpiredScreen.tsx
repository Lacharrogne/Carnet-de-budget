import { Sparkles } from 'lucide-react'

import { useAuth } from '../../context/useAuth'
import { CONTACT_EMAIL, UPGRADE_URL } from '../../config/subscription'

/**
 * Écran affiché quand l'essai est terminé et que le verrouillage est activé
 * (ENFORCE_TRIAL = true). Bienveillant, jamais brutal.
 */
export default function TrialExpiredScreen() {
  const { signOut } = useAuth()

  const hasUpgrade = Boolean(UPGRADE_URL)

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="card-premium animate-rise w-full max-w-lg overflow-hidden p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <Sparkles className="h-7 w-7" />
        </div>

        <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight text-slate-950">
          Votre essai gratuit est terminé
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Nous espérons que votre carnet vous a été utile. Pour continuer à
          suivre vos comptes, vos budgets et votre épargne, il vous suffit de
          passer à l’abonnement — vos données vous attendent, intactes.
        </p>

        <div className="mt-7 flex flex-col items-center gap-3">
          <a
            href={
              hasUpgrade
                ? (UPGRADE_URL as string)
                : `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
                    'Carnet de budget — abonnement',
                  )}`
            }
            {...(hasUpgrade
              ? { target: '_blank', rel: 'noopener noreferrer' }
              : {})}
            className="w-full rounded-full bg-emerald-950 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-emerald-900"
          >
            {hasUpgrade ? 'Passer à l’abonnement' : 'Nous contacter'}
          </a>

          <button
            type="button"
            onClick={() => {
              void signOut()
            }}
            className="text-sm font-bold text-slate-500 transition hover:text-slate-800"
          >
            Se déconnecter
          </button>
        </div>
      </section>
    </main>
  )
}

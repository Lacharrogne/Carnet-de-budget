import { SUBSCRIPTION_HUB_URL } from '../config/subscription'
import type { EntitlementStatus } from '../hooks/useEntitlement'

type TrialBannerProps = {
  status: EntitlementStatus
  daysLeft: number
}

/**
 * Bandeau d'essai (aligné sur les autres carnets) : rappelle les jours d'essai
 * restants et invite à s'abonner. Rien pour les abonnés.
 */
export default function TrialBanner({ status, daysLeft }: TrialBannerProps) {
  if (status === 'premium') {
    return null
  }

  const isExpired = status === 'expired'
  const isEnding = !isExpired && daysLeft <= 3

  const tone = isExpired
    ? 'border-rose-200 bg-rose-50 text-rose-800'
    : isEnding
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : 'border-emerald-200 bg-emerald-50 text-emerald-800'

  const message = isExpired
    ? 'Votre essai gratuit est terminé. Abonnez-vous pour continuer à suivre vos finances.'
    : `Essai gratuit — il vous reste ${daysLeft} jour${daysLeft > 1 ? 's' : ''}.`

  return (
    <div
      className={`mb-6 flex flex-col gap-3 rounded-[1.25rem] border px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between ${tone}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-lg">💡</span>
        <p className="text-sm font-bold leading-6">{message}</p>
      </div>

      <a
        href={SUBSCRIPTION_HUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="w-fit shrink-0 rounded-full bg-emerald-600 px-5 py-2 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-emerald-700"
      >
        S’abonner
      </a>
    </div>
  )
}

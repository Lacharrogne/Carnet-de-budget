import { Sparkles } from 'lucide-react'

import { useEntitlement } from '../../hooks/useEntitlement'
import { CONTACT_EMAIL, UPGRADE_URL } from '../../config/subscription'

function upgradeLink() {
  if (UPGRADE_URL) {
    return { href: UPGRADE_URL, label: 'Passer à l’abonnement', external: true }
  }

  return {
    href: `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      'Carnet de budget — abonnement',
    )}`,
    label: 'Nous contacter',
    external: false,
  }
}

export default function TrialBanner() {
  const { status, daysLeft } = useEntitlement()

  // Les abonnés ne voient aucune bannière.
  if (status === 'premium') {
    return null
  }

  const link = upgradeLink()
  const isExpired = status === 'expired'
  const isEnding = !isExpired && daysLeft <= 3

  const tone = isExpired
    ? 'border-rose-100 bg-rose-50 text-rose-900'
    : isEnding
      ? 'border-amber-100 bg-amber-50 text-amber-900'
      : 'border-emerald-100 bg-emerald-50 text-emerald-900'

  const message = isExpired
    ? 'Votre essai gratuit est terminé. Abonnez-vous pour continuer à profiter de votre carnet.'
    : `Essai gratuit — il vous reste ${daysLeft} jour${
        daysLeft > 1 ? 's' : ''
      }.`

  return (
    <div
      className={`mb-6 flex flex-col gap-3 rounded-[1.5rem] border p-4 sm:flex-row sm:items-center sm:justify-between ${tone}`}
    >
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-white/70 p-2.5">
          <Sparkles className="h-5 w-5" />
        </div>

        <p className="text-sm font-semibold leading-6">{message}</p>
      </div>

      <a
        href={link.href}
        {...(link.external
          ? { target: '_blank', rel: 'noopener noreferrer' }
          : {})}
        className="w-fit shrink-0 rounded-full bg-emerald-950 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-900"
      >
        {link.label}
      </a>
    </div>
  )
}

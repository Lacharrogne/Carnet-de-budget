import { useEffect, useState } from 'react'

import { useAuth } from '../context/useAuth'
import { ENFORCE_TRIAL, TRIAL_DURATION_DAYS } from '../config/subscription'

export type EntitlementStatus = 'premium' | 'trialing' | 'expired'

export type Entitlement = {
  status: EntitlementStatus
  /** Abonné payant (lu depuis les métadonnées du compte). */
  isPremium: boolean
  /** L'utilisateur a-t-il accès à l'app ? (toujours vrai si ENFORCE_TRIAL=false) */
  hasAccess: boolean
  /** Jours d'essai restants (0 si terminé ou si abonné). */
  daysLeft: number
  /** Fin de l'essai, ou null si la date de création est inconnue. */
  trialEndsAt: Date | null
}

const DAY_MS = 24 * 60 * 60 * 1000

function readPremiumFlag(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>

  return record.is_premium === true || record.subscription_status === 'active'
}

/**
 * Statut d'accès de l'utilisateur (abonné / essai en cours / essai terminé).
 *
 * L'essai est calculé à partir de la date de création du compte Supabase
 * (`user.created_at`) + `TRIAL_DURATION_DAYS` — aucune table supplémentaire
 * n'est nécessaire. Le statut « premium » se lit dans les métadonnées du
 * compte (`app_metadata`/`user_metadata`), prêt à être renseigné par un
 * webhook de paiement plus tard.
 */
export function useEntitlement(): Entitlement {
  const { user } = useAuth()

  // L'heure courante est figée à l'initialisation puis rafraîchie
  // périodiquement via un effet (le décompte des jours reste à jour).
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 60 * 1000)

    return () => clearInterval(intervalId)
  }, [])

  const isPremium =
    readPremiumFlag(user?.app_metadata) || readPremiumFlag(user?.user_metadata)

  const createdAt = user?.created_at ? new Date(user.created_at) : null
  const trialEndsAt = createdAt
    ? new Date(createdAt.getTime() + TRIAL_DURATION_DAYS * DAY_MS)
    : null

  if (isPremium) {
    return {
      status: 'premium',
      isPremium: true,
      hasAccess: true,
      daysLeft: 0,
      trialEndsAt,
    }
  }

  const msLeft = trialEndsAt
    ? trialEndsAt.getTime() - now
    : TRIAL_DURATION_DAYS * DAY_MS

  const isTrialing = msLeft > 0
  const daysLeft = Math.max(0, Math.ceil(msLeft / DAY_MS))

  return {
    status: isTrialing ? 'trialing' : 'expired',
    isPremium: false,
    hasAccess: isTrialing || !ENFORCE_TRIAL,
    daysLeft,
    trialEndsAt,
  }
}

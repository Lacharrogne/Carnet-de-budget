import { useEffect, useState } from 'react'

import { useAuth } from '../context/useAuth'
import { ENFORCE_TRIAL, TRIAL_DURATION_DAYS } from '../config/subscription'
import {
  getSubscription,
  isSubscriptionActive,
  type SubscriptionRow,
} from '../services/subscriptionService'

export type EntitlementStatus = 'premium' | 'trialing' | 'expired'

export type Entitlement = {
  status: EntitlementStatus
  /** Abonné payant à ce carnet (ou au global), lu depuis `subscriptions`. */
  isPremium: boolean
  /** L'utilisateur a-t-il accès à l'app ? (toujours vrai si ENFORCE_TRIAL=false) */
  hasAccess: boolean
  /** Jours d'essai restants (0 si terminé ou si abonné). */
  daysLeft: number
  /** Fin de l'essai, ou null si la date de création est inconnue. */
  trialEndsAt: Date | null
  /** Abonnement encore en cours de chargement. */
  loading: boolean
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Statut d'accès de l'utilisateur (abonné / essai en cours / essai terminé).
 *
 * - L'essai est calculé depuis la création du compte (`user.created_at`) +
 *   `TRIAL_DURATION_DAYS`.
 * - Le premium vient de la table `subscriptions` (source de vérité écrite par
 *   le webhook Lemon Squeezy central). Dès qu'on est abonné, l'essai est
 *   considéré terminé.
 */
export function useEntitlement(): Entitlement {
  const { user } = useAuth()
  const userId = user?.id ?? null

  const [now, setNow] = useState(() => Date.now())
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null)
  const [loading, setLoading] = useState(() => Boolean(userId))

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 60 * 1000)
    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    let ignore = false

    const load = async () => {
      if (!userId) {
        if (!ignore) {
          setSubscription(null)
          setLoading(false)
        }
        return
      }

      const row = await getSubscription(userId)

      if (!ignore) {
        setSubscription(row)
        setLoading(false)
      }
    }

    void load()

    return () => {
      ignore = true
    }
  }, [userId])

  const isPremium = isSubscriptionActive(subscription)

  const createdAt = user?.created_at ? new Date(user.created_at) : null
  const trialEndsAt = createdAt
    ? new Date(createdAt.getTime() + TRIAL_DURATION_DAYS * DAY_MS)
    : null

  const msLeft = trialEndsAt
    ? trialEndsAt.getTime() - now
    : TRIAL_DURATION_DAYS * DAY_MS

  // Dès qu'on est abonné, l'essai est considéré terminé (il ne « reste » plus).
  const isTrialing = !isPremium && msLeft > 0
  const daysLeft = isPremium ? 0 : Math.max(0, Math.ceil(msLeft / DAY_MS))

  const status: EntitlementStatus = isPremium
    ? 'premium'
    : isTrialing
      ? 'trialing'
      : 'expired'

  // Pendant le chargement de l'abonnement, on n'enferme pas (évite un flash de
  // verrouillage pour un abonné le temps que la requête revienne).
  const hasAccess =
    !ENFORCE_TRIAL || isPremium || isTrialing || (Boolean(userId) && loading)

  return {
    status,
    isPremium,
    hasAccess,
    daysLeft,
    trialEndsAt,
    loading,
  }
}

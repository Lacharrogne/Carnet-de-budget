import { useEffect, useState } from 'react'

import { useAuth } from '../context/useAuth'
import { ENFORCE_TRIAL, TRIAL_DURATION_DAYS } from '../config/subscription'
import {
  getSubscription,
  isSubscriptionActive,
  type SubscriptionRow,
} from '../services/subscriptionService'
import {
  decideEntitlement,
  readLastKnownPremium,
  rememberPremium,
} from '../lib/entitlementDecision'

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
  /** Vrai si l'abonnement n'a pas pu être lu : accès accordé par précaution. */
  degraded: boolean
}

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
  const [loadFailed, setLoadFailed] = useState(false)
  const [lastKnownPremium, setLastKnownPremium] = useState(false)
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
          setLoadFailed(false)
          setLastKnownPremium(false)
          setLoading(false)
        }
        return
      }

      const result = await getSubscription(userId)

      if (!ignore) {
        if (result.ok) {
          const premium = isSubscriptionActive(result.row)
          rememberPremium(userId, premium)
          setLastKnownPremium(premium)
          setSubscription(result.row)
          setLoadFailed(false)
        } else {
          // Lecture impossible : on ne conclut pas « non abonné ».
          setLastKnownPremium(readLastKnownPremium(userId))
          setSubscription(null)
          setLoadFailed(true)
        }
        setLoading(false)
      }
    }

    void load()

    return () => {
      ignore = true
    }
  }, [userId])

  const decision = decideEntitlement({
    subscriptionActive: isSubscriptionActive(subscription),
    loadFailed,
    lastKnownPremium,
    accountCreatedAt: user?.created_at ? new Date(user.created_at) : null,
    now,
    enforceTrial: ENFORCE_TRIAL,
    trialDurationDays: TRIAL_DURATION_DAYS,
  })

  return { ...decision, loading }
}

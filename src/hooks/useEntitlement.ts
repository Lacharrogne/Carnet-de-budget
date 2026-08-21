import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

import { ENFORCE_TRIAL, TRIAL_DURATION_DAYS } from '../config/subscription'
import {
  getSubscription,
  isSubscriptionActive,
  type SubscriptionRow,
} from '../services/subscriptionService'

const DAY_MS = 24 * 60 * 60 * 1000

export type EntitlementStatus = 'premium' | 'trialing' | 'expired'

export type Entitlement = {
  status: EntitlementStatus
  /** Abonné payant à ce carnet (ou au global). */
  isPremium: boolean
  /** L'utilisateur a-t-il accès à ce carnet ? (toujours vrai si ENFORCE_TRIAL=false) */
  hasAccess: boolean
  /** Jours d'essai restants (0 si terminé ou abonné). */
  daysLeft: number
  trialEndsAt: Date | null
  loading: boolean
  subscription: SubscriptionRow | null
}

/**
 * Statut d'accès à CE carnet : abonné (ce carnet ou global) / essai en cours /
 * essai terminé. L'essai (14 j) est calculé depuis la création du compte et
 * débloque tous les carnets.
 */
export function useEntitlement(user: User | null): Entitlement {
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

  const hasAccess = !ENFORCE_TRIAL || isPremium || isTrialing

  return {
    status,
    isPremium,
    hasAccess,
    daysLeft,
    trialEndsAt,
    loading,
    subscription,
  }
}

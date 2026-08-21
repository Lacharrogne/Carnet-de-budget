import type { ReactNode } from 'react'

import { ENFORCE_TRIAL } from '../config/subscription'
import { useAuth } from '../context/useAuth'
import { useEntitlement } from '../hooks/useEntitlement'
import SubscriptionGate from './SubscriptionGate'
import TrialBanner from './TrialBanner'

/**
 * Verrou d'abonnement du Carnet de budget (inerte tant que `ENFORCE_TRIAL`
 * est `false`). Enveloppe le contenu des pages : si l'essai est terminé et
 * qu'aucun abonnement ne débloque ce carnet, on affiche l'écran de
 * verrouillage à la place du contenu. Sinon on laisse passer le contenu,
 * précédé du bandeau d'essai le cas échéant.
 */
export default function SubscriptionGuard({
  children,
}: {
  children: ReactNode
}) {
  const { user } = useAuth()
  const entitlement = useEntitlement(user)

  const locked =
    ENFORCE_TRIAL && !entitlement.loading && !entitlement.hasAccess

  if (locked) {
    return <SubscriptionGate />
  }

  const showBanner =
    Boolean(user) &&
    !entitlement.loading &&
    (entitlement.status === 'trialing' || entitlement.status === 'expired')

  return (
    <>
      {showBanner && (
        <TrialBanner
          status={entitlement.status}
          daysLeft={entitlement.daysLeft}
        />
      )}
      {children}
    </>
  )
}

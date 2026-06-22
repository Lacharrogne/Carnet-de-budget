import type { ReactNode } from 'react'

import { ENFORCE_TRIAL } from '../../config/subscription'
import { useEntitlement } from '../../hooks/useEntitlement'
import TrialExpiredScreen from './TrialExpiredScreen'

/**
 * Verrou d'essai. Tant que `ENFORCE_TRIAL` est `false`, laisse tout passer
 * (personne n'est bloqué). Une fois activé, remplace l'app par l'écran de fin
 * d'essai pour les comptes dont l'essai est terminé et qui ne sont pas abonnés.
 */
export default function TrialGate({ children }: { children: ReactNode }) {
  const { hasAccess } = useEntitlement()

  if (ENFORCE_TRIAL && !hasAccess) {
    return <TrialExpiredScreen />
  }

  return children
}

import { getCurrency } from '../lib/currencyPreference'

/**
 * Formate un montant dans la devise choisie par l'utilisateur (par défaut EUR).
 * La devise est lue au moment du rendu via la préférence courante, ce qui évite
 * de modifier tous les appels existants.
 */
export function formatCurrency(amount: number) {
  const { code, locale } = getCurrency()

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

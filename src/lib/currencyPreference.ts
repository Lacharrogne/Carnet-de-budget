import { useEffect, useState } from 'react'

/**
 * Préférence de devise (par appareil, via localStorage).
 *
 * `formatCurrency` lit la devise courante ici, donc changer la devise se
 * répercute partout sans toucher aux appels existants. Comme le formatage a
 * lieu pendant le rendu, on recharge la page après un changement pour garantir
 * que tous les montants déjà affichés se mettent à jour (action rare).
 */
export type Currency = {
  code: string
  label: string
  symbol: string
  /** Locale utilisée pour le formatage (séparateurs, position du symbole). */
  locale: string
}

export const CURRENCIES: Currency[] = [
  { code: 'EUR', label: 'Euro', symbol: '€', locale: 'fr-FR' },
  { code: 'USD', label: 'Dollar américain', symbol: '$', locale: 'en-US' },
  { code: 'GBP', label: 'Livre sterling', symbol: '£', locale: 'en-GB' },
  { code: 'CHF', label: 'Franc suisse', symbol: 'CHF', locale: 'fr-CH' },
  { code: 'CAD', label: 'Dollar canadien', symbol: '$', locale: 'fr-CA' },
]

const STORAGE_KEY = 'cb-currency'
const CHANGE_EVENT = 'cb-currency-change'
const DEFAULT: Currency = CURRENCIES[0]

function readStored(): Currency {
  if (typeof window === 'undefined') return DEFAULT

  try {
    const code = window.localStorage.getItem(STORAGE_KEY)
    return CURRENCIES.find((currency) => currency.code === code) ?? DEFAULT
  } catch {
    return DEFAULT
  }
}

// Valeur courante (mise à jour au démarrage puis à chaque changement) : lue
// synchroniquement par formatCurrency.
let current: Currency = readStored()

export function getCurrency(): Currency {
  return current
}

export function setCurrency(code: string) {
  const next = CURRENCIES.find((currency) => currency.code === code)
  if (!next || next.code === current.code) return

  current = next

  try {
    window.localStorage.setItem(STORAGE_KEY, next.code)
  } catch {
    // Stockage indisponible (mode privé) : on garde la valeur en mémoire.
  }

  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}

/** Hook réactif : renvoie la devise courante et un setter. */
export function useCurrency() {
  const [currency, setCurrencyState] = useState<Currency>(current)

  useEffect(() => {
    const handler = () => setCurrencyState(current)
    window.addEventListener(CHANGE_EVENT, handler)
    return () => window.removeEventListener(CHANGE_EVENT, handler)
  }, [])

  return { currency, setCurrency }
}

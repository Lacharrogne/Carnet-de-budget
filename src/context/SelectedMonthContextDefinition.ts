import { createContext } from 'react'

export type SelectedMonthContextValue = {
  /** Mois affiché, au format AAAA-MM. */
  monthKey: string
  /** Libellé lisible (ex. « juin 2026 »). */
  monthLabel: string
  /** Vrai si le mois affiché est le mois en cours. */
  isCurrentMonth: boolean
  /** Faux quand on est déjà sur le mois en cours (on ne va pas dans le futur). */
  canGoNext: boolean
  goToPreviousMonth: () => void
  goToNextMonth: () => void
  goToCurrentMonth: () => void
}

export const SelectedMonthContext =
  createContext<SelectedMonthContextValue | null>(null)

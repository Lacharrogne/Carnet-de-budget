import { createContext } from 'react'

export type TourContextValue = {
  isActive: boolean
  stepIndex: number
  stepCount: number
  start: () => void
  stop: () => void
  next: () => void
  previous: () => void
}

export const TourContext = createContext<TourContextValue | null>(null)

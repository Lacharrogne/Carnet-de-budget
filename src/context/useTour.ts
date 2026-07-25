import { useContext } from 'react'

import { TourContext } from './TourContextDefinition'

export function useTour() {
  const context = useContext(TourContext)

  if (!context) {
    throw new Error('useTour doit être utilisé dans un TourProvider.')
  }

  return context
}

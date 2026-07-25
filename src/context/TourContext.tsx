import { useMemo, useState, type ReactNode } from 'react'

import { tourSteps } from '../data/tourSteps'
import { TourContext, type TourContextValue } from './TourContextDefinition'

const TOUR_DONE_KEY = 'cb-tour-done'

function hasFinishedTour() {
  try {
    return window.localStorage.getItem(TOUR_DONE_KEY) === '1'
  } catch {
    return false
  }
}

function markTourDone() {
  try {
    window.localStorage.setItem(TOUR_DONE_KEY, '1')
  } catch {
    // localStorage indisponible : on ignore.
  }
}

export function TourProvider({ children }: { children: ReactNode }) {
  // Lancement automatique au tout premier passage (puis « fait » mémorisé).
  const [isActive, setIsActive] = useState(() => !hasFinishedTour())
  const [stepIndex, setStepIndex] = useState(0)

  const value = useMemo<TourContextValue>(() => {
    function stop() {
      setIsActive(false)
      markTourDone()
    }

    return {
      isActive,
      stepIndex,
      stepCount: tourSteps.length,
      start: () => {
        setStepIndex(0)
        setIsActive(true)
      },
      stop,
      next: () => {
        setStepIndex((current) => {
          if (current >= tourSteps.length - 1) {
            stop()
            return current
          }

          return current + 1
        })
      },
      previous: () => {
        setStepIndex((current) => Math.max(0, current - 1))
      },
    }
  }, [isActive, stepIndex])

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>
}

import { useMemo, useState, type ReactNode } from 'react'

import {
  getAdjacentMonthKey,
  getCurrentMonthKey,
  getMonthLabel,
} from '../services/budgetStatsService'
import {
  SelectedMonthContext,
  type SelectedMonthContextValue,
} from './SelectedMonthContextDefinition'

export function SelectedMonthProvider({ children }: { children: ReactNode }) {
  const [monthKey, setMonthKey] = useState(() => getCurrentMonthKey())

  const value = useMemo<SelectedMonthContextValue>(() => {
    const currentMonthKey = getCurrentMonthKey()

    return {
      monthKey,
      monthLabel: getMonthLabel(monthKey),
      isCurrentMonth: monthKey === currentMonthKey,
      canGoNext: monthKey < currentMonthKey,
      goToPreviousMonth: () =>
        setMonthKey((current) => getAdjacentMonthKey(current, -1)),
      goToNextMonth: () =>
        setMonthKey((current) =>
          current < currentMonthKey ? getAdjacentMonthKey(current, 1) : current,
        ),
      goToCurrentMonth: () => setMonthKey(currentMonthKey),
    }
  }, [monthKey])

  return (
    <SelectedMonthContext.Provider value={value}>
      {children}
    </SelectedMonthContext.Provider>
  )
}

import { useContext } from 'react'

import { SelectedMonthContext } from './SelectedMonthContextDefinition'

export function useSelectedMonth() {
  const context = useContext(SelectedMonthContext)

  if (!context) {
    throw new Error(
      'useSelectedMonth doit être utilisé dans un SelectedMonthProvider.',
    )
  }

  return context
}

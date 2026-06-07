import { useContext } from 'react'

import { BudgetContext } from './BudgetContextDefinition'

export function useBudgetData() {
  const context = useContext(BudgetContext)

  if (!context) {
    throw new Error('useBudgetData doit être utilisé dans un BudgetProvider.')
  }

  return context
}
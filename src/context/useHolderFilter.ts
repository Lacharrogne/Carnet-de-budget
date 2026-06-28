import { useContext } from 'react'

import { HolderFilterContext } from './HolderFilterContextDefinition'

export function useHolderFilter() {
  return useContext(HolderFilterContext)
}

import { createContext } from 'react'

import { ALL_HOLDERS, type HolderFilterValue } from '../lib/holderFilter'

export type HolderFilterContextValue = {
  selectedHolder: HolderFilterValue
  setSelectedHolder: (holder: HolderFilterValue) => void
}

export const HolderFilterContext = createContext<HolderFilterContextValue>({
  selectedHolder: ALL_HOLDERS,
  setSelectedHolder: () => {},
})

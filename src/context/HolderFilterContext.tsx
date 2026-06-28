import { useMemo, useState, type ReactNode } from 'react'

import { ALL_HOLDERS, type HolderFilterValue } from '../lib/holderFilter'
import {
  HolderFilterContext,
  type HolderFilterContextValue,
} from './HolderFilterContextDefinition'

export function HolderFilterProvider({ children }: { children: ReactNode }) {
  const [selectedHolder, setSelectedHolder] =
    useState<HolderFilterValue>(ALL_HOLDERS)

  const value = useMemo<HolderFilterContextValue>(
    () => ({ selectedHolder, setSelectedHolder }),
    [selectedHolder],
  )

  return (
    <HolderFilterContext.Provider value={value}>
      {children}
    </HolderFilterContext.Provider>
  )
}

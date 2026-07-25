import { Users } from 'lucide-react'

import { useBudgetData } from '../../context/useBudgetData'
import { useHolderFilter } from '../../context/useHolderFilter'
import { ALL_HOLDERS, getDistinctHolders } from '../../lib/holderFilter'

/**
 * Filtre global « par personne » : n'apparaît que si au moins deux titulaires
 * de comptes existent (sinon inutile). Filtre les pages selon le titulaire.
 */
export default function HolderSwitcher() {
  const { accounts } = useBudgetData()
  const { selectedHolder, setSelectedHolder } = useHolderFilter()

  const holders = getDistinctHolders(accounts)

  if (holders.length < 2) {
    return null
  }

  return (
    <label className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 shadow-sm">
      <Users className="h-4 w-4 shrink-0 text-emerald-700" />
      <span className="sr-only">Filtrer par titulaire</span>
      <select
        value={selectedHolder}
        onChange={(event) => setSelectedHolder(event.target.value)}
        aria-label="Filtrer par titulaire"
        className="max-w-[7.5rem] bg-transparent text-sm font-bold text-slate-700 outline-none"
      >
        <option value={ALL_HOLDERS}>Tous</option>
        {holders.map((holder) => (
          <option key={holder} value={holder}>
            {holder}
          </option>
        ))}
      </select>
    </label>
  )
}

import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'

import { useSelectedMonth } from '../../context/useSelectedMonth'

export default function MonthSwitcher() {
  const {
    monthLabel,
    isCurrentMonth,
    canGoNext,
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth,
  } = useSelectedMonth()

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-full border border-stone-200 bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={goToPreviousMonth}
          aria-label="Mois précédent"
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-stone-100 hover:text-slate-950"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <span className="min-w-[8.5rem] text-center text-sm font-bold capitalize tabular text-slate-800">
          {monthLabel}
        </span>

        <button
          type="button"
          onClick={goToNextMonth}
          disabled={!canGoNext}
          aria-label="Mois suivant"
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-stone-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {!isCurrentMonth && (
        <button
          type="button"
          onClick={goToCurrentMonth}
          className="flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-stone-200 hover:text-slate-950"
        >
          <RotateCcw className="h-4 w-4" />
          Mois en cours
        </button>
      )}
    </div>
  )
}

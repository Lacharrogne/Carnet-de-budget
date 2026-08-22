import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'

import { tourSteps } from '../../data/tourSteps'
import { useTour } from '../../context/useTour'

/**
 * Visite guidée : une carte flottante qui accompagne le nouvel utilisateur et
 * l'amène automatiquement sur chaque page en expliquant la fonctionnalité.
 * Pas de ciblage d'éléments (robuste) — on navigue de page en page.
 */
export default function GuidedTour() {
  const { isActive, stepIndex, stepCount, next, previous, stop } = useTour()
  const navigate = useNavigate()

  const step = tourSteps[stepIndex]

  // À chaque étape, on amène l'utilisateur sur la page concernée.
  useEffect(() => {
    if (isActive && step) {
      navigate(step.path)
    }
  }, [isActive, stepIndex, step, navigate])

  if (!isActive || !step) {
    return null
  }

  const Icon = step.icon
  const isFirst = stepIndex === 0
  const isLast = stepIndex === stepCount - 1

  return (
    <div className="pointer-events-none fixed inset-0 z-[80] flex items-end justify-center">
      <div
        role="dialog"
        aria-label="Visite guidée"
        className="animate-rise card-premium pointer-events-auto relative mb-24 w-[calc(100%-1.5rem)] max-w-md p-5 shadow-2xl ring-1 ring-stone-200 sm:mb-6"
      >
        <button
          type="button"
          onClick={stop}
          aria-label="Passer la visite"
          className="absolute right-3 top-3 rounded-full bg-stone-100 p-2 text-slate-500 transition hover:bg-stone-200 hover:text-slate-950"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Icon className="h-6 w-6" />
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
            Visite guidée · {stepIndex + 1}/{stepCount}
          </p>
        </div>

        <h2 className="mt-3 pr-6 font-display text-xl font-semibold tracking-tight text-slate-950">
          {step.title}
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          {step.description}
        </p>

        {/* Progression */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {Array.from({ length: stepCount }).map((_, index) => (
            <span
              key={index}
              className={`h-1.5 flex-1 rounded-full transition ${
                index <= stepIndex ? 'bg-emerald-500' : 'bg-stone-200'
              }`}
            />
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={stop}
            className="text-sm font-bold text-slate-500 transition hover:text-slate-800"
          >
            Passer
          </button>

          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={previous}
                className="flex items-center gap-1.5 rounded-full bg-stone-100 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-stone-200"
              >
                <ArrowLeft className="h-4 w-4" />
                Précédent
              </button>
            )}

            <button
              type="button"
              onClick={next}
              className="flex items-center gap-1.5 rounded-full bg-emerald-950 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-emerald-900"
            >
              {isLast ? 'Terminer' : 'Suivant'}
              {!isLast && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

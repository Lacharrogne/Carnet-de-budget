import { AlertTriangle, X } from 'lucide-react'

/**
 * Bandeau d'erreur réutilisable pour les opérations de données (Supabase).
 * Affiche un message clair et permet de le fermer.
 */
export default function BudgetErrorBanner({
  message,
  onClose,
}: {
  message: string
  onClose: () => void
}) {
  return (
    <section
      role="alert"
      className="rounded-[2rem] border border-rose-100 bg-rose-50 p-5 text-rose-900 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-white p-3 text-rose-700 shadow-sm">
            <AlertTriangle className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm font-semibold text-rose-700">
              Une erreur est survenue
            </p>

            <p className="mt-1 text-sm leading-6 text-rose-800">{message}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-white p-2 text-rose-600 transition hover:bg-rose-100"
          aria-label="Fermer l’erreur"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </section>
  )
}

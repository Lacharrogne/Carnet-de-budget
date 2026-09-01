/**
 * Petit bandeau « saisie récupérée » affiché en haut d'un formulaire d'ajout
 * quand un brouillon a été restauré. Propose de repartir de zéro.
 */
export default function DraftNotice({ onDiscard }: { onDiscard: () => void }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="font-semibold text-emerald-900">
        ✍️ Nous avons récupéré votre saisie en cours.
      </p>

      <button
        type="button"
        onClick={onDiscard}
        className="shrink-0 self-start rounded-full bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200 transition hover:bg-emerald-100 sm:self-auto"
      >
        Repartir de zéro
      </button>
    </div>
  )
}

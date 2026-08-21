import { SUBSCRIPTION_HUB_URL } from '../config/subscription'

/**
 * Écran de verrouillage affiché quand l'essai est terminé et que l'utilisateur
 * n'a pas d'abonnement qui débloque le Carnet de budget. Ne s'affiche que si
 * `ENFORCE_TRIAL` est activé (donc inerte tant que le paiement n'est pas lancé).
 */
export default function SubscriptionGate() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-5">
      <section className="w-full max-w-lg rounded-[2rem] border border-stone-200 bg-white p-8 text-center shadow-xl shadow-emerald-900/5 sm:p-10">
        <p className="text-5xl">💳</p>

        <h1 className="mt-5 text-3xl font-black text-slate-950 sm:text-4xl">
          Votre essai est terminé.
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-600">
          Débloquez le Carnet de budget pour continuer à suivre vos comptes,
          vos budgets et vos objectifs. Vous pouvez vous abonner à ce carnet
          seul, ou à l’offre complète « Les Carnets » qui débloque les trois.
        </p>

        <a
          href={SUBSCRIPTION_HUB_URL}
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-7 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700"
        >
          Voir les abonnements
        </a>

        <p className="mt-4 text-sm text-slate-400">
          Vos données sont conservées : tout revient dès votre abonnement.
        </p>
      </section>
    </div>
  )
}

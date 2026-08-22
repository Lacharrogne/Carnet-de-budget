import { Component, type ErrorInfo, type ReactNode } from 'react'

type ErrorBoundaryProps = {
  children: ReactNode
  /**
   * Quand cette valeur change (ex : le chemin de la page), on réinitialise
   * l'erreur pour laisser une nouvelle page s'afficher après une navigation.
   */
  resetKey?: string
}

type ErrorBoundaryState = {
  hasError: boolean
}

/**
 * Garde-fou global : si un composant plante au rendu, on affiche un écran
 * doux plutôt qu'une page blanche. L'erreur est loggée pour le suivi.
 */
export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidUpdate(previousProps: ErrorBoundaryProps) {
    if (this.state.hasError && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false })
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erreur de rendu interceptée :', error, info)
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <section className="mx-auto mt-10 max-w-lg rounded-[2rem] border border-stone-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-3xl">
          💸
        </div>

        <h1 className="mt-5 font-display text-2xl font-semibold text-slate-950">
          Oups, un petit accroc
        </h1>

        <p className="mt-3 leading-7 text-slate-600">
          Cette page n'a pas pu s'afficher correctement. Pas de panique, vos
          données sont en sécurité. Rechargez la page ou revenez à l'accueil.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 font-bold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-700"
          >
            Recharger la page
          </button>

          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-6 py-3 font-bold text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:bg-stone-50"
          >
            Retour à l'accueil
          </a>
        </div>
      </section>
    )
  }
}

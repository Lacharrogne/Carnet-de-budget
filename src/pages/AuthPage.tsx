import { useState, type FormEvent } from 'react'
import {
  Lock,
  LogIn,
  Mail,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from 'lucide-react'

import { useAuth } from '../context/useAuth'

type AuthMode = 'sign-in' | 'sign-up'

export default function AuthPage() {
  const { signIn, signUp, authError, clearAuthError } = useAuth()

  const [mode, setMode] = useState<AuthMode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formMessage, setFormMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isSignIn = mode === 'sign-in'

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode)
    setFormMessage('')
    clearAuthError()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const cleanEmail = email.trim().toLowerCase()

    setFormMessage('')
    clearAuthError()

    if (!cleanEmail) {
      setFormMessage('Veuillez renseigner votre adresse email.')
      return
    }

    if (password.length < 6) {
      setFormMessage('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }

    try {
      setIsSubmitting(true)

      if (isSignIn) {
        await signIn(cleanEmail, password)
      } else {
        await signUp(cleanEmail, password)
        setFormMessage(
          'Compte créé. Si Supabase demande une confirmation par email, vérifiez votre boîte mail avant de vous connecter.',
        )
      }
    } catch {
      // Le message précis est déjà stocké dans authError.
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-8 text-slate-950">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_0.9fr]">
        <section className="animate-rise card-premium overflow-hidden p-6 md:p-8">
          <div className="relative">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-100/40 blur-3xl" />
            <div className="absolute bottom-0 left-10 h-40 w-40 rounded-full bg-amber-100/40 blur-3xl" />

            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-emerald-950 text-white shadow-md">
                <PiggyBank className="h-8 w-8" />
              </div>

              <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                Carnet de budget
              </p>

              <h1 className="mt-3 max-w-2xl font-display text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl md:leading-[1.05]">
                Votre argent, enfin clair et agréable à suivre.
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                Connectez-vous à votre carnet financier pour sauvegarder vos
                comptes, transactions, budgets, dettes, investissements et
                objectifs dans Supabase. Vos données restent en sécurité et ne
                disparaissent plus au rafraîchissement.
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="rounded-[1.5rem] bg-emerald-50 p-4 text-emerald-900">
                  <ShieldCheck className="h-5 w-5" />
                  <p className="mt-3 text-sm font-black">Données sécurisées</p>
                  <p className="mt-1 text-xs leading-5 opacity-75">
                    Vous seul avez accès à vos données.
                  </p>
                </div>

                <div className="rounded-[1.5rem] bg-amber-50 p-4 text-amber-900">
                  <Sparkles className="h-5 w-5" />
                  <p className="mt-3 text-sm font-black">Interface moderne</p>
                  <p className="mt-1 text-xs leading-5 opacity-75">
                    Plus clair et plus beau qu’un fichier Excel.
                  </p>
                </div>

                <div className="rounded-[1.5rem] bg-blue-50 p-4 text-blue-900">
                  <PiggyBank className="h-5 w-5" />
                  <p className="mt-3 text-sm font-black">Suivi complet</p>
                  <p className="mt-1 text-xs leading-5 opacity-75">
                    Comptes, budgets, objectifs et placements.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="animate-rise card-premium p-5 md:p-6">
          <div className="rounded-[2rem] bg-stone-50 p-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => switchMode('sign-in')}
                className={`rounded-[1.5rem] px-4 py-3 text-sm font-black transition ${
                  isSignIn
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-950'
                }`}
              >
                Connexion
              </button>

              <button
                type="button"
                onClick={() => switchMode('sign-up')}
                className={`rounded-[1.5rem] px-4 py-3 text-sm font-black transition ${
                  !isSignIn
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-950'
                }`}
              >
                Inscription
              </button>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
              {isSignIn ? 'Heureux de vous revoir' : 'Bienvenue'}
            </p>

            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-950">
              {isSignIn ? 'Connectez-vous' : 'Créez votre carnet'}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {isSignIn
                ? 'Saisissez votre email et votre mot de passe pour retrouver vos données en toute sérénité.'
                : 'Créez votre compte pour commencer à suivre votre budget en quelques secondes.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label htmlFor="auth-email" className="block">
              <span className="text-sm font-bold text-slate-700">Email</span>

              <div className="mt-2 flex h-12 items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 transition focus-within:border-emerald-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
                <Mail className="h-5 w-5 text-slate-400" />

                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="vous@email.com"
                  className="w-full bg-transparent text-sm font-medium text-slate-950 outline-none placeholder:text-slate-400"
                />
              </div>
            </label>

            <label htmlFor="auth-password" className="block">
              <span className="text-sm font-bold text-slate-700">
                Mot de passe
              </span>

              <div className="mt-2 flex h-12 items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 transition focus-within:border-emerald-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
                <Lock className="h-5 w-5 text-slate-400" />

                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimum 6 caractères"
                  className="w-full bg-transparent text-sm font-medium text-slate-950 outline-none placeholder:text-slate-400"
                />
              </div>
            </label>

            {(formMessage || authError) && (
              <div
                className={`rounded-2xl px-4 py-3 text-sm font-bold ${
                  authError
                    ? 'border border-rose-100 bg-rose-50 text-rose-700'
                    : 'border border-emerald-100 bg-emerald-50 text-emerald-700'
                }`}
              >
                {authError || formMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-950 px-5 py-3 text-sm font-black text-white shadow-md transition hover:-translate-y-0.5 hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {isSignIn ? (
                <LogIn className="h-4 w-4" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}

              {isSubmitting
                ? 'Chargement...'
                : isSignIn
                  ? 'Se connecter'
                  : 'Créer mon compte'}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
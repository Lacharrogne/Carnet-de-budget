import type { ReactNode } from 'react'

import { useAuth } from '../../context/useAuth'
import AuthPage from '../../pages/AuthPage'

export default function AuthGate({ children }: { children: ReactNode }) {
  const { user, isAuthLoading } = useAuth()

  if (isAuthLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-stone-100 border-t-emerald-700" />

          <h1 className="mt-5 text-xl font-black text-slate-950">
            Chargement du carnet
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Vérification de la session Supabase...
          </p>
        </div>
      </main>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  return children
}
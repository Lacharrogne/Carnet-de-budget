import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'

import { supabase } from '../lib/supabaseClient'
import { AuthContext, type AuthContextValue } from './AuthContextDefinition'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession()

      if (!isMounted) {
        return
      }

      if (error) {
        setAuthError(error.message)
      }

      setSession(data.session)
      setUser(data.session?.user ?? null)
      setIsAuthLoading(false)
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      setIsAuthLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function signUp(email: string, password: string) {
    setAuthError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setAuthError(error.message)
      throw error
    }
  }

  async function signIn(email: string, password: string) {
    setAuthError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setAuthError(error.message)
      throw error
    }
  }

  async function signOut() {
    setAuthError('')

    const { error } = await supabase.auth.signOut()

    if (error) {
      setAuthError(error.message)
      throw error
    }
  }

  function clearAuthError() {
    setAuthError('')
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      isAuthLoading,
      authError,
      signUp,
      signIn,
      signOut,
      clearAuthError,
    }),
    [session, user, isAuthLoading, authError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect } from 'react'

import { createClient } from '@/lib/supabase'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const router = useRouter()
  const { user, setUser, clearAuth, isAuthenticated } = useAuthStore()

  // Sync Supabase session → profile store on mount
  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session && !user) {
        try {
          const profile = await authApi.me()
          setUser(profile)
        } catch {
          // Profile not yet created (race on first login) — ignore
        }
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          clearAuth()
        } else if (session) {
          try {
            const profile = await authApi.me()
            setUser(profile)
          } catch {
            // ignore
          }
        }
      },
    )

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error(error.message)
      const profile = await authApi.me()
      setUser(profile)
      router.push(profile.is_admin ? '/admin' : '/dashboard')
    },
    [setUser, router],
  )

  const register = useCallback(
    async (email: string, password: string, full_name?: string): Promise<void> => {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: full_name ?? '' } },
      })
      if (error) throw new Error(error.message)
      // Don't redirect — user must verify email first
    },
    [],
  )

  const loginWithGoogle = useCallback(async (): Promise<void> => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw new Error(error.message)
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    const supabase = createClient()
    await supabase.auth.signOut()
    clearAuth()
    router.push('/')
  }, [clearAuth, router])

  return { user, isAuthenticated, login, register, loginWithGoogle, logout }
}

'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      setAuth: (user, token) => {
        set({ user, token })
        // Also set a cookie so Next.js middleware can guard routes server-side
        if (typeof document !== 'undefined') {
          document.cookie = `auth-token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
        }
      },

      clearAuth: () => {
        set({ user: null, token: null })
        if (typeof document !== 'undefined') {
          document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        }
      },

      isAuthenticated: () => !!get().token,
    }),
    {
      name: 'vidyai-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    },
  ),
)

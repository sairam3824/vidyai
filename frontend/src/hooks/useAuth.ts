'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

import { authApi, ApiError } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const router = useRouter()
  const { user, token, setAuth, clearAuth, isAuthenticated } = useAuthStore()

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      const res = await authApi.login(email, password)
      setAuth(res.user, res.access_token)
      router.push('/dashboard')
    },
    [setAuth, router],
  )

  const register = useCallback(
    async (email: string, password: string, full_name?: string): Promise<void> => {
      const res = await authApi.register(email, password, full_name)
      setAuth(res.user, res.access_token)
      router.push('/dashboard')
    },
    [setAuth, router],
  )

  const logout = useCallback(() => {
    clearAuth()
    router.push('/')
  }, [clearAuth, router])

  return { user, token, isAuthenticated, login, register, logout }
}

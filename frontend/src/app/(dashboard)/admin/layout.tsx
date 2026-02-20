'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminApi, ApiError } from '@/lib/api'
import { PageLoader } from '@/components/ui/LoadingSpinner'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const guardAdminRoute = async () => {
      try {
        // Let backend admin authorization decide access (source of truth).
        await adminApi.listUsers(0, 1)
        if (!cancelled) {
          setLoading(false)
        }
      } catch (error) {
        if (cancelled) return

        if (error instanceof ApiError && error.status === 403) {
          router.replace('/dashboard')
          return
        }
        router.replace('/login')
      }
    }

    void guardAdminRoute()
    return () => {
      cancelled = true
    }
  }, [router])

  if (loading) return <PageLoader />

  return <>{children}</>
}

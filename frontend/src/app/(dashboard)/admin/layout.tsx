'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { PageLoader } from '@/components/ui/LoadingSpinner'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const guardAdminRoute = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        if (!cancelled) router.replace('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!cancelled) {
        if (!profile?.is_admin) {
          router.replace('/dashboard')
        } else {
          setLoading(false)
        }
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

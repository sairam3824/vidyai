'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TopNav } from '@/components/layout/TopNav'
import { useAuthStore } from '@/store/authStore'
import { PageLoader } from '@/components/ui/LoadingSpinner'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated()) return <PageLoader />

  return (
    <div className="min-h-screen bg-[#06080F]">
      <TopNav />
      {/* Glow effects for premium feel */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[100px]" />
      </div>

      <main className="relative max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}

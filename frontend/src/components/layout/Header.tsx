'use client'

import { Bell } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth()
  const tier = user?.subscription_tier ?? 'free'

  const tierStyle =
    tier === 'premium'
      ? 'bg-amber-400/15 text-amber-300 border-amber-400/25'
      : tier === 'basic'
        ? 'bg-blue-500/15 text-blue-300 border-blue-500/25'
        : 'bg-white/[0.06] text-gray-400 border-white/[0.08]'

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-6 bg-[#0D1017]/90 backdrop-blur-xl border-b border-white/[0.05]">
      <div>
        <h1 className="text-lg font-bold text-white">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize ${tierStyle}`}>
          {tier} plan
        </span>
        <button className="text-gray-600 hover:text-gray-300 transition-colors p-2 rounded-xl hover:bg-white/[0.06]">
          <Bell className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}

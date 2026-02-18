'use client'

import { Bell } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/Badge'

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth()

  const tierVariant =
    user?.subscription_tier === 'premium'
      ? 'purple'
      : user?.subscription_tier === 'basic'
        ? 'info'
        : 'default'

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-6 bg-white/80 backdrop-blur border-b border-gray-200">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <Badge variant={tierVariant} className="capitalize">
          {user?.subscription_tier ?? 'free'} plan
        </Badge>
        <button className="relative text-gray-400 hover:text-gray-700 transition-colors p-1.5 rounded-lg hover:bg-gray-100">
          <Bell className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}

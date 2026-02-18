'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Zap,
  FileText,
  User,
  LogOut,
  GraduationCap,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/generate', label: 'Generate Test', icon: Zap },
  { href: '/tests', label: 'My Tests', icon: FileText },
  { href: '/profile', label: 'Profile', icon: User },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const initials = (user?.full_name ?? user?.email ?? 'U')[0].toUpperCase()

  return (
    <aside className="flex flex-col w-64 shrink-0 bg-[#0A0C14] border-r border-white/[0.05] min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/[0.05]">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500 shadow-lg shadow-blue-500/30 shrink-0">
          <GraduationCap className="h-4 w-4 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-base font-bold text-white tracking-tight">Vidyai</span>
        <span className="ml-auto text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded-md tracking-wide">
          BETA
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150',
                isActive
                  ? 'bg-blue-500/15 text-blue-300 border border-blue-500/25'
                  : 'text-gray-500 hover:bg-white/[0.05] hover:text-gray-200 border border-transparent',
              )}
            >
              <Icon
                className={cn(
                  'h-4.5 w-4.5 shrink-0 transition-colors',
                  isActive ? 'text-blue-400' : 'text-gray-600 group-hover:text-gray-300',
                )}
              />
              <span className="flex-1">{label}</span>
              {isActive && <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />}
            </Link>
          )
        })}
      </nav>

      {/* Upgrade banner */}
      {user?.subscription_tier === 'free' && (
        <div className="mx-3 mb-4 rounded-2xl bg-gradient-to-b from-blue-600/20 to-blue-900/20 border border-blue-500/20 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-blue-400" />
            <p className="text-xs font-bold text-white">Unlock More Tests</p>
          </div>
          <p className="text-xs text-gray-500 mb-3 leading-snug">
            Free plan · 3 tests/week limit
          </p>
          <button className="w-full text-xs font-bold text-white bg-blue-500 hover:bg-blue-400 rounded-xl py-2.5 transition-colors shadow-lg shadow-blue-500/20">
            Upgrade plan →
          </button>
        </div>
      )}

      {/* User section */}
      <div className="border-t border-white/[0.05] px-3 py-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/[0.04] transition-colors">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white font-bold text-sm shrink-0 shadow-md shadow-blue-500/25">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-200 truncate">
              {user?.full_name ?? 'Student'}
            </p>
            <p className="text-xs text-gray-600 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="text-gray-700 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-400/10"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

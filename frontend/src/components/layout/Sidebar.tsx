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
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/Badge'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/generate', label: 'Generate Test', icon: Zap },
  { href: '/tests', label: 'My Tests', icon: FileText },
  { href: '/profile', label: 'Profile', icon: User },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <aside className="flex flex-col w-64 shrink-0 bg-white border-r border-gray-200 min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 h-16 border-b border-gray-200">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 shrink-0">
          <GraduationCap className="h-4.5 w-4.5 text-white" strokeWidth={2} />
        </div>
        <div>
          <span className="text-base font-bold text-gray-900">Vidyai</span>
          <Badge variant="purple" className="ml-2 text-[10px] py-0">BETA</Badge>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0',
                  isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600',
                )}
              />
              <span className="flex-1">{label}</span>
              {isActive && (
                <ChevronRight className="h-4 w-4 text-indigo-400 ml-auto" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Upgrade banner */}
      {user?.subscription_tier === 'free' && (
        <div className="mx-3 mb-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 p-4 ring-1 ring-indigo-100">
          <p className="text-xs font-semibold text-indigo-700">Free Plan</p>
          <p className="text-xs text-gray-600 mt-0.5">3 tests/week</p>
          <button className="mt-2.5 w-full text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg py-1.5 transition-colors">
            Upgrade →
          </button>
        </div>
      )}

      {/* User section */}
      <div className="border-t border-gray-200 px-3 py-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-sm shrink-0">
            {(user?.full_name ?? user?.email ?? 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.full_name ?? 'Student'}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

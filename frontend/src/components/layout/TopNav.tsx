'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Zap,
    FileText,
    LogOut,
    GraduationCap,
    Bell,
    User,
    ChevronDown,
    Menu,
    X,
    BookOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'


const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/generate', label: 'Generate', icon: Zap },
    { href: '/tests', label: 'My Tests', icon: FileText },
    { href: '/textbooks', label: 'Curriculum', icon: BookOpen },
]

export function TopNav() {
    const pathname = usePathname()
    const { user, logout } = useAuth()
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const initials = (user?.full_name ?? user?.email ?? 'U')[0].toUpperCase()

    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#06080F]/80 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
                {/* Logo */}
                <Link href="/dashboard" className="flex items-center gap-2.5 group">
                    <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]">
                        <GraduationCap className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="text-lg font-bold text-white tracking-tight">Vidyai</span>
                    <span className="hidden sm:inline-flex text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full tracking-wide">
                        BETA
                    </span>
                </Link>

                {/* Center Nav - Desktop */}
                <nav className="hidden md:flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.02] p-1">
                    {navItems.map(({ href, label, icon: Icon }) => {
                        const isActive = pathname === href || pathname.startsWith(href + '/')
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    'relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300',
                                    isActive
                                        ? 'text-white bg-white/[0.08] shadow-sm ring-1 ring-white/[0.05]'
                                        : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                                )}
                            >
                                <Icon className={cn("h-4 w-4 transition-colors", isActive ? "text-blue-400" : "text-gray-500 group-hover:text-gray-300")} />
                                {label}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 rounded-full bg-white/[0.04]"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* Right Actions */}
                <div className="flex items-center gap-3 sm:gap-4">
                    {/* Tier Indicator */}
                    {user?.subscription_tier === 'free' && (
                        <Link href="/pricing" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/20 hover:border-blue-500/40 transition-all group">
                            <span className="text-xs font-bold text-blue-300 group-hover:text-blue-200">Upgrade</span>
                            <Zap className="h-3 w-3 text-blue-400 group-hover:text-blue-300" />
                        </Link>
                    )}

                    <div className="hidden sm:block h-8 w-px bg-white/[0.08]" />

                    <button className="relative text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/[0.06]">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border-2 border-[#06080F]" />
                    </button>

                    {/* User Menu - Desktop */}
                    <div className="relative hidden md:block">
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex items-center gap-3 pl-1 pr-2 py-1 rounded-full border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] transition-all"
                        >
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-sm shadow-inner">
                                {initials}
                            </div>
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                        </button>

                        <AnimatePresence>
                            {isProfileOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/[0.08] bg-[#0E1117] shadow-xl shadow-black/50 p-2 z-50 backdrop-blur-2xl"
                                >
                                    <div className="px-3 py-3 border-b border-white/[0.06] mb-1">
                                        <p className="text-sm font-semibold text-white">{user?.full_name}</p>
                                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                    </div>

                                    <Link
                                        href="/profile"
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                                    >
                                        <User className="h-4 w-4" /> Profile
                                    </Link>

                                    <button
                                        onClick={() => logout()}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors"
                                    >
                                        <LogOut className="h-4 w-4" /> Sign out
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-gray-400 hover:text-white"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden border-b border-white/[0.06] bg-[#06080F] px-4 sm:px-6 py-4"
                    >
                        <nav className="flex flex-col gap-2">
                            {navItems.map(({ href, label, icon: Icon }) => {
                                const isActive = pathname === href || pathname.startsWith(href + '/')
                                return (
                                    <Link
                                        key={href}
                                        href={href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={cn(
                                            'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                                            isActive
                                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                : 'text-gray-400 hover:bg-white/[0.04] hover:text-white'
                                        )}
                                    >
                                        <Icon className="h-5 w-5" />
                                        {label}
                                    </Link>
                                )
                            })}
                            <Link
                                href="/profile"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={cn(
                                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                                    pathname === '/profile'
                                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                        : 'text-gray-400 hover:bg-white/[0.04] hover:text-white'
                                )}
                            >
                                <User className="h-5 w-5" />
                                Profile
                            </Link>
                            <div className="my-2 h-px bg-white/[0.06]" />
                            <button
                                onClick={() => logout()}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-white/[0.04]"
                            >
                                <LogOut className="h-5 w-5" /> Sign out
                            </button>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    )
}

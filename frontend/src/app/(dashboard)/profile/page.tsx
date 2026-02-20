'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/hooks/useAuth'
import { usageApi } from '@/lib/api'
import type { UsageStatus } from '@/types'
import { LogOut, Crown, Calendar, Zap, Shield, CheckCircle, XCircle } from 'lucide-react'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const [usage, setUsage] = useState<UsageStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    usageApi.get().then(setUsage).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const initials = (user?.full_name ?? user?.email ?? 'U')[0].toUpperCase()
  const tier = user?.subscription_tier ?? 'free'
  const usedPct = usage ? Math.min(100, (usage.tests_generated_this_week / usage.weekly_limit) * 100) : 0

  return (
    <div className="min-h-full bg-[#0D1017]">
      <Header title="Profile" subtitle="Manage your account and subscription" />

      <div className="p-6 max-w-2xl space-y-5">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <LoadingSpinner size="lg" label="Loading…" />
          </div>
        ) : (
          <>
            {/* Account card */}
            <div className="rounded-2xl bg-[#0E1117] border border-white/[0.06] overflow-hidden">
              {/* Banner */}
              <div className="h-20 bg-gradient-to-r from-blue-600/40 via-blue-700/30 to-transparent relative">
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)',
                  backgroundSize: '24px 24px',
                }} />
              </div>
              <div className="px-6 pb-6 -mt-8">
                <div className="flex items-end justify-between mb-5">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500 text-white font-black text-2xl flex items-center justify-center border-4 border-[#0E1117] shadow-xl shadow-blue-500/25">
                    {initials}
                  </div>
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full border capitalize ${
                    tier === 'premium' ? 'bg-amber-400/15 text-amber-400 border-amber-400/25' :
                    tier === 'basic'   ? 'bg-blue-500/15 text-blue-400 border-blue-500/25' :
                    'bg-white/[0.06] text-gray-400 border-white/[0.08]'
                  }`}>
                    {tier} plan
                  </span>
                </div>
                <p className="text-xl font-black text-white">{user?.full_name ?? 'Student'}</p>
                <p className="text-sm text-gray-500 mt-0.5">{user?.email}</p>

                <div className="grid grid-cols-2 gap-3 mt-5">
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 flex items-center gap-2">
                    {user?.is_active
                      ? <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                      : <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                    }
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <p className="text-sm font-semibold text-gray-200">{user?.is_active ? 'Active' : 'Inactive'}</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Verified</p>
                      <p className="text-sm font-semibold text-gray-200">{user?.is_verified ? 'Yes' : 'Pending'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Usage card */}
            {usage && (
              <div className="rounded-2xl bg-[#0E1117] border border-white/[0.06] p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-blue-400" />
                  </div>
                  <h3 className="font-bold text-white">This Week&apos;s Usage</h3>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-500">Tests generated</span>
                      <span className="font-bold text-white">{usage.tests_generated_this_week} / {usage.weekly_limit}</span>
                    </div>
                    <div className="h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${usedPct >= 100 ? 'bg-red-500' : 'bg-blue-500'}`}
                        style={{ width: `${usedPct}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white shrink-0">{usedPct.toFixed(0)}%</div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Calendar className="h-3.5 w-3.5" />
                  Week starts: {usage.week_start} · {usage.tests_remaining} tests remaining
                </div>

                {!usage.can_generate && (
                  <div className="mt-4 rounded-xl bg-amber-400/10 border border-amber-400/20 px-4 py-3">
                    <p className="text-sm text-amber-400 font-semibold">Weekly limit reached — resets every Monday</p>
                  </div>
                )}
              </div>
            )}

            {/* Subscription card */}
            <div className="rounded-2xl bg-[#0E1117] border border-white/[0.06] p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-amber-400/15 border border-amber-400/20 flex items-center justify-center">
                  <Crown className="h-4 w-4 text-amber-400" />
                </div>
                <h3 className="font-bold text-white">Subscription</h3>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-blue-600/15 to-blue-900/10 border border-blue-500/20 p-5">
                <p className="text-lg font-black text-white capitalize mb-1">{tier} Plan</p>
                <p className="text-sm text-gray-500 mb-5">
                  {tier === 'free'
                    ? 'Upgrade to unlock more tests and features.'
                    : 'Thank you for supporting Vidyai!'}
                </p>
                {tier === 'free' && (
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {[
                      { name: 'Basic', price: '₹99/mo', tests: '20 tests/week' },
                      { name: 'Premium', price: '₹249/mo', tests: 'Unlimited' },
                    ].map((plan) => (
                      <div key={plan.name} className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-3">
                        <p className="text-sm font-bold text-white">{plan.name}</p>
                        <p className="text-xs text-blue-400 font-semibold">{plan.price}</p>
                        <p className="text-xs text-gray-600">{plan.tests}</p>
                      </div>
                    ))}
                  </div>
                )}
                <Button disabled={tier !== 'free'} className="w-full">
                  <Crown className="h-4 w-4" />
                  {tier === 'free' ? 'Upgrade Plan' : 'Manage Subscription'}
                </Button>
              </div>
            </div>

            {/* Sign out */}
            <Button variant="danger" onClick={logout} className="w-full">
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

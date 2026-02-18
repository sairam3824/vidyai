'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import { usageApi } from '@/lib/api'
import type { UsageStatus } from '@/types'
import { User, Crown, Calendar, Zap, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const TIER_COLORS: Record<string, string> = {
  free: 'default',
  basic: 'info',
  premium: 'purple',
  enterprise: 'success',
}

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const token = useAuthStore((s) => s.token)!
  const [usage, setUsage] = useState<UsageStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    usageApi.get(token).then(setUsage).finally(() => setLoading(false))
  }, [token])

  return (
    <div>
      <Header title="Profile" subtitle="Manage your account and subscription" />

      <div className="p-6 max-w-2xl space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" label="Loading profile…" />
          </div>
        ) : (
          <>
            {/* Account info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4.5 w-4.5 text-indigo-600" />
                  Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xl shrink-0">
                    {(user?.full_name ?? user?.email ?? 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-gray-900">
                      {user?.full_name ?? 'Student'}
                    </p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                    <Badge
                      variant={(TIER_COLORS[user?.subscription_tier ?? 'free'] as any) ?? 'default'}
                      className="mt-1 capitalize"
                    >
                      {user?.subscription_tier ?? 'free'} plan
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-0.5">Status</p>
                    <p className="font-medium text-gray-900">
                      {user?.is_active ? '✓ Active' : '✗ Inactive'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-0.5">Verified</p>
                    <p className="font-medium text-gray-900">
                      {user?.is_verified ? '✓ Verified' : 'Pending'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage this week */}
            {usage && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-4.5 w-4.5 text-indigo-600" />
                    This Week&apos;s Usage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Tests generated</span>
                    <span className="font-semibold text-gray-900">
                      {usage.tests_generated_this_week} / {usage.weekly_limit}
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        usage.tests_remaining === 0 ? 'bg-red-400' : 'bg-indigo-500',
                      )}
                      style={{
                        width: `${Math.min(
                          100,
                          (usage.tests_generated_this_week / usage.weekly_limit) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Calendar className="h-3.5 w-3.5" />
                    Week starts: {usage.week_start}
                  </div>
                  {!usage.can_generate && (
                    <p className="text-sm text-amber-700 bg-amber-50 rounded-xl px-4 py-3">
                      You&apos;ve used all {usage.weekly_limit} tests for this week. Limit resets
                      every Monday.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Subscription */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-4.5 w-4.5 text-amber-500" />
                  Subscription
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 ring-1 ring-indigo-100 p-5">
                  <p className="text-sm font-semibold text-indigo-700 capitalize">
                    {user?.subscription_tier ?? 'free'} Plan
                  </p>
                  <p className="text-xs text-gray-600 mt-1 mb-4">
                    {user?.subscription_tier === 'free'
                      ? 'Upgrade to unlock more tests and features.'
                      : 'Thank you for supporting Vidyai!'}
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={user?.subscription_tier !== 'free'}
                  >
                    {user?.subscription_tier === 'free' ? 'Upgrade Plan' : 'Manage Subscription'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Sign out */}
            <div className="flex justify-end">
              <Button variant="danger" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Zap, FileText, Trophy, TrendingUp, ArrowRight, Clock } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuthStore } from '@/store/authStore'
import { usageApi, testsApi } from '@/lib/api'
import type { UsageStatus, GeneratedTest } from '@/types'
import { formatDate, scoreColor } from '@/lib/utils'

export default function DashboardPage() {
  const { user, token } = useAuthStore()
  const [usage, setUsage] = useState<UsageStatus | null>(null)
  const [recentTests, setRecentTests] = useState<GeneratedTest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    Promise.all([usageApi.get(token), testsApi.list(token, 0, 5)])
      .then(([u, t]) => {
        setUsage(u)
        setRecentTests(t)
      })
      .finally(() => setLoading(false))
  }, [token])

  const avgScore =
    recentTests.filter((t) => t.score !== null).length > 0
      ? recentTests
          .filter((t) => t.score !== null)
          .reduce((a, t) => a + t.score!, 0) /
        recentTests.filter((t) => t.score !== null).length
      : null

  return (
    <div>
      <Header
        title={`Good ${getGreeting()}, ${user?.full_name?.split(' ')[0] ?? 'Student'} 👋`}
        subtitle="Here's your learning summary for this week"
      />

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" label="Loading dashboard…" />
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={Zap}
                iconBg="bg-indigo-50"
                iconColor="text-indigo-600"
                label="Tests This Week"
                value={String(usage?.tests_generated_this_week ?? 0)}
                sub={`${usage?.tests_remaining ?? 0} remaining`}
              />
              <StatCard
                icon={FileText}
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
                label="Total Tests"
                value={String(recentTests.length)}
                sub="all time"
              />
              <StatCard
                icon={Trophy}
                iconBg="bg-amber-50"
                iconColor="text-amber-600"
                label="Avg. Score"
                value={avgScore !== null ? `${avgScore.toFixed(0)}%` : '—'}
                sub="last 5 tests"
              />
              <StatCard
                icon={TrendingUp}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
                label="Plan"
                value={usage?.subscription_tier ?? 'free'}
                sub={`${usage?.weekly_limit} tests/week`}
                valueClass="capitalize"
              />
            </div>

            {/* Weekly usage bar */}
            {usage && (
              <Card>
                <CardHeader>
                  <CardTitle>Weekly usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>{usage.tests_generated_this_week} used</span>
                    <span>{usage.weekly_limit} total</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          (usage.tests_generated_this_week / usage.weekly_limit) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                  {!usage.can_generate && (
                    <p className="mt-3 text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                      You've reached your weekly limit. Resets on Monday or{' '}
                      <span className="font-medium">upgrade your plan</span>.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* CTA + recent tests */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Generate CTA */}
              <Card className="lg:col-span-1 bg-gradient-to-br from-indigo-600 to-violet-600 text-white ring-0 shadow-xl">
                <CardContent className="pt-6 flex flex-col h-full">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 mb-4">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Generate a test</h3>
                  <p className="text-sm text-indigo-200 flex-1 mb-6">
                    Pick a chapter and get 10 AI-crafted MCQs in seconds.
                  </p>
                  <Link href="/generate">
                    <Button
                      variant="secondary"
                      className="w-full bg-white text-indigo-700 hover:bg-indigo-50"
                    >
                      Start now <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Recent tests */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Tests</CardTitle>
                    <Link href="/tests">
                      <Button variant="ghost" size="sm">
                        View all <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {recentTests.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">No tests yet.</p>
                      <Link href="/generate">
                        <Button size="sm" className="mt-3">
                          Generate your first test
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentTests.map((t) => (
                        <Link
                          key={t.id}
                          href={`/tests/${t.id}`}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                        >
                          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-indigo-50 shrink-0">
                            <FileText className="h-4.5 w-4.5 text-indigo-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {t.chapter_name ?? 'Chapter'}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3" />
                              {formatDate(t.created_at)}
                            </p>
                          </div>
                          {t.score !== null ? (
                            <span
                              className={`text-sm font-bold ${scoreColor(t.score)}`}
                            >
                              {t.score.toFixed(0)}%
                            </span>
                          ) : (
                            <Badge variant="warning">Pending</Badge>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  sub,
  valueClass = '',
}: {
  icon: React.ElementType
  iconBg: string
  iconColor: string
  label: string
  value: string
  sub: string
  valueClass?: string
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${iconBg} mb-3`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className={`text-2xl font-bold text-gray-900 mt-0.5 ${valueClass}`}>{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  )
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

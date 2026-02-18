'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Zap, FileText, Trophy, TrendingUp, ArrowRight, Clock } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuthStore } from '@/store/authStore'
import { usageApi, testsApi } from '@/lib/api'
import type { UsageStatus, GeneratedTest } from '@/types'
import { formatDate, scoreColor } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

export default function DashboardPage() {
  const { user, token } = useAuthStore()
  const [usage, setUsage] = useState<UsageStatus | null>(null)
  const [recentTests, setRecentTests] = useState<GeneratedTest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    Promise.all([usageApi.get(token), testsApi.list(token, 0, 5)])
      .then(([u, t]) => { setUsage(u); setRecentTests(t) })
      .finally(() => setLoading(false))
  }, [token])

  const avgScore =
    recentTests.filter((t) => t.score !== null).length > 0
      ? recentTests.filter((t) => t.score !== null).reduce((a, t) => a + t.score!, 0) /
        recentTests.filter((t) => t.score !== null).length
      : null

  const usedPct = usage ? Math.min(100, (usage.tests_generated_this_week / usage.weekly_limit) * 100) : 0

  return (
    <div className="min-h-full bg-[#0D1017]">
      <Header
        title={`Good ${getGreeting()}, ${user?.full_name?.split(' ')[0] ?? 'Student'} 👋`}
        subtitle="Here's your learning summary for this week"
      />

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <LoadingSpinner size="lg" label="Loading…" />
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Zap}       accent="blue"    label="Tests This Week" value={String(usage?.tests_generated_this_week ?? 0)} sub={`${usage?.tests_remaining ?? 0} remaining`} />
              <StatCard icon={FileText}  accent="sky"     label="Total Tests"     value={String(recentTests.length)}                    sub="all time" />
              <StatCard icon={Trophy}    accent="amber"   label="Avg. Score"      value={avgScore !== null ? `${avgScore.toFixed(0)}%` : '—'} sub="last 5 tests" />
              <StatCard icon={TrendingUp} accent="emerald" label="Current Plan"   value={usage?.subscription_tier ?? 'free'}            sub={`${usage?.weekly_limit} tests/week`} valueClass="capitalize" />
            </div>

            {/* CTA + Usage row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Generate CTA */}
              <div className="lg:col-span-1 rounded-2xl bg-blue-500/[0.08] border border-blue-500/25 p-6 flex flex-col relative overflow-hidden shadow-[0_0_60px_rgba(59,130,246,0.08)]">
                <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-blue-500/10 blur-2xl" />
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 mb-5 relative">
                  <Zap className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1 relative">Generate a Test</h3>
                <p className="text-sm text-gray-500 flex-1 mb-6 leading-relaxed relative">
                  Pick any chapter and get AI-crafted MCQs in seconds.
                </p>
                <Link
                  href="/generate"
                  className="relative flex items-center justify-center gap-2 w-full rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 text-sm transition-colors shadow-lg shadow-blue-500/20"
                >
                  Start now <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Usage + Recent tests */}
              <div className="lg:col-span-2 rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white">Weekly Usage</h3>
                  {usage && (
                    <span className="text-sm text-gray-500">
                      {usage.tests_generated_this_week} / {usage.weekly_limit}
                    </span>
                  )}
                </div>
                {usage && (
                  <>
                    <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-700"
                        style={{ width: `${usedPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 mb-4">
                      <span>{usedPct.toFixed(0)}% used</span>
                      <span>Resets Monday</span>
                    </div>
                    {!usage.can_generate && (
                      <div className="flex items-center justify-between rounded-xl bg-amber-400/10 border border-amber-400/20 px-4 py-3 mb-4">
                        <p className="text-sm text-amber-300 font-semibold">Weekly limit reached</p>
                        <button className="text-xs font-bold text-white bg-blue-500 hover:bg-blue-400 rounded-lg px-3 py-1.5 transition-colors">
                          Upgrade
                        </button>
                      </div>
                    )}
                  </>
                )}

                <div className="border-t border-white/[0.05] pt-4 mt-1">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-white">Recent Tests</p>
                    <Link href="/tests">
                      <Button variant="ghost" size="sm">
                        View all <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                  {recentTests.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-8 w-8 text-gray-700 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">No tests yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {recentTests.slice(0, 3).map((t) => (
                        <Link
                          key={t.id}
                          href={`/tests/${t.id}`}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-colors group"
                        >
                          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/20 shrink-0">
                            <FileText className="h-4 w-4 text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-200 truncate">
                              {t.chapter_name ?? 'Chapter'}
                            </p>
                            <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3" />
                              {formatDate(t.created_at)}
                            </p>
                          </div>
                          {t.score !== null ? (
                            <span className={`text-sm font-black ${scoreColor(t.score)}`}>
                              {t.score.toFixed(0)}%
                            </span>
                          ) : (
                            <Badge variant="warning">Pending</Badge>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const accentMap: Record<string, { bg: string; icon: string; shadow: string }> = {
  blue:    { bg: 'bg-blue-500/15 border-blue-500/20',    icon: 'text-blue-400',    shadow: 'shadow-blue-500/10' },
  sky:     { bg: 'bg-sky-500/15 border-sky-500/20',      icon: 'text-sky-400',     shadow: 'shadow-sky-500/10' },
  amber:   { bg: 'bg-amber-400/15 border-amber-400/20',  icon: 'text-amber-400',   shadow: 'shadow-amber-400/10' },
  emerald: { bg: 'bg-emerald-500/15 border-emerald-500/20', icon: 'text-emerald-400', shadow: 'shadow-emerald-500/10' },
}

function StatCard({
  icon: Icon,
  accent,
  label,
  value,
  sub,
  valueClass = '',
}: {
  icon: React.ElementType
  accent: string
  label: string
  value: string
  sub: string
  valueClass?: string
}) {
  const a = accentMap[accent] ?? accentMap.blue
  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-200 hover:-translate-y-0.5">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border ${a.bg} mb-4`}>
        <Icon className={`h-5 w-5 ${a.icon}`} />
      </div>
      <p className="text-xs text-gray-500 font-medium mb-0.5">{label}</p>
      <p className={`text-2xl font-black text-white ${valueClass}`}>{value}</p>
      <p className="text-xs text-gray-600 mt-0.5">{sub}</p>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

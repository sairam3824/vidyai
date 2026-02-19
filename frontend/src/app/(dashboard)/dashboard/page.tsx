'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Zap, FileText, Trophy, TrendingUp, ArrowRight, Clock,
  BookOpen, Brain, FlaskConical, Calculator, Leaf, Globe,
  Sparkles, Target, Star,
} from 'lucide-react'

import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuthStore } from '@/store/authStore'
import { usageApi, testsApi } from '@/lib/api'
import type { UsageStatus, GeneratedTest } from '@/types'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

const SUBJECTS = [
  { label: 'Physics', icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/20' },
  { label: 'Chemistry', icon: FlaskConical, color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/20' },
  { label: 'Maths', icon: Calculator, color: 'text-amber-400', bg: 'bg-amber-400/15 border-amber-400/20' },
  { label: 'Biology', icon: Leaf, color: 'text-teal-400', bg: 'bg-teal-500/15 border-teal-500/20' },
  { label: 'History', icon: Globe, color: 'text-rose-400', bg: 'bg-rose-500/15 border-rose-500/20' },
  { label: 'Science', icon: Brain, color: 'text-sky-400', bg: 'bg-sky-500/15 border-sky-500/20' },
]

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

  const avgScore = recentTests.filter(t => t.score !== null).length > 0
    ? recentTests.filter(t => t.score !== null).reduce((a, t) => a + t.score!, 0) /
    recentTests.filter(t => t.score !== null).length
    : null

  const usedPct = usage ? Math.min(100, (usage.tests_generated_this_week / usage.weekly_limit) * 100) : 0
  const firstName = user?.full_name?.split(' ')[0] ?? 'Student'

  return (
    <div className="min-h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Good {getGreeting()}, {firstName} 👋</h1>
        <p className="text-gray-400">Here's your learning overview</p>
      </div>

      <div className="p-6 space-y-5">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <LoadingSpinner size="lg" label="Loading…" />
          </div>
        ) : (
          <>
            {/* ── HERO BANNER ── */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-blue-900 p-7">

              {/* Glow orb */}
              <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-blue-400/20 blur-3xl" />
              <div className="absolute right-40 -bottom-10 w-48 h-48 rounded-full bg-sky-400/15 blur-2xl" />

              <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/20 px-3 py-1 text-xs font-semibold text-blue-100 mb-4">
                    <Sparkles className="h-3 w-3" /> AI-Powered Learning
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight">
                    Ready to ace your next exam?
                  </h2>
                  <p className="text-blue-200 text-sm max-w-md leading-relaxed">
                    Pick a chapter and generate a test in seconds.
                    Each question is crafted from your actual CBSE textbooks.
                  </p>
                </div>

                <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="text-center px-4 py-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm">
                      <p className="text-2xl font-black text-white">{usage?.tests_generated_this_week ?? 0}</p>
                      <p className="text-xs text-blue-200">tests this week</p>
                    </div>
                    <div className="text-center px-4 py-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm">
                      <p className="text-2xl font-black text-white">
                        {avgScore !== null ? `${avgScore.toFixed(0)}%` : '—'}
                      </p>
                      <p className="text-xs text-blue-200">avg score</p>
                    </div>
                  </div>
                  <Link href="/generate" className="group flex items-center gap-2 rounded-2xl bg-white text-blue-700 font-bold px-6 py-3 text-sm hover:bg-blue-50 transition-all shadow-xl shadow-blue-900/40 hover:-translate-y-0.5">
                    <Zap className="h-4 w-4" />
                    Generate a Test
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* ── STAT CARDS ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={Zap} accent="blue"
                label="Tests This Week"
                value={String(usage?.tests_generated_this_week ?? 0)}
                sub={`${usage?.tests_remaining ?? 0} of ${usage?.weekly_limit ?? 3} left`}
                progress={usedPct}
              />
              <StatCard
                icon={FileText} accent="sky"
                label="Total Tests"
                value={String(recentTests.length)}
                sub="all time"
              />
              <StatCard
                icon={Trophy} accent="amber"
                label="Avg. Score"
                value={avgScore !== null ? `${avgScore.toFixed(0)}%` : '—'}
                sub="last 5 tests"
              />
              <StatCard
                icon={TrendingUp} accent="emerald"
                label="Current Plan"
                value={usage?.subscription_tier ?? 'free'}
                sub={`${usage?.weekly_limit ?? 3} tests/week`}
                valueClass="capitalize"
              />
            </div>

            {/* ── QUICK START SUBJECTS ── */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Quick Start — Pick a Subject</p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {SUBJECTS.map(({ label, icon: Icon, color, bg }) => (
                  <Link
                    key={label}
                    href="/generate"
                    className={`group flex flex-col items-center gap-2 rounded-2xl border ${bg} p-4 hover:scale-[1.04] transition-all duration-200`}
                  >
                    <Icon className={`h-6 w-6 ${color}`} />
                    <span className="text-xs font-semibold text-gray-400 group-hover:text-gray-200">{label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* ── ACTIVITY ROW ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Weekly usage */}
              <div className="rounded-2xl bg-[#0E1117] border border-white/[0.06] p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-bold text-white text-sm">Weekly Usage</p>
                  <span className="text-xs text-gray-500">Resets Monday</span>
                </div>

                {/* Circular progress */}
                <div className="flex items-center gap-5 mb-5">
                  <div className="relative w-20 h-20 shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
                      <circle
                        cx="40" cy="40" r="34" fill="none"
                        stroke="url(#usageGrad)" strokeWidth="7"
                        strokeLinecap="round"
                        strokeDasharray={`${(usedPct / 100) * 2 * Math.PI * 34} ${2 * Math.PI * 34}`}
                      />
                      <defs>
                        <linearGradient id="usageGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#38BDF8" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-lg font-black text-white">{usedPct.toFixed(0)}%</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-3xl font-black text-white">
                      {usage?.tests_generated_this_week ?? 0}
                      <span className="text-base font-semibold text-gray-600">/{usage?.weekly_limit ?? 3}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">tests generated</p>
                    {usage && !usage.can_generate && (
                      <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full px-2.5 py-1">
                        Limit reached
                      </span>
                    )}
                  </div>
                </div>

                {usage && usage.subscription_tier === 'free' && (
                  <button className="w-full text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 rounded-xl py-2.5 transition-colors">
                    Upgrade for unlimited →
                  </button>
                )}
              </div>

              {/* Recent tests */}
              <div className="lg:col-span-2 rounded-2xl bg-[#0E1117] border border-white/[0.06] p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-bold text-white text-sm">Recent Tests</p>
                  <Link href="/tests">
                    <Button variant="ghost" size="sm" className="text-xs">
                      View all <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>

                {recentTests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
                      <Target className="h-7 w-7 text-blue-400" />
                    </div>
                    <p className="text-sm font-semibold text-gray-300 mb-1">No tests yet</p>
                    <p className="text-xs text-gray-600 mb-4">Generate your first test to start tracking progress</p>
                    <Link href="/generate">
                      <Button size="sm">
                        <Zap className="h-3.5 w-3.5" /> Generate now
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentTests.map((t) => {
                      const score = t.score
                      const scoreColor = score === null ? '' : score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'
                      const scoreBg = score === null ? '' : score >= 80 ? 'bg-emerald-500/10 border-emerald-500/20' : score >= 50 ? 'bg-amber-400/10 border-amber-400/20' : 'bg-red-500/10 border-red-500/20'
                      return (
                        <Link
                          key={t.id}
                          href={`/tests/${t.id}`}
                          className="group flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.04] transition-colors"
                        >
                          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 shrink-0">
                            <BookOpen className="h-4.5 w-4.5 text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-200 truncate">{t.chapter_name ?? 'Chapter'}</p>
                            <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3" /> {formatDate(t.created_at)}
                            </p>
                          </div>
                          {score !== null ? (
                            <span className={`text-sm font-black px-2.5 py-1 rounded-lg border ${scoreColor} ${scoreBg}`}>
                              {score.toFixed(0)}%
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-2.5 py-1">
                              Pending
                            </span>
                          )}
                          <ArrowRight className="h-4 w-4 text-gray-700 group-hover:text-gray-400 transition-colors shrink-0" />
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── MOTIVATIONAL BOTTOM STRIP ── */}
            <div className="rounded-2xl bg-[#0E1117] border border-white/[0.06] p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/20 flex items-center justify-center shrink-0">
                  <Star className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Tip of the day</p>
                  <p className="text-xs text-gray-500">
                    Practicing 1 chapter test daily improves retention by 40% — start with your weakest subject.
                  </p>
                </div>
              </div>
              <Link href="/generate">
                <Button size="sm" variant="outline">
                  Take a test now →
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const accentMap: Record<string, { bg: string; icon: string }> = {
  blue: { bg: 'bg-blue-500/15 border border-blue-500/20', icon: 'text-blue-400' },
  sky: { bg: 'bg-sky-500/15 border border-sky-500/20', icon: 'text-sky-400' },
  amber: { bg: 'bg-amber-400/15 border border-amber-400/20', icon: 'text-amber-400' },
  emerald: { bg: 'bg-emerald-500/15 border border-emerald-500/20', icon: 'text-emerald-400' },
}

function StatCard({ icon: Icon, accent, label, value, sub, valueClass = '', progress }: {
  icon: React.ElementType; accent: string; label: string; value: string; sub: string; valueClass?: string; progress?: number
}) {
  const a = accentMap[accent] ?? accentMap.blue
  return (
    <div className="rounded-2xl bg-[#0E1117] border border-white/[0.06] p-5 hover:border-white/[0.12] hover:-translate-y-0.5 transition-all duration-200">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${a.bg} mb-3`}>
        <Icon className={`h-5 w-5 ${a.icon}`} />
      </div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className={`text-2xl font-black text-white mt-0.5 ${valueClass}`}>{value}</p>
      <p className="text-xs text-gray-600 mt-0.5">{sub}</p>
      {progress !== undefined && (
        <div className="mt-3 h-1 bg-white/[0.06] rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-blue-500 transition-all duration-700" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { testsApi } from '@/lib/api'
import type { GeneratedTest } from '@/types'
import { formatDateTime } from '@/lib/utils'
import { FileText, ArrowRight, Zap, Clock, BookOpen, Target } from 'lucide-react'

export default function TestsPage() {
  const [tests, setTests] = useState<GeneratedTest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    testsApi.list(0, 50).then(setTests).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const attempted = tests.filter(t => t.score !== null).length
  const avgScore = attempted > 0
    ? tests.filter(t => t.score !== null).reduce((a, t) => a + t.score!, 0) / attempted
    : null

  return (
    <div className="min-h-full bg-[#0D1017]">
      <Header title="My Tests" subtitle="All your generated tests, newest first" />

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <LoadingSpinner size="lg" label="Loading tests…" />
          </div>
        ) : tests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-5">
              <Target className="h-10 w-10 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No tests yet</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm">
              Generate your first AI-powered test and start practising for your CBSE exams.
            </p>
            <Link href="/generate">
              <Button>
                <Zap className="h-4 w-4" /> Generate your first test
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Total Tests', value: String(tests.length) },
                { label: 'Attempted', value: String(attempted) },
                { label: 'Avg Score', value: avgScore !== null ? `${avgScore.toFixed(0)}%` : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-2xl bg-[#0E1117] border border-white/[0.06] p-4 text-center">
                  <p className="text-2xl font-black text-white">{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tests.map((test) => <TestCard key={test.id} test={test} />)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function TestCard({ test }: { test: GeneratedTest }) {
  const questionCount = test.questions_json?.questions?.length ?? 0
  const score = test.score
  const scoreColor = score === null ? '' : score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'
  const scoreBorder = score === null ? 'border-amber-400/20 text-amber-400' : score >= 80 ? 'border-emerald-500/20 bg-emerald-500/10' : score >= 50 ? 'border-amber-400/20 bg-amber-400/10' : 'border-red-500/20 bg-red-500/10'

  return (
    <Link href={`/tests/${test.id}`}>
      <div className="group rounded-2xl bg-[#0E1117] border border-white/[0.06] p-5 hover:border-white/[0.14] hover:bg-white/[0.02] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer h-full flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5 text-blue-400" />
          </div>
          {score !== null ? (
            <span className={`text-sm font-black px-2.5 py-1 rounded-lg border ${scoreBorder} ${scoreColor}`}>
              {score.toFixed(0)}%
            </span>
          ) : (
            <span className="text-xs font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-2.5 py-1">
              Not attempted
            </span>
          )}
        </div>

        <p className="text-sm font-bold text-gray-200 leading-snug mb-1 group-hover:text-white transition-colors flex-1">
          {test.chapter_name ?? 'Unknown Chapter'}
        </p>
        <p className="text-xs text-gray-600 mb-3">{test.subject_name ?? 'Subject'}</p>

        <div className="flex items-center justify-between text-xs text-gray-600 mt-auto pt-3 border-t border-white/[0.04]">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" /> {questionCount}Q
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {formatDateTime(test.created_at)}
          </span>
        </div>

        <div className="flex items-center gap-1 mt-3 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold">
          {score !== null ? 'Review test' : 'Attempt now'}
          <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </Link>
  )
}

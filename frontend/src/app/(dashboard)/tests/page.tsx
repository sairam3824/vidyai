'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuthStore } from '@/store/authStore'
import { testsApi } from '@/lib/api'
import type { GeneratedTest } from '@/types'
import { formatDateTime, scoreBg } from '@/lib/utils'
import { FileText, ArrowRight, Zap, Clock, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function TestsPage() {
  const token = useAuthStore((s) => s.token)!
  const [tests, setTests] = useState<GeneratedTest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    testsApi.list(token, 0, 50).then(setTests).finally(() => setLoading(false))
  }, [token])

  return (
    <div>
      <Header title="My Tests" subtitle="All your generated tests, newest first" />

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" label="Loading tests…" />
          </div>
        ) : tests.length === 0 ? (
          <div className="text-center py-24">
            <FileText className="h-14 w-14 text-gray-200 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-gray-900">No tests yet</h3>
            <p className="text-sm text-gray-500 mt-1 mb-6">
              Generate your first AI-powered test and start practising.
            </p>
            <Link href="/generate">
              <Button>
                <Zap className="h-4 w-4" />
                Generate a test
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tests.map((test) => (
              <TestCard key={test.id} test={test} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TestCard({ test }: { test: GeneratedTest }) {
  const questionCount = test.questions_json?.questions?.length ?? 0

  return (
    <Link href={`/tests/${test.id}`}>
      <Card className="hover:shadow-md transition-all duration-150 cursor-pointer group h-full">
        <CardContent className="pt-5 pb-5 flex flex-col h-full">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-50 shrink-0">
              <FileText className="h-4.5 w-4.5 text-indigo-500" />
            </div>
            {test.score !== null ? (
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset',
                  scoreBg(test.score),
                )}
              >
                {test.score.toFixed(0)}%
              </span>
            ) : (
              <Badge variant="warning">Not attempted</Badge>
            )}
          </div>

          {/* Chapter info */}
          <p className="text-sm font-semibold text-gray-900 leading-snug mb-0.5 group-hover:text-indigo-700 transition-colors">
            {test.chapter_name ?? 'Unknown Chapter'}
          </p>
          <p className="text-xs text-gray-500 mb-3">
            {test.subject_name ?? 'Subject'}
          </p>

          <div className="flex items-center gap-3 text-xs text-gray-400 mt-auto">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {questionCount}Q
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDateTime(test.created_at)}
            </span>
          </div>

          <div className="flex items-center justify-end mt-3 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium">
            {test.score !== null ? 'Review' : 'Attempt'}{' '}
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

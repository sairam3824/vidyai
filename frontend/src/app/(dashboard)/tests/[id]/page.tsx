'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { TestDisplay } from '@/components/test/TestDisplay'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { testsApi } from '@/lib/api'
import type { GeneratedTest } from '@/types'
import { ArrowLeft } from 'lucide-react'

export default function TestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [test, setTest] = useState<GeneratedTest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    testsApi
      .get(Number(id))
      .then(setTest)
      .catch(() => setError('Test not found or access denied.'))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <div>
      <Header
        title={test?.chapter_name ?? 'Test'}
        subtitle={test?.subject_name ?? ''}
      />

      <div className="p-4 sm:p-6 max-w-3xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-6 -ml-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {loading && (
          <div className="flex items-center justify-center py-24">
            <LoadingSpinner size="lg" label="Loading test…" />
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <p className="text-red-600 font-medium">{error}</p>
            <Button className="mt-4" onClick={() => router.push('/tests')}>
              Go back to tests
            </Button>
          </div>
        )}

        {test && !loading && <TestDisplay test={test} />}
      </div>
    </div>
  )
}

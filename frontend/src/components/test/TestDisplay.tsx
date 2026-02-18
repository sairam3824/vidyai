'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { QuestionCard } from './QuestionCard'
import { Button } from '@/components/ui/Button'
import { testsApi, ApiError } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { GeneratedTest, SubmitTestResponse } from '@/types'
import { cn, scoreBg } from '@/lib/utils'
import { Trophy, RotateCcw, ChevronRight } from 'lucide-react'

interface TestDisplayProps {
  test: GeneratedTest
  onReset?: () => void
}

export function TestDisplay({ test, onReset }: TestDisplayProps) {
  const router = useRouter()
  const token = useAuthStore((s) => s.token)!
  const questions = test.questions_json.questions ?? []

  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<SubmitTestResponse | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const answeredCount = Object.keys(answers).length
  const canSubmit = answeredCount === questions.length

  const handleAnswer = useCallback((questionId: number, key: string) => {
    setAnswers((prev) => ({ ...prev, [String(questionId)]: key }))
  }, [])

  async function handleSubmit() {
    setSubmitting(true)
    setError('')
    try {
      const res = await testsApi.submit(test.id, answers, token)
      setResult(res)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to submit test')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Results screen ────────────────────────────────────────────────────────
  if (result) {
    const pct = result.score
    const badgeClass = scoreBg(pct)

    return (
      <div className="space-y-8">
        {/* Score card */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-950/5 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50">
              <Trophy className="h-8 w-8 text-indigo-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Test Complete!</h2>
          <p className="text-gray-500 mt-1">
            {test.chapter_name} · {test.subject_name}
          </p>
          <div className={cn('inline-flex items-center rounded-full px-6 py-2 text-3xl font-bold mt-6 ring-2', badgeClass)}>
            {pct.toFixed(0)}%
          </div>
          <p className="mt-3 text-sm text-gray-600">
            {result.correct_answers} / {result.total_questions} correct
          </p>

          <div className="flex justify-center gap-3 mt-6">
            {onReset && (
              <Button variant="secondary" onClick={onReset}>
                <RotateCcw className="h-4 w-4" />
                New Test
              </Button>
            )}
            <Button onClick={() => router.push('/tests')}>
              View All Tests
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Review questions */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Review Answers</h3>
          <div className="space-y-4">
            {questions.map((q, i) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={i}
                showResult
                userAnswer={answers[String(q.id)]}
                onAnswer={() => {}}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Test taking screen ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {test.chapter_name} · {test.subject_name}
        </span>
        <span>
          {answeredCount}/{questions.length} answered
        </span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
          style={{ width: `${(answeredCount / questions.length) * 100}%` }}
        />
      </div>

      {/* Questions */}
      <div className="space-y-5">
        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={i}
            selectedAnswer={answers[String(q.id)]}
            onAnswer={handleAnswer}
            disabled={submitting}
          />
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
      )}

      <div className="flex justify-end pt-2">
        <Button
          size="lg"
          onClick={handleSubmit}
          loading={submitting}
          disabled={!canSubmit}
        >
          Submit Test
        </Button>
      </div>
      {!canSubmit && (
        <p className="text-xs text-gray-400 text-right">
          Answer all {questions.length} questions to submit
        </p>
      )}
    </div>
  )
}

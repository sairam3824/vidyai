'use client'

import { useState, useCallback } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { ChapterSelector } from '@/components/test/ChapterSelector'
import { TestDisplay } from '@/components/test/TestDisplay'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuthStore } from '@/store/authStore'
import { testsApi, ApiError } from '@/lib/api'
import type { Chapter, GeneratedTest } from '@/types'
import { Zap, BookOpen, AlertCircle } from 'lucide-react'

export default function GeneratePage() {
  const token = useAuthStore((s) => s.token)!

  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null)
  const [numQuestions, setNumQuestions] = useState('10')
  const [generating, setGenerating] = useState(false)
  const [generatedTest, setGeneratedTest] = useState<GeneratedTest | null>(null)
  const [error, setError] = useState('')

  const handleChapterSelect = useCallback((chapter: Chapter | null) => {
    setSelectedChapter(chapter)
    setError('')
  }, [])

  async function handleGenerate() {
    if (!selectedChapter) return
    setGenerating(true)
    setError('')
    try {
      const test = await testsApi.generate(selectedChapter.id, Number(numQuestions), token)
      setGeneratedTest(test)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Failed to generate test. Please try again.',
      )
    } finally {
      setGenerating(false)
    }
  }

  function handleReset() {
    setGeneratedTest(null)
    setSelectedChapter(null)
    setError('')
  }

  return (
    <div>
      <Header
        title="Generate Test"
        subtitle="Select a chapter and let AI craft your personalised MCQ test"
      />

      <div className="p-6 max-w-3xl">
        {generatedTest ? (
          <TestDisplay test={generatedTest} onReset={handleReset} />
        ) : (
          <div className="space-y-6">
            {/* Generator card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-indigo-600" />
                  Choose your chapter
                </CardTitle>
                <CardDescription>
                  Select your board, class, subject and chapter to generate a custom test.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ChapterSelector
                  onChapterSelect={handleChapterSelect}
                  disabled={generating}
                />

                {selectedChapter && (
                  <div className="rounded-xl bg-indigo-50 p-4 ring-1 ring-indigo-100 animate-in slide-in-from-bottom-4">
                    <p className="text-sm font-medium text-indigo-700">
                      Selected: {selectedChapter.chapter_name}
                    </p>
                    {selectedChapter.description && (
                      <p className="text-xs text-indigo-500 mt-0.5">
                        {selectedChapter.description}
                      </p>
                    )}
                  </div>
                )}

                <Select
                  label="Number of questions"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(e.target.value)}
                  disabled={generating}
                >
                  {[5, 10, 15, 20].map((n) => (
                    <option key={n} value={n}>
                      {n} questions
                    </option>
                  ))}
                </Select>

                {error && (
                  <div className="flex items-start gap-2.5 rounded-xl bg-red-50 p-4 ring-1 ring-red-200">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <Button
                  size="lg"
                  onClick={handleGenerate}
                  loading={generating}
                  disabled={!selectedChapter}
                  className="w-full"
                >
                  <Zap className="h-4 w-4" />
                  {generating ? 'Generating your test…' : 'Generate Test'}
                </Button>

                {!selectedChapter && (
                  <p className="text-xs text-gray-400 text-center">
                    Select all fields above to continue
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Generating overlay */}
            {generating && (
              <Card className="border-2 border-indigo-100">
                <CardContent className="py-12 flex flex-col items-center gap-4">
                  <LoadingSpinner size="lg" label="" />
                  <div className="text-center">
                    <p className="text-base font-semibold text-gray-900">
                      Generating your test…
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Reading textbook content, finding key concepts, crafting questions.
                    </p>
                    <p className="text-xs text-gray-400 mt-3">This usually takes 10–20 seconds</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

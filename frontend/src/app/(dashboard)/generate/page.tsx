'use client'

import { useState, useCallback } from 'react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { ChapterSelector } from '@/components/test/ChapterSelector'
import { TestDisplay } from '@/components/test/TestDisplay'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { testsApi, ApiError } from '@/lib/api'
import type { Chapter, GeneratedTest } from '@/types'
import { Zap, BookOpen, AlertCircle, Sparkles, Brain, CheckCircle, Clock } from 'lucide-react'

const QUESTION_COUNTS = [5, 10, 15, 20]

export default function GeneratePage() {
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null)
  const [numQuestions, setNumQuestions] = useState(10)
  const [generating, setGenerating] = useState(false)
  const [generatedTest, setGeneratedTest] = useState<GeneratedTest | null>(null)
  const [error, setError] = useState('')

  const handleChapterSelect = useCallback((chapter: Chapter | null) => {
    setSelectedChapter(chapter)
    setError('')
  }, [])

  const chapterReady = selectedChapter !== null && selectedChapter.chunk_count > 0

  async function handleGenerate() {
    if (!selectedChapter || !chapterReady) return
    setGenerating(true)
    setError('')
    try {
      const test = await testsApi.generate(selectedChapter.id, numQuestions)
      setGeneratedTest(test)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to generate test. Please try again.')
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
    <div className="min-h-full bg-[#0D1017]">
      <Header title="Generate Test" subtitle="AI-crafted MCQs from your CBSE textbook" />

      <div className="p-6 max-w-3xl space-y-5">
        {generatedTest ? (
          <TestDisplay test={generatedTest} onReset={handleReset} />
        ) : (
          <>
            {/* Hero */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#0f1724] to-[#0c1020] border border-blue-500/20 p-6">
              <div className="absolute right-0 top-0 w-48 h-48 rounded-full bg-blue-500/8 blur-3xl" />
              <div className="relative flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                  <Brain className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-lg mb-1">Create your test</h2>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Select your board, class, subject and chapter.
                    AI reads your actual textbook and crafts questions in seconds.
                    Chapters marked <span className="text-emerald-400">✓</span> are ready to test.
                  </p>
                </div>
              </div>
            </div>

            {/* Chapter selector card */}
            <div className="rounded-2xl bg-[#0E1117] border border-white/[0.06] p-6 space-y-6">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-400" />
                <h3 className="font-bold text-white">Choose your chapter</h3>
              </div>

              <ChapterSelector onChapterSelect={handleChapterSelect} disabled={generating} />

              {/* Chapter selected — show status */}
              {selectedChapter && chapterReady && (
                <div className="flex items-start gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 animate-in slide-in-from-bottom-4">
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-300">{selectedChapter.chapter_name}</p>
                    {selectedChapter.description && (
                      <p className="text-xs text-emerald-400/70 mt-0.5">{selectedChapter.description}</p>
                    )}
                    <p className="text-xs text-emerald-500/60 mt-1">
                      {selectedChapter.chunk_count} text chunks indexed
                    </p>
                  </div>
                </div>
              )}

              {selectedChapter && !chapterReady && (
                <div className="flex items-start gap-3 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 animate-in slide-in-from-bottom-4">
                  <Clock className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-300">Content not ready yet</p>
                    <p className="text-xs text-amber-400/70 mt-0.5">
                      This chapter hasn't been indexed. Please select a chapter marked ✓.
                    </p>
                  </div>
                </div>
              )}

              {/* Question count */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Number of questions
                </p>
                <div className="flex gap-2">
                  {QUESTION_COUNTS.map((n) => (
                    <button
                      key={n}
                      onClick={() => setNumQuestions(n)}
                      disabled={generating}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                        numQuestions === n
                          ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                          : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:bg-white/[0.07] hover:text-gray-200'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <Button
                size="lg"
                onClick={handleGenerate}
                loading={generating}
                disabled={!chapterReady}
                className="w-full"
              >
                <Zap className="h-4.5 w-4.5" />
                {generating ? 'Generating your test…' : `Generate ${numQuestions} Questions`}
              </Button>

              {!selectedChapter && (
                <p className="text-xs text-gray-600 text-center">Select all fields above to continue</p>
              )}
            </div>

            {/* Generating overlay */}
            {generating && (
              <div className="rounded-2xl bg-[#0E1117] border border-blue-500/20 p-10 flex flex-col items-center gap-5 text-center">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-blue-400 animate-pulse" />
                  </div>
                  <div className="absolute -inset-2 rounded-3xl border border-blue-500/20 animate-ping opacity-30" />
                </div>
                <div>
                  <p className="text-base font-bold text-white mb-1">Generating your test…</p>
                  <p className="text-sm text-gray-500">
                    Reading textbook · Finding key concepts · Crafting questions
                  </p>
                  <p className="text-xs text-gray-600 mt-2">Usually takes 10–20 seconds</p>
                </div>
                <LoadingSpinner size="sm" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

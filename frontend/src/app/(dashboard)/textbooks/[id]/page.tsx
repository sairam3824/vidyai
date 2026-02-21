'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BookOpen, FileText } from 'lucide-react'

import { ApiError, boardsApi } from '@/lib/api'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface TextChunk {
    id: number
    content: string
    chunk_index: number
    page_number?: number
}

interface ChapterContent {
    id: number
    chapter_number: number
    chapter_name: string
    description?: string
    text_chunks: TextChunk[]
}

export default function ChapterReaderPage() {
    const params = useParams()

    const [chapter, setChapter] = useState<ChapterContent | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [summary, setSummary] = useState('')
    const [summaryLoading, setSummaryLoading] = useState(false)
    const [summaryError, setSummaryError] = useState('')

    useEffect(() => {
        if (!params.id) return

        setLoading(true)
        setSummary('')
        setSummaryError('')
        boardsApi.getChapter(Number(params.id))
            .then((data) => {
                setChapter(data)
                setError('')
            })
            .catch((err) => {
                console.error(err)
                setError('Failed to load chapter content')
            })
            .finally(() => setLoading(false))
    }, [params.id])

    async function handleGenerateSummary() {
        if (!chapter || summaryLoading) return

        setSummaryLoading(true)
        setSummaryError('')

        try {
            const response = await boardsApi.generateSummary(chapter.id)
            setSummary(response.summary)
        } catch (err) {
            console.error(err)
            setSummaryError(
                err instanceof ApiError
                    ? err.message
                    : 'Failed to generate summary. Please try again.',
            )
        } finally {
            setSummaryLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <LoadingSpinner size="lg" label="Opening textbook..." />
            </div>
        )
    }

    if (error || !chapter) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400">
                    <BookOpen className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-white">Could not load chapter</h3>
                <p className="text-gray-400">{error || 'Chapter not found'}</p>
                <Link
                    href="/textbooks"
                    className="px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white transition-colors text-sm font-medium"
                >
                    Back to Curriculum
                </Link>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto pb-20">
            {/* Header */}
            <div className="mb-6 sm:mb-8 flex flex-wrap items-center gap-3 sm:gap-4">
                <Link
                    href="/textbooks"
                    className="p-2 rounded-lg hover:bg-white/[0.06] text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        Chapter {chapter.chapter_number}
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">{chapter.chapter_name}</h1>
                </div>
            </div>

            {/* AI Assistant Features */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/[0.06] flex flex-col gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Chapter Summary</h3>
                    <p className="text-sm text-gray-400">AI-generated summary of key concepts and formulas.</p>
                    <button
                        onClick={handleGenerateSummary}
                        disabled={summaryLoading}
                        className="mt-auto py-2 px-4 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] disabled:opacity-70 disabled:cursor-not-allowed text-sm font-medium text-white transition-colors border border-white/[0.06]"
                    >
                        {summaryLoading ? 'Generating Summary…' : summary ? 'Regenerate Summary' : 'Generate Summary'}
                    </button>
                    {summaryError && <p className="text-xs text-red-400">{summaryError}</p>}
                </div>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-white/[0.06] flex flex-col gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Practice Quiz</h3>
                    <p className="text-sm text-gray-400">Test your knowledge with AI-generated questions.</p>
                    <Link
                        href="/generate"
                        className="mt-auto py-2 px-4 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-sm font-medium text-white transition-colors border border-white/[0.06] text-center"
                    >
                        Start Quiz
                    </Link>
                </div>
            </div>

            {/* Status Section */}
            <div className="bg-[#0E1117] border border-white/[0.06] rounded-2xl p-8 sm:p-12 text-center">
                {summary ? (
                    <>
                        <div className="inline-flex items-center justify-center p-4 rounded-full bg-blue-500/10 mb-6">
                            <FileText className="h-8 w-8 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Chapter Summary</h3>
                        {summaryLoading && (
                            <p className="text-xs text-blue-300/80 mb-4">Refreshing summary…</p>
                        )}
                        <p className="text-gray-300 max-w-2xl mx-auto leading-relaxed whitespace-pre-line text-left">
                            {summary}
                        </p>
                    </>
                ) : (
                    <>
                        <div className="inline-flex items-center justify-center p-4 rounded-full bg-blue-500/10 mb-6">
                            <BookOpen className="h-8 w-8 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">
                            {summaryLoading ? 'Generating Summary…' : 'Ready for Learning'}
                        </h3>
                        <p className="text-gray-400 max-w-lg mx-auto leading-relaxed">
                            {summaryLoading
                                ? 'Analyzing chapter content and preparing a concise summary.'
                                : 'This chapter has been indexed. Use the AI tools above to generate a summary or start a practice quiz to test your understanding.'}
                        </p>
                    </>
                )}
            </div>

            {/* Footer Nav */}
            <div className="mt-8 flex justify-between items-center text-sm text-gray-500">
                <span>End of chapter</span>
                <div className="flex gap-2">
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="hover:text-white transition-colors"
                    >
                        Back to top
                    </button>
                </div>
            </div>
        </div>
    )
}

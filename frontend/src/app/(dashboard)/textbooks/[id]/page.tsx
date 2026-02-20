'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BookOpen, FileText, Download, ExternalLink } from 'lucide-react'

import { boardsApi } from '@/lib/api'
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
    const router = useRouter()

    const [chapter, setChapter] = useState<ChapterContent | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!params.id) return

        setLoading(true)
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
            <div className="mb-8 flex items-center gap-4">
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
                    <button className="mt-auto py-2 px-4 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-sm font-medium text-white transition-colors border border-white/[0.06]">
                        Generate Summary
                    </button>
                </div>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-white/[0.06] flex flex-col gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Practice Quiz</h3>
                    <p className="text-sm text-gray-400">Test your knowledge with AI-generated questions.</p>
                    <button className="mt-auto py-2 px-4 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-sm font-medium text-white transition-colors border border-white/[0.06]">
                        Start Quiz
                    </button>
                </div>
            </div>

            {/* Status Section */}
            <div className="bg-[#0E1117] border border-white/[0.06] rounded-2xl p-12 text-center">
                <div className="inline-flex items-center justify-center p-4 rounded-full bg-blue-500/10 mb-6">
                    <BookOpen className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Ready for Learning</h3>
                <p className="text-gray-400 max-w-lg mx-auto leading-relaxed">
                    This chapter has been indexed. Use the AI tools above to generate a summary or start a practice quiz to test your understanding.
                </p>
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

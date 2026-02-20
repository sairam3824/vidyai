'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    BookOpen,
    Library,
    GraduationCap,
    ArrowRight,
    School
} from 'lucide-react'
import { boardsApi } from '@/lib/api'
import type { Board, Class, Subject, Chapter } from '@/types'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { cn } from '@/lib/utils'

export default function TextbooksPage() {
    const [boards, setBoards] = useState<Board[]>([])
    const [loading, setLoading] = useState(true)

    const [selectedBoard, setSelectedBoard] = useState<Board | null>(null)
    const [selectedClass, setSelectedClass] = useState<Class | null>(null)
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)

    useEffect(() => {
        boardsApi.list().then((data) => {
            setBoards(data)
            // Auto-select first active board if available
            if (data.length > 0) setSelectedBoard(data[0])
        }).catch(() => {}).finally(() => setLoading(false))
    }, [])

    // Reset downstream selections when upstream changes
    useEffect(() => {
        setSelectedClass(null)
        setSelectedSubject(null)
    }, [selectedBoard])

    useEffect(() => {
        setSelectedSubject(null)
    }, [selectedClass])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner size="lg" label="Loading curriculum..." />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Curriculum</h1>
                <p className="text-gray-400">Access your digital library based on your curriculum.</p>
            </div>

            {/* Selection Area */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* Sidebar / Filters */}
                <div className="md:col-span-3 space-y-6">
                    {/* Board Selector */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Board</label>
                        <div className="space-y-1">
                            {boards.map(board => (
                                <button
                                    key={board.id}
                                    onClick={() => setSelectedBoard(board)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left",
                                        selectedBoard?.id === board.id
                                            ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                                            : "text-gray-400 hover:bg-white/[0.04] hover:text-gray-200 border border-transparent"
                                    )}
                                >
                                    <School className="h-4 w-4 shrink-0" />
                                    {board.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Class Selector */}
                    {selectedBoard && (
                        <div className="space-y-2 animate-in slide-in-from-right-5 fade-in duration-300">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Class</label>
                            <div className="space-y-1">
                                {selectedBoard.classes.map(cls => (
                                    <button
                                        key={cls.id}
                                        onClick={() => setSelectedClass(cls)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left",
                                            selectedClass?.id === cls.id
                                                ? "bg-purple-500/15 text-purple-400 border border-purple-500/20"
                                                : "text-gray-400 hover:bg-white/[0.04] hover:text-gray-200 border border-transparent"
                                        )}
                                    >
                                        <GraduationCap className="h-4 w-4 shrink-0" />
                                        {cls.display_name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="md:col-span-9">
                    {!selectedClass ? (
                        <div className="h-full flex flex-col items-center justify-center p-12 text-center border border-white/[0.06] rounded-2xl bg-white/[0.02]">
                            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
                                <Library className="h-8 w-8 text-gray-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Select a Class</h3>
                            <p className="text-sm text-gray-500 max-w-sm">
                                Choose a board and class from the sidebar to view available subjects and chapters.
                            </p>
                        </div>
                    ) : !selectedSubject ? (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-300">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white">Subjects for {selectedClass.display_name}</h2>
                                <span className="text-xs text-gray-500 bg-white/[0.06] px-2 py-1 rounded-md">
                                    {selectedClass.subjects.length} Subjects
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {selectedClass.subjects.map(subject => (
                                    <button
                                        key={subject.id}
                                        onClick={() => setSelectedSubject(subject)}
                                        className="group relative flex flex-col items-start p-5 rounded-2xl bg-[#0E1117] border border-white/[0.06] hover:border-blue-500/30 hover:bg-white/[0.04] transition-all text-left"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <BookOpen className="h-5 w-5 text-blue-400" />
                                        </div>
                                        <h3 className="font-bold text-white text-lg mb-1">{subject.subject_name}</h3>
                                        <p className="text-xs text-gray-500 mb-4">{subject.chapters.length} Chapters</p>

                                        <div className="w-full mt-auto pt-4 border-t border-white/[0.04] flex items-center justify-between">
                                            <span className="text-xs font-medium text-blue-400 group-hover:underline">View Chapters</span>
                                            <ArrowRight className="h-3 w-3 text-gray-600 group-hover:text-blue-400 transition-colors" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-300">
                            <div className="flex items-center gap-4 mb-6">
                                <button
                                    onClick={() => setSelectedSubject(null)}
                                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors"
                                >
                                    <ArrowRight className="h-4 w-4 rotate-180" /> Back to Subjects
                                </button>
                                <div className="h-4 w-px bg-white/[0.1]" />
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 text-blue-400" />
                                    {selectedSubject.subject_name}
                                </h2>
                            </div>

                            <div className="space-y-3">
                                {selectedSubject.chapters.filter(ch => ch.is_active).length === 0 ? (
                                    <div className="p-8 text-center text-gray-500 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                                        No chapters available yet.
                                    </div>
                                ) : (
                                    selectedSubject.chapters.filter(ch => ch.is_active).map((chapter, idx) => (
                                        <div
                                            key={chapter.id}
                                            className="group flex items-start gap-4 p-4 rounded-xl bg-[#0E1117] border border-white/[0.06] hover:border-white/[0.12] transition-colors"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-white/[0.03] flex items-center justify-center shrink-0 border border-white/[0.05] text-sm font-bold text-gray-400">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1 min-w-0 pt-1">
                                                <h4 className="font-medium text-white mb-1 group-hover:text-blue-300 transition-colors">
                                                    {chapter.chapter_name}
                                                </h4>
                                                {chapter.description && (
                                                    <p className="text-sm text-gray-500">{chapter.description}</p>
                                                )}
                                            </div>
                                            <Link
                                                href={`/textbooks/${chapter.id}`}
                                                className="self-center px-4 py-2 text-xs font-semibold rounded-lg bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors border border-white/[0.06]"
                                            >
                                                Read
                                            </Link>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

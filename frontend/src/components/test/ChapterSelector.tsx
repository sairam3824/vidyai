'use client'

import { useState, useEffect } from 'react'
import { boardsApi } from '@/lib/api'
import type { Board, Chapter, Class, Subject } from '@/types'
import { Select } from '@/components/ui/Select'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface ChapterSelectorProps {
  onChapterSelect: (chapter: Chapter | null) => void
  disabled?: boolean
}

export function ChapterSelector({ onChapterSelect, disabled }: ChapterSelectorProps) {
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedBoardId, setSelectedBoardId] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [selectedChapterId, setSelectedChapterId] = useState('')

  useEffect(() => {
    boardsApi.list().then(setBoards).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const board = boards.find((b) => String(b.id) === selectedBoardId)
  const cls = board?.classes.find((c) => String(c.id) === selectedClassId)
  const subject = cls?.subjects.find((s) => String(s.id) === selectedSubjectId)
  const chapter = subject?.chapters.find((ch) => String(ch.id) === selectedChapterId)

  useEffect(() => {
    onChapterSelect(chapter ?? null)
  }, [chapter, onChapterSelect])

  function handleBoardChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedBoardId(e.target.value)
    setSelectedClassId('')
    setSelectedSubjectId('')
    setSelectedChapterId('')
  }

  function handleClassChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedClassId(e.target.value)
    setSelectedSubjectId('')
    setSelectedChapterId('')
  }

  function handleSubjectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedSubjectId(e.target.value)
    setSelectedChapterId('')
  }

  // Count ready chapters in selected subject
  const readyCount = subject?.chapters.filter((ch) => ch.is_active && ch.chunk_count > 0).length ?? 0
  const totalCount = subject?.chapters.filter((ch) => ch.is_active).length ?? 0

  if (loading) return <LoadingSpinner size="sm" label="Loading curriculum…" />

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Board"
          value={selectedBoardId}
          onChange={handleBoardChange}
          disabled={disabled}
          placeholder="Select board"
        >
          {boards.filter((b) => b.is_active).map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </Select>

        <Select
          label="Class"
          value={selectedClassId}
          onChange={handleClassChange}
          disabled={disabled || !selectedBoardId}
          placeholder="Select class"
        >
          {(board?.classes ?? []).filter((c) => c.is_active).map((c) => (
            <option key={c.id} value={c.id}>{c.display_name}</option>
          ))}
        </Select>

        <Select
          label="Subject"
          value={selectedSubjectId}
          onChange={handleSubjectChange}
          disabled={disabled || !selectedClassId}
          placeholder="Select subject"
        >
          {(cls?.subjects ?? []).filter((s) => s.is_active).map((s) => (
            <option key={s.id} value={s.id}>{s.subject_name}</option>
          ))}
        </Select>

        <Select
          label="Chapter"
          value={selectedChapterId}
          onChange={(e) => setSelectedChapterId(e.target.value)}
          disabled={disabled || !selectedSubjectId}
          placeholder="Select chapter"
        >
          {(subject?.chapters ?? []).filter((ch) => ch.is_active).map((ch) => (
            <option key={ch.id} value={ch.id}>
              {ch.chapter_number}. {ch.chapter_name}
              {ch.chunk_count > 0 ? ' ✓' : ' (coming soon)'}
            </option>
          ))}
        </Select>
      </div>

      {/* Chapter availability summary */}
      {selectedSubjectId && totalCount > 0 && (
        <p className="text-xs text-gray-500">
          <span className="text-emerald-400 font-medium">{readyCount}</span>
          {' '}of {totalCount} chapters ready to test
        </p>
      )}
    </div>
  )
}

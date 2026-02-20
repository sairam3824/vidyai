'use client'

import { useEffect, useState } from 'react'
import { adminApi, ApiError } from '@/lib/api'
import type { AdminChapter } from '@/types'
import { CheckCircle, Clock, AlertCircle, Loader } from 'lucide-react'

function StatusBadge({ status }: { status: AdminChapter['status'] }) {
  const config = {
    ready: { icon: CheckCircle, color: 'text-green-400 bg-green-500/10 border-green-500/20', label: 'Ready' },
    processing: { icon: Loader, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', label: 'Processing' },
    pending: { icon: Clock, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', label: 'Pending' },
    failed: { icon: AlertCircle, color: 'text-red-400 bg-red-500/10 border-red-500/20', label: 'Failed' },
  }
  const { icon: Icon, color, label } = config[status] ?? config.pending
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      <Icon className={`h-3 w-3 ${status === 'processing' ? 'animate-spin' : ''}`} />
      {label}
    </span>
  )
}

export default function AdminChaptersPage() {
  const [chapters, setChapters] = useState<AdminChapter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    adminApi.listChapters()
      .then(setChapters)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load chapters'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <span className="h-6 w-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Chapters</h1>
          <p className="text-gray-400 text-sm mt-1">{chapters.length} chapters total</p>
        </div>
        <a
          href="/admin/upload"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold transition-colors"
        >
          + Upload PDF
        </a>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Chapter</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Board / Class / Subject</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Chunks</th>
            </tr>
          </thead>
          <tbody>
            {chapters.map((ch, i) => (
              <tr
                key={ch.id}
                className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${i === chapters.length - 1 ? 'border-0' : ''}`}
              >
                <td className="px-5 py-4">
                  <p className="text-white font-medium">Ch. {ch.chapter_number}: {ch.chapter_name}</p>
                </td>
                <td className="px-5 py-4 text-gray-400">
                  {ch.board ?? '—'} · Class {ch.class_number ?? '—'} · {ch.subject ?? '—'}
                </td>
                <td className="px-5 py-4"><StatusBadge status={ch.status} /></td>
                <td className="px-5 py-4 text-gray-400">{ch.chunk_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {chapters.length === 0 && (
          <div className="px-5 py-12 text-center text-gray-600 text-sm">No chapters yet. Upload a PDF to get started.</div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useRef, useState } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { adminApi, ApiError } from '@/lib/api'
import type { IngestionJob } from '@/types'

type Step = 'form' | 'uploading' | 'processing' | 'done' | 'error'

const BOARDS = ['CBSE', 'ICSE', 'Maharashtra State Board']
const CLASSES = Array.from({ length: 12 }, (_, i) => i + 1) // 1–12

const SUBJECTS_BY_CLASS: Record<string, string[]> = {
  '1-5': ['Mathematics', 'English', 'Hindi', 'Environmental Studies'],
  '6-8': [
    'Mathematics', 'Science', 'Social Science',
    'English', 'Hindi', 'Sanskrit', 'Urdu',
  ],
  '9-10': [
    'Mathematics', 'Science', 'Social Science',
    'English', 'Hindi', 'Sanskrit', 'Urdu',
    'Information Technology', 'Health and Physical Education',
  ],
  '11-12': [
    'Physics', 'Chemistry', 'Biology', 'Mathematics',
    'Accountancy', 'Business Studies', 'Economics',
    'History', 'Political Science', 'Geography',
    'Sociology', 'Psychology', 'Computer Science',
    'English', 'Hindi', 'Physical Education',
  ],
}

function getSubjects(classNum: number): string[] {
  if (classNum <= 5) return SUBJECTS_BY_CLASS['1-5']
  if (classNum <= 8) return SUBJECTS_BY_CLASS['6-8']
  if (classNum <= 10) return SUBJECTS_BY_CLASS['9-10']
  return SUBJECTS_BY_CLASS['11-12']
}

export default function AdminUploadPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [boardName, setBoardName] = useState('CBSE')
  const [classNumber, setClassNumber] = useState(10)
  const [subjectName, setSubjectName] = useState(getSubjects(10)[0])
  const [chapterName, setChapterName] = useState('')
  const [chapterNumber, setChapterNumber] = useState(1)
  const [step, setStep] = useState<Step>('form')
  const [job, setJob] = useState<IngestionJob | null>(null)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setError('')
    setStep('uploading')

    try {
      const formData = new FormData()
      formData.append('board_name', boardName)
      formData.append('class_number', String(classNumber))
      formData.append('subject_name', subjectName)
      formData.append('chapter_name', chapterName)
      formData.append('chapter_number', String(chapterNumber))
      formData.append('file', file)

      const result = await adminApi.uploadPdf(formData)
      setStep('processing')
      pollStatus(result.job_id)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed')
      setStep('error')
    }
  }

  function pollStatus(id: string) {
    const interval = setInterval(async () => {
      try {
        const status = await adminApi.getJobStatus(id)
        setJob(status)
        if (status.status === 'completed') {
          setStep('done')
          clearInterval(interval)
        } else if (status.status === 'failed') {
          setError(status.error_message ?? 'Ingestion failed')
          setStep('error')
          clearInterval(interval)
        }
      } catch {
        clearInterval(interval)
      }
    }, 3000)
  }

  function reset() {
    setFile(null)
    setBoardName('CBSE')
    setClassNumber(10)
    setSubjectName(getSubjects(10)[0])
    setChapterName('')
    setChapterNumber(1)
    setStep('form')
    setJob(null)
    setError('')
    if (fileRef.current) fileRef.current.value = ''
  }

  // ── Done / Processing / Error states ──────────────────────────────────────

  if (step === 'done') {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 py-12">
        <div className="flex justify-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20">
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-white">Chapter Ready</h2>
        <p className="text-sm text-gray-400">
          The PDF has been processed and embeddings stored. Students can now generate tests for this chapter.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold transition-colors">
            Upload another
          </button>
          <a href="/admin/chapters" className="px-4 py-2 rounded-xl border border-white/10 text-gray-300 text-sm font-semibold hover:bg-white/[0.04] transition-colors">
            View chapters
          </a>
        </div>
      </div>
    )
  }

  if (step === 'processing' || step === 'uploading') {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 py-12">
        <div className="flex justify-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20">
            <Loader className="h-8 w-8 text-blue-400 animate-spin" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-white">
          {step === 'uploading' ? 'Uploading PDF…' : 'Generating Embeddings…'}
        </h2>
        <p className="text-sm text-gray-400">
          {step === 'uploading'
            ? 'Uploading the PDF to S3.'
            : 'Extracting text, chunking, and generating OpenAI embeddings. This may take 1–2 minutes.'}
        </p>
        {job && (
          <p className="text-xs text-gray-600">
            Job status: <span className="text-gray-400 font-medium">{job.status}</span>
          </p>
        )}
      </div>
    )
  }

  if (step === 'error') {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 py-12">
        <div className="flex justify-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-white">Upload Failed</h2>
        <p className="text-sm text-red-400">{error}</p>
        <button onClick={reset} className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold transition-colors">
          Try again
        </button>
      </div>
    )
  }

  // ── Form ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Upload PDF</h1>
        <p className="text-gray-400 text-sm mt-1">
          Fill in the chapter details and attach the PDF. Embeddings are generated automatically in the background.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Board */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Board</label>
          <select
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
            className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] text-white px-4 py-3 text-sm focus:outline-none focus:border-blue-500/60 transition-all"
          >
            {BOARDS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {/* Class + Subject */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Class</label>
            <select
              value={classNumber}
              onChange={(e) => {
                const c = Number(e.target.value)
                setClassNumber(c)
                setSubjectName(getSubjects(c)[0])
              }}
              className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] text-white px-4 py-3 text-sm focus:outline-none focus:border-blue-500/60 transition-all"
            >
              {CLASSES.map((c) => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Subject</label>
            <select
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] text-white px-4 py-3 text-sm focus:outline-none focus:border-blue-500/60 transition-all"
            >
              {getSubjects(classNumber).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Chapter Name + Number */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Chapter Name</label>
            <input
              type="text"
              required
              value={chapterName}
              onChange={(e) => setChapterName(e.target.value)}
              placeholder="e.g. Real Numbers"
              className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder-gray-600 px-4 py-3 text-sm focus:outline-none focus:border-blue-500/60 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Chapter #</label>
            <input
              type="number"
              required
              min={1}
              value={chapterNumber}
              onChange={(e) => setChapterNumber(Number(e.target.value))}
              className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] text-white px-4 py-3 text-sm focus:outline-none focus:border-blue-500/60 transition-all"
            />
          </div>
        </div>

        {/* PDF File */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">PDF File</label>
          <div
            className="border-2 border-dashed border-white/[0.10] rounded-xl p-6 text-center hover:border-blue-500/40 transition-colors cursor-pointer"
            onClick={() => fileRef.current?.click()}
          >
            {file ? (
              <div className="flex items-center justify-center gap-2 text-white">
                <FileText className="h-5 w-5 text-blue-400" />
                <span className="text-sm font-medium">{file.name}</span>
                <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 text-gray-600 mx-auto" />
                <p className="text-sm text-gray-500">Click to select a PDF file</p>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <button
          type="submit"
          disabled={!file || !chapterName}
          className="w-full rounded-xl bg-blue-500 hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 text-sm transition-colors shadow-lg shadow-blue-500/20"
        >
          Upload & Generate Embeddings
        </button>
      </form>
    </div>
  )
}

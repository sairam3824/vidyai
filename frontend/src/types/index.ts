// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string   // UUID from Supabase Auth
  email: string | null
  full_name: string | null
  subscription_tier: 'free' | 'basic' | 'premium' | 'enterprise'
  is_admin: boolean
  is_active: boolean
  is_verified: boolean
}

// ─── Curriculum ───────────────────────────────────────────────────────────────

export interface Chapter {
  id: number
  chapter_number: number
  chapter_name: string
  description: string | null
  is_active: boolean
  status: 'pending' | 'processing' | 'ready' | 'failed'
  /** Number of embedded text chunks ingested from the PDF. 0 = not ready yet. */
  chunk_count: number
}

export interface ChapterSummary {
  chapter_id: number
  chapter_name: string
  summary: string
}

export interface Subject {
  id: number
  subject_name: string
  subject_code: string | null
  is_active: boolean
  chapters: Chapter[]
}

export interface Class {
  id: number
  class_number: number
  display_name: string
  is_active: boolean
  subjects: Subject[]
}

export interface Board {
  id: number
  name: string
  code: string
  description: string | null
  is_active: boolean
  classes: Class[]
}

// ─── Tests ────────────────────────────────────────────────────────────────────

export interface MCQOption {
  key: string
  text: string
}

export interface MCQQuestion {
  id: number
  question: string
  options: MCQOption[]
  correct_answer: string
  explanation: string
  user_answer?: string | null
}

export interface QuestionsPayload {
  questions: MCQQuestion[]
}

export interface GeneratedTest {
  id: number
  chapter_id: number | null
  chapter_name: string | null
  subject_name: string | null
  questions_json: QuestionsPayload
  score: number | null
  completed_at: string | null
  created_at: string
}

export interface AnswerDetail {
  question_id: number
  question: string
  user_answer: string | null
  correct_answer: string
  is_correct: boolean
  explanation: string
}

export interface SubmitTestResponse {
  test_id: number
  score: number
  total_questions: number
  correct_answers: number
  details: AnswerDetail[]
}

// ─── Usage ────────────────────────────────────────────────────────────────────

export interface UsageStatus {
  tests_generated_this_week: number
  tests_remaining: number
  weekly_limit: number
  week_start: string
  can_generate: boolean
  subscription_tier: string
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface AdminChapter {
  id: number
  chapter_number: number
  chapter_name: string
  status: 'pending' | 'processing' | 'ready' | 'failed'
  chunk_count: number
  subject: string | null
  class_number: number | null
  board: string | null
  created_at: string
}

export interface IngestionJob {
  id: string
  chapter_id: number | null
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

// ─── UI Utilities ─────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  message: string
}

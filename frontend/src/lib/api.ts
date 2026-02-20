import type {
  AdminChapter,
  Board,
  GeneratedTest,
  IngestionJob,
  SubmitTestResponse,
  UsageStatus,
  User,
} from '@/types'
import { createClient } from '@/lib/supabase'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function getToken(): Promise<string | null> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

async function request<T>(
  method: string,
  path: string,
  options: { body?: unknown } = {},
): Promise<T> {
  const token = await getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    cache: 'no-store',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new ApiError(res.status, payload.detail ?? 'Request failed')
  }

  return res.json() as Promise<T>
}

async function requestFormData<T>(path: string, formData: FormData): Promise<T> {
  const token = await getToken()
  const headers: Record<string, string> = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    cache: 'no-store',
    headers,
    body: formData,
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new ApiError(res.status, payload.detail ?? 'Request failed')
  }

  return res.json() as Promise<T>
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  me: () => request<User>('GET', '/auth/me'),
  updateProfile: (data: { full_name?: string }) =>
    request<User>('PATCH', '/auth/me', { body: data }),
}

// ── Boards ────────────────────────────────────────────────────────────────────

export const boardsApi = {
  list: () => request<Board[]>('GET', '/boards'),
  getChapter: (chapterId: number) =>
    request<any>('GET', `/boards/chapters/${chapterId}`),
}

// ── Tests ─────────────────────────────────────────────────────────────────────

export const testsApi = {
  generate: (chapterId: number, numQuestions: number) =>
    request<GeneratedTest>('POST', '/tests/generate', {
      body: { chapter_id: chapterId, num_questions: numQuestions },
    }),

  list: (skip = 0, limit = 20) =>
    request<GeneratedTest[]>('GET', `/tests?skip=${skip}&limit=${limit}`),

  get: (testId: number) =>
    request<GeneratedTest>('GET', `/tests/${testId}`),

  submit: (testId: number, answers: Record<string, string>) =>
    request<SubmitTestResponse>('POST', `/tests/${testId}/submit`, {
      body: { answers },
    }),
}

// ── Usage ─────────────────────────────────────────────────────────────────────

export const usageApi = {
  get: () => request<UsageStatus>('GET', '/usage'),
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export const adminApi = {
  listUsers: (skip = 0, limit = 50) =>
    request<User[]>('GET', `/admin/users?skip=${skip}&limit=${limit}`),

  updateUserTier: (userId: string, tier: string) =>
    request<User>('PATCH', `/admin/users/${userId}/tier?tier=${tier}`),

  listChapters: () =>
    request<AdminChapter[]>('GET', '/admin/chapters'),

  uploadPdf: (formData: FormData) =>
    requestFormData<{ job_id: string; chapter_id: number; chapter_name: string; status: string }>(
      '/admin/upload',
      formData,
    ),

  getJobStatus: (jobId: string) =>
    request<IngestionJob>('GET', `/admin/jobs/${jobId}`),
}

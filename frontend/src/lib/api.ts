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

const LOCAL_FALLBACK_API_URL = 'http://localhost:8000/api/v1'
const CONFIGURED_API_URL = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function resolveBaseUrl(): string {
  if (CONFIGURED_API_URL) {
    return CONFIGURED_API_URL
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1') {
      return LOCAL_FALLBACK_API_URL
    }
  }

  throw new ApiError(
    0,
    'NEXT_PUBLIC_API_URL is not configured. Set it to your backend API URL (for example: https://api.yourdomain.com/api/v1).',
  )
}

function toNetworkApiError(baseUrl: string, error: unknown): ApiError {
  const reason = error instanceof Error ? error.message : 'Network request failed'
  return new ApiError(
    0,
    `Could not reach backend API at ${baseUrl}. Check NEXT_PUBLIC_API_URL, HTTPS, and backend CORS origin settings. (${reason})`,
  )
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
  const baseUrl = resolveBaseUrl()
  const token = await getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  let res: Response
  try {
    res = await fetch(`${baseUrl}${path}`, {
      method,
      cache: 'no-store',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
  } catch (error) {
    throw toNetworkApiError(baseUrl, error)
  }

  if (!res.ok) {
    const payload = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new ApiError(res.status, payload.detail ?? 'Request failed')
  }

  return res.json() as Promise<T>
}

async function requestFormData<T>(path: string, formData: FormData): Promise<T> {
  const baseUrl = resolveBaseUrl()
  const token = await getToken()
  const headers: Record<string, string> = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  let res: Response
  try {
    res = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      cache: 'no-store',
      headers,
      body: formData,
    })
  } catch (error) {
    throw toNetworkApiError(baseUrl, error)
  }

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

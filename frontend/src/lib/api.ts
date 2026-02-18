import type {
  Board,
  GeneratedTest,
  SubmitTestResponse,
  TokenResponse,
  UsageStatus,
} from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(
  method: string,
  path: string,
  options: { body?: unknown; token?: string } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new ApiError(res.status, payload.detail ?? 'Request failed')
  }

  return res.json() as Promise<T>
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (email: string, password: string, full_name?: string) =>
    request<TokenResponse>('POST', '/auth/register', {
      body: { email, password, full_name },
    }),

  login: (email: string, password: string) =>
    request<TokenResponse>('POST', '/auth/login', { body: { email, password } }),
}

// ── Boards ────────────────────────────────────────────────────────────────────

export const boardsApi = {
  list: (token: string) => request<Board[]>('GET', '/boards', { token }),
}

// ── Tests ─────────────────────────────────────────────────────────────────────

export const testsApi = {
  generate: (chapterId: number, numQuestions: number, token: string) =>
    request<GeneratedTest>('POST', '/tests/generate', {
      token,
      body: { chapter_id: chapterId, num_questions: numQuestions },
    }),

  list: (token: string, skip = 0, limit = 20) =>
    request<GeneratedTest[]>('GET', `/tests?skip=${skip}&limit=${limit}`, { token }),

  get: (testId: number, token: string) =>
    request<GeneratedTest>('GET', `/tests/${testId}`, { token }),

  submit: (testId: number, answers: Record<string, string>, token: string) =>
    request<SubmitTestResponse>('POST', `/tests/${testId}/submit`, {
      token,
      body: { answers },
    }),
}

// ── Usage ─────────────────────────────────────────────────────────────────────

export const usageApi = {
  get: (token: string) => request<UsageStatus>('GET', '/usage', { token }),
}

export { ApiError }

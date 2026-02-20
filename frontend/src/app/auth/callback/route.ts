import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  let redirectPath = '/dashboard'

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: Record<string, unknown>) {
            cookieStore.set({ name, value, ...options } as any)
          },
          remove(name: string, options: Record<string, unknown>) {
            cookieStore.set({ name, value: '', ...options } as any)
          },
        },
      },
    )

    const { data: { session } } = await supabase.auth.exchangeCodeForSession(code)

    // Check admin status and redirect accordingly
    if (session?.access_token) {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          cache: 'no-store',
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (res.ok) {
          const profile = await res.json()
          if (profile.is_admin) redirectPath = '/admin'
        }
      } catch {
        // fallback to /dashboard
      }
    }
  }

  return NextResponse.redirect(new URL(redirectPath, requestUrl.origin))
}

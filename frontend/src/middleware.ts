import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          request.cookies.set({ name, value, ...options } as any)
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options } as any)
        },
        remove(name: string, options: Record<string, unknown>) {
          request.cookies.set({ name, value: '', ...options } as any)
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options } as any)
        },
      },
    },
  )

  // Refresh session — keeps cookies alive
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isDashboard = pathname.startsWith('/dashboard')
  const isAdminRoute = pathname.startsWith('/admin')
  const isAuthPage = pathname === '/login' || pathname === '/register'

  // Redirect unauthenticated users away from protected routes
  if ((isDashboard || isAdminRoute) && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Guard /admin routes — only allow users with is_admin = true
  if (isAdminRoute && user) {
    try {
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'
      const res = await fetch(`${apiBase}/auth/me`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const profile = await res.json()
        if (!profile.is_admin) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      } else {
        // If profile fetch fails, deny access to be safe
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    } catch {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/register'],
}

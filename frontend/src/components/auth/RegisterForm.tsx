'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { ApiError } from '@/lib/api'

export function RegisterForm() {
  const { register } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      await register(email, password, fullName || undefined)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
          Full name
        </label>
        <input
          type="text"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Rahul Sharma"
          className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder-gray-600 px-4 py-3 text-sm focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.07] transition-all"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
          Email address
        </label>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder-gray-600 px-4 py-3 text-sm focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.07] transition-all"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder-gray-600 px-4 py-3 pr-11 text-sm focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.07] transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-600">Must be at least 8 characters</p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-blue-500 hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 text-sm transition-colors shadow-lg shadow-blue-500/20 mt-2"
      >
        {loading ? 'Creating account…' : 'Create account'}
      </button>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
          Sign in
        </Link>
      </p>
    </form>
  )
}

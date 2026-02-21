'use client'

import { useEffect, useState } from 'react'
import { adminApi, ApiError } from '@/lib/api'
import type { User } from '@/types'

const TIERS = ['free', 'basic', 'premium', 'enterprise'] as const

function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    free: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    basic: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    premium: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    enterprise: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors[tier] ?? colors.free}`}>
      {tier}
    </span>
  )
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    adminApi.listUsers()
      .then(setUsers)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load users'))
      .finally(() => setLoading(false))
  }, [])

  async function changeTier(userId: string, tier: string) {
    setUpdatingId(userId)
    try {
      const updated = await adminApi.updateUserTier(userId, tier)
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, ...updated } : u))
    } catch {
      // ignore
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <span className="h-6 w-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-gray-400 text-sm mt-1">{users.length} registered users</p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tier</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Change Tier</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, i) => (
              <tr
                key={user.id}
                className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${i === users.length - 1 ? 'border-0' : ''}`}
              >
                <td className="px-5 py-4 text-white font-medium">{user.full_name ?? '—'}</td>
                <td className="px-5 py-4 text-gray-400">{user.email ?? '—'}</td>
                <td className="px-5 py-4"><TierBadge tier={user.subscription_tier} /></td>
                <td className="px-5 py-4 text-gray-400">{user.is_admin ? 'Yes' : 'No'}</td>
                <td className="px-5 py-4">
                  <select
                    value={user.subscription_tier}
                    disabled={updatingId === user.id}
                    onChange={(e) => changeTier(user.id, e.target.value)}
                    className="rounded-lg bg-white/[0.05] border border-white/[0.08] text-white text-xs px-2 py-1.5 focus:outline-none focus:border-blue-500/50 disabled:opacity-50"
                  >
                    {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="px-5 py-12 text-center text-gray-600 text-sm">No users yet.</div>
        )}
        </div>
      </div>
    </div>
  )
}

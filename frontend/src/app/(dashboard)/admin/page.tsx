'use client'

import Link from 'next/link'
import { Users, BookOpen, Upload, ArrowRight } from 'lucide-react'

const cards = [
  {
    href: '/admin/users',
    icon: Users,
    title: 'Users',
    description: 'View all registered users, subscription tiers, and activity.',
    color: 'from-blue-500/20 to-blue-600/10 border-blue-500/20',
    iconColor: 'text-blue-400',
  },
  {
    href: '/admin/chapters',
    icon: BookOpen,
    title: 'Chapters',
    description: 'View all chapters and their embedding ingestion status.',
    color: 'from-purple-500/20 to-purple-600/10 border-purple-500/20',
    iconColor: 'text-purple-400',
  },
  {
    href: '/admin/upload',
    icon: Upload,
    title: 'Upload PDF',
    description: 'Upload a new textbook PDF. Embeddings are generated automatically.',
    color: 'from-green-500/20 to-green-600/10 border-green-500/20',
    iconColor: 'text-green-400',
  },
]

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
        <p className="text-gray-400 text-sm mt-1">Manage users, curriculum, and PDF ingestion.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map(({ href, icon: Icon, title, description, color, iconColor }) => (
          <Link
            key={href}
            href={href}
            className={`group block rounded-2xl border bg-gradient-to-br ${color} p-6 hover:scale-[1.02] transition-transform`}
          >
            <div className="flex items-start justify-between">
              <Icon className={`h-6 w-6 ${iconColor}`} />
              <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-white">{title}</h2>
            <p className="mt-1 text-sm text-gray-400">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

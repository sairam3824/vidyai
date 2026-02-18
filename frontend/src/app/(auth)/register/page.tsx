import type { Metadata } from 'next'
import Link from 'next/link'
import { GraduationCap, CheckCircle } from 'lucide-react'
import { RegisterForm } from '@/components/auth/RegisterForm'

export const metadata: Metadata = { title: 'Create Account' }

const perks = [
  '3 free AI-generated tests every week',
  'Chapter-specific MCQs from real textbooks',
  'Instant scores and detailed explanations',
  'Track your progress over time',
]

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        {/* Left — value prop */}
        <div className="hidden md:block">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-8">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 shadow-md">
              <GraduationCap className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold text-gray-900">Vidyai</span>
          </Link>
          <h2 className="text-3xl font-extrabold text-gray-900 leading-tight">
            Start practising smarter today
          </h2>
          <p className="mt-3 text-gray-500">
            Join thousands of CBSE students using AI to study more effectively.
          </p>
          <ul className="mt-8 space-y-3">
            {perks.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-sm text-gray-700">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right — form */}
        <div>
          <div className="md:hidden text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600">
                <GraduationCap className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">Vidyai</span>
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-xl ring-1 ring-gray-950/5 px-8 py-8">
            <h1 className="text-xl font-bold text-gray-900 mb-1">Create your account</h1>
            <p className="text-sm text-gray-500 mb-6">Free forever · No credit card needed</p>
            <RegisterForm />
          </div>
        </div>
      </div>
    </div>
  )
}

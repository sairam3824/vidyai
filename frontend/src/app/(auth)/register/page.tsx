import Link from 'next/link'
import { GraduationCap, CheckCircle } from 'lucide-react'
import { RegisterForm } from '@/components/auth/RegisterForm'

const perks = [
  '3 free AI-generated tests every week',
  'Chapter-specific MCQs from real textbooks',
  'Instant scores and detailed explanations',
  'Track your progress over time',
]

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#06080F] flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 bg-[#0A0D16] border-r border-white/[0.05] p-10">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500 shadow-lg shadow-blue-500/30">
            <GraduationCap className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-base font-bold text-white">Vidyai</span>
        </div>

        {/* Main copy */}
        <div>
          <h2 className="text-4xl font-black text-white leading-tight tracking-tight mb-4">
            Start practising<br />
            <span className="text-blue-400">smarter today</span>
          </h2>
          <p className="text-gray-500 text-base mb-10 leading-relaxed">
            Join thousands of CBSE students using AI to study more effectively.
          </p>
          <ul className="space-y-4">
            {perks.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <span className="text-gray-400 text-sm">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom quote */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
          <p className="text-gray-400 text-sm leading-relaxed italic mb-3">
            &ldquo;I scored 94% in my Science board exam after using Vidyai for just 3 weeks.&rdquo;
          </p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/30 border border-blue-500/30 flex items-center justify-center text-sm font-bold text-blue-300">
              R
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-300">Rahul S.</p>
              <p className="text-xs text-gray-600">CBSE Class 10, Delhi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10 sm:py-12">
        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500">
            <GraduationCap className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-base font-bold text-white">Vidyai</span>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">Create your account</h1>
            <p className="text-gray-500">Free forever · No credit card needed</p>
          </div>

          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-5 sm:p-8">
            <RegisterForm />
          </div>
        </div>
      </div>
    </div>
  )
}

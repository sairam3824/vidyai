import Link from 'next/link'
import { GraduationCap, Zap, BarChart3, Shield } from 'lucide-react'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#06080F] flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 bg-[#0A0D16] border-r border-white/[0.05] p-10">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500 shadow-lg shadow-blue-500/30">
            <GraduationCap className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-base font-bold text-white">Vidyai</span>
        </div>

        <div>
          <h2 className="text-4xl font-black text-white leading-tight tracking-tight mb-4">
            Welcome<br />
            <span className="text-blue-400">back.</span>
          </h2>
          <p className="text-gray-500 text-base mb-10 leading-relaxed">
            Continue where you left off. Your tests and progress are waiting.
          </p>

          <div className="space-y-4">
            {[
              { icon: Zap, label: 'AI-Generated Tests', desc: 'Chapter MCQs in seconds' },
              { icon: BarChart3, label: 'Progress Tracking', desc: 'See every improvement' },
              { icon: Shield, label: 'CBSE-Aligned', desc: '100% syllabus accurate' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-200">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-700">
          © {new Date().getFullYear()} Vidyai. Built for CBSE students.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500">
            <GraduationCap className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-base font-bold text-white">Vidyai</span>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white mb-1">Sign in</h1>
            <p className="text-gray-500">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                Sign up free
              </Link>
            </p>
          </div>

          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-8">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  )
}

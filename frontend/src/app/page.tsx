import Link from 'next/link'
import { GraduationCap, Zap, BarChart3, Shield, ArrowRight, CheckCircle } from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'AI-Generated Tests',
    description:
      '10-question MCQ tests created in seconds using RAG — grounded in your actual textbook content.',
  },
  {
    icon: BarChart3,
    title: 'Track Progress',
    description:
      'See your scores over time, identify weak chapters, and study smarter with data-driven insights.',
  },
  {
    icon: Shield,
    title: 'Curriculum-Aligned',
    description:
      'Every question is generated from CBSE-approved textbook content. 100% syllabus accurate.',
  },
]

const plans = [
  { name: 'Free', price: '₹0', tests: '3 tests/week', cta: 'Get started free', highlight: false },
  { name: 'Basic', price: '₹99/mo', tests: '20 tests/week', cta: 'Start Basic', highlight: true },
  {
    name: 'Premium',
    price: '₹249/mo',
    tests: 'Unlimited tests',
    cta: 'Go Premium',
    highlight: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600">
              <GraduationCap className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold text-gray-900">Vidyai</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Get started free
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-20 pb-24 text-center">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/60 via-white to-white" />
        <div className="mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200 mb-6">
            <Zap className="h-3 w-3" /> Now live for CBSE Class 10
          </span>
          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
            AI-Powered Practice Tests{' '}
            <span className="text-indigo-600">for CBSE Class 10</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-xl mx-auto">
            Generate chapter-specific MCQ tests instantly. Get immediate feedback with explanations.
            Study smarter — not harder.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white hover:bg-indigo-700 transition-colors shadow-md"
            >
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-gray-900 ring-1 ring-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-400">
            Free forever · No credit card needed · 3 tests/week on free plan
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 bg-gray-50">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-gray-900 mb-3">
            Everything you need to excel
          </h2>
          <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">
            Powered by GPT-4o and your real CBSE textbooks, not random internet content.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-gray-950/5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 mb-4">
                  <Icon className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold text-gray-900 mb-3">
            Simple, transparent pricing
          </h2>
          <p className="text-center text-gray-500 mb-12">
            Start free. Upgrade when you need more.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-6 shadow-sm ring-2 ${
                  plan.highlight
                    ? 'ring-indigo-500 bg-indigo-600 text-white'
                    : 'ring-gray-200 bg-white'
                }`}
              >
                <p className={`text-sm font-semibold ${plan.highlight ? 'text-indigo-200' : 'text-indigo-600'}`}>
                  {plan.name}
                </p>
                <p className={`text-3xl font-extrabold mt-2 mb-1 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {plan.price}
                </p>
                <p className={`text-sm mb-6 ${plan.highlight ? 'text-indigo-200' : 'text-gray-500'}`}>
                  {plan.tests}
                </p>
                <ul className="space-y-2 mb-8">
                  {['Chapter-wise MCQ tests', 'Instant explanations', 'Score tracking'].map(
                    (f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <CheckCircle
                          className={`h-4 w-4 ${plan.highlight ? 'text-indigo-300' : 'text-emerald-500'}`}
                        />
                        <span className={plan.highlight ? 'text-indigo-100' : 'text-gray-600'}>
                          {f}
                        </span>
                      </li>
                    ),
                  )}
                </ul>
                <Link
                  href="/register"
                  className={`block w-full text-center rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                    plan.highlight
                      ? 'bg-white text-indigo-600 hover:bg-indigo-50'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} Vidyai. Built for CBSE students across India.
      </footer>
    </div>
  )
}

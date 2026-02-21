import Link from 'next/link'
import {
  GraduationCap,
  Zap,
  BarChart3,
  Shield,
  ArrowRight,
  CheckCircle,
  Star,
  BookOpen,
  Brain,
  Sparkles,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#06080F] text-white overflow-x-hidden">

      {/* ── NAV ── */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500 shadow-lg shadow-blue-500/40">
              <GraduationCap className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold text-white tracking-tight">Vidyai</span>
          </div>

          {/* Center nav */}
          <nav className="hidden md:flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1.5 backdrop-blur-md">
            {[
              { label: 'Overview', active: true },
              { label: 'Features', active: false },
              { label: 'Pricing', active: false },
              { label: 'About', active: false },
            ].map(({ label, active }) => (
              <a
                key={label}
                href={`#${label.toLowerCase()}`}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${active
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
                  }`}
              >
                {label}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:block text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.07] px-5 py-2 text-sm font-semibold text-white hover:bg-white/[0.12] hover:border-white/30 transition-all backdrop-blur-sm"
            >
              Get Started
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section id="overview" className="relative min-h-screen flex flex-col justify-center pt-16 overflow-hidden">

        {/* Background atmosphere */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Main blue glow — center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full bg-blue-600/12 blur-[120px] animate-glow-pulse" />
          {/* Top-left accent glow */}
          <div className="absolute -top-20 -left-20 w-[500px] h-[500px] rounded-full bg-blue-500/8 blur-[100px]" />
          {/* Bottom right accent */}
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-blue-400/6 blur-[80px]" />

          {/* Grid overlay */}

          {/* Radial vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,transparent_40%,#06080F_100%)]" />
        </div>

        {/* Hero content — LEFT ALIGNED like Spotify reference */}
        <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 pt-8 sm:pt-12 pb-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-4rem)]">

            {/* Left: Text */}
            <div className="flex flex-col justify-center pb-24 lg:pb-0">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-semibold text-blue-300 mb-8 w-fit backdrop-blur-sm">
                <BookOpen className="h-3.5 w-3.5" />
                AI-powered learning for CBSE
              </div>

              {/* Headline */}
              <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black leading-[0.95] tracking-tighter mb-6 sm:mb-8">
                <span className="text-white block">THE AI</span>
                <span className="text-white block">TUTOR THAT</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-300 animate-shimmer">
                  SCORES WITH
                </span>
                <span className="text-white block">YOU.</span>
              </h1>

              <p className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-md mb-8 sm:mb-10">
                Generate chapter-specific MCQ tests in seconds.
                Instant explanations. Track every improvement.
                Built for CBSE Students.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/register"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-blue-500 hover:bg-blue-400 px-8 py-4 text-base font-bold text-white transition-all shadow-[0_0_40px_rgba(59,130,246,0.4)] hover:shadow-[0_0_60px_rgba(59,130,246,0.55)] hover:-translate-y-0.5"
                >
                  Start for free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-8 py-4 text-base font-bold text-white hover:bg-white/[0.08] hover:border-white/20 transition-all"
                >
                  Sign in
                </Link>
              </div>


            </div>

            {/* Right: Visual — mock dashboard card */}
            <div className="hidden lg:flex items-center justify-center relative pb-0">
              {/* Glow behind card */}
              <div className="absolute w-80 h-80 rounded-full bg-blue-500/15 blur-[80px] animate-glow-pulse" />

              {/* Dashboard mockup */}
              <div className="relative w-full max-w-sm animate-float-y">
                {/* Main card */}
                <div className="rounded-3xl bg-[#0E1117] border border-white/[0.07] p-6 shadow-[0_40px_120px_rgba(0,0,0,0.7)]">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Chapter Test</p>
                      <p className="text-white font-bold text-base">Light — Reflection</p>
                    </div>
                    <span className="rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold px-3 py-1">
                      Physics
                    </span>
                  </div>

                  {/* Score ring */}
                  <div className="flex items-center justify-center my-6">
                    <div className="relative w-32 h-32">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                        <circle
                          cx="60" cy="60" r="54" fill="none"
                          stroke="url(#scoreGrad)" strokeWidth="10"
                          strokeLinecap="round"
                          strokeDasharray={`${(85 / 100) * 2 * Math.PI * 54} ${2 * Math.PI * 54}`}
                        />
                        <defs>
                          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3B82F6" />
                            <stop offset="100%" stopColor="#22D3EE" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-3xl font-black text-white">85%</p>
                        <p className="text-xs text-gray-500">Score</p>
                      </div>
                    </div>
                  </div>

                  {/* Questions */}
                  <div className="space-y-2">
                    {[
                      { q: 'Angle of incidence equals…', correct: true },
                      { q: 'Concave mirror focal length…', correct: true },
                      { q: 'Virtual image is formed…', correct: false },
                    ].map(({ q, correct }, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.05] px-3 py-2.5">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${correct ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                          <div className={`w-2 h-2 rounded-full ${correct ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        </div>
                        <p className="text-xs text-gray-400 truncate">{q}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-gray-600 pt-3 border-t border-white/[0.05]">
                    <span>8.5 / 10 correct</span>
                    <span className="text-blue-400 font-medium">View explanations →</span>
                  </div>
                </div>

                {/* Floating mini card — top right */}
                <div className="absolute -top-4 -right-8 rounded-2xl bg-[#0E1117] border border-white/[0.08] p-3.5 shadow-xl animate-float-y-d">
                  <p className="text-xs text-gray-500 mb-1">AI Generated in</p>
                  <p className="text-xl font-black text-white">2.4s</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Zap className="h-3 w-3 text-amber-400" />
                    <p className="text-xs text-amber-400 font-medium">Instant</p>
                  </div>
                </div>

                {/* Floating mini card — bottom left */}
                <div className="absolute -bottom-4 -left-8 rounded-2xl bg-[#0E1117] border border-white/[0.08] p-3.5 shadow-xl">
                  <p className="text-xs text-gray-500 mb-1">Weekly streak</p>
                  <p className="text-xl font-black text-white">7 days</p>
                  <div className="flex items-center gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5, 6, 7].map(d => (
                      <div key={d} className="w-3 h-3 rounded-sm bg-blue-500/80" />
                    ))}
                  </div>
                </div>

                {/* Bottom glow */}
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-64 h-16 rounded-full bg-blue-500/20 blur-2xl" />
              </div>
            </div>

          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <div className="w-px h-12 bg-gradient-to-b from-transparent via-white to-transparent animate-pulse" />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="relative bg-[#06080F] px-4 sm:px-6 py-16 sm:py-28">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 sm:mb-16 max-w-xl">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">Why Vidyai</p>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tight mb-4">
              Built different.<br />
              <span className="text-gray-500">For results.</span>
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed">
              Powered by GPT-4o and your real CBSE textbooks — not random internet content.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: Brain,
                title: 'AI-Generated Tests',
                desc: 'Chapter-specific MCQ tests created in seconds using RAG — grounded in actual textbook content.',
                accent: 'border-blue-500/30 hover:border-blue-500/60',
                glow: 'group-hover:shadow-[0_0_40px_rgba(59,130,246,0.12)]',
                iconBg: 'bg-blue-500/15 text-blue-400',
                tag: 'GPT-4o',
              },
              {
                icon: BarChart3,
                title: 'Track Progress',
                desc: 'See scores over time, spot weak chapters, and build a smarter study plan from real data.',
                accent: 'border-emerald-500/30 hover:border-emerald-500/60',
                glow: 'group-hover:shadow-[0_0_40px_rgba(16,185,129,0.12)]',
                iconBg: 'bg-emerald-500/15 text-emerald-400',
                tag: 'Analytics',
              },
              {
                icon: Shield,
                title: 'Curriculum-Aligned',
                desc: 'Every question comes from CBSE-approved textbooks. 100% syllabus accurate, always.',
                accent: 'border-amber-500/30 hover:border-amber-500/60',
                glow: 'group-hover:shadow-[0_0_40px_rgba(245,158,11,0.12)]',
                iconBg: 'bg-amber-500/15 text-amber-400',
                tag: 'CBSE',
              },
            ].map(({ icon: Icon, title, desc, accent, glow, iconBg, tag }) => (
              <div
                key={title}
                className={`group relative rounded-2xl border bg-white/[0.02] p-5 sm:p-7 transition-all duration-300 hover:bg-white/[0.04] ${accent} ${glow}`}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${iconBg}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-bold text-gray-600 border border-white/[0.08] rounded-full px-2.5 py-1">
                    {tag}
                  </span>
                </div>
                <h3 className="font-bold text-white text-xl mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="relative bg-[#06080F] px-4 sm:px-6 py-16 sm:py-28">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] rounded-full bg-blue-600/6 blur-[100px]" />
        </div>
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10 sm:mb-16">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-3">
              Start free. Go unlimited.
            </h2>
            <p className="text-gray-500 text-lg">No surprise charges. Ever.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
            {[
              {
                name: 'Free',
                price: '₹0',
                period: 'forever',
                tests: '3 tests / week',
                features: ['Chapter-wise MCQs', 'Instant explanations', 'Score tracking'],
                cta: 'Get started',
                highlight: false,
              },
              {
                name: 'Basic',
                price: '₹99',
                period: '/month',
                tests: '20 tests / week',
                features: ['Everything in Free', 'Priority generation', 'Detailed analytics'],
                cta: 'Start Basic',
                highlight: true,
              },
              {
                name: 'Premium',
                price: '₹249',
                period: '/month',
                tests: 'Unlimited',
                features: ['Everything in Basic', 'All subjects', 'Performance reports'],
                cta: 'Go Premium',
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-5 sm:p-7 transition-all duration-300 hover:-translate-y-1 ${plan.highlight
                  ? 'bg-blue-500/[0.08] border-2 border-blue-500/50 shadow-[0_0_60px_rgba(59,130,246,0.15)] sm:scale-[1.03]'
                  : 'bg-white/[0.02] border border-white/[0.07] hover:border-white/[0.14]'
                  }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500 px-4 py-1 text-xs font-bold text-white shadow-lg shadow-blue-500/30">
                      <Sparkles className="h-3 w-3" /> Most Popular
                    </span>
                  </div>
                )}
                <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${plan.highlight ? 'text-blue-400' : 'text-gray-500'}`}>
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  <span className="text-sm text-gray-500">{plan.period}</span>
                </div>
                <p className={`text-sm mb-7 font-semibold ${plan.highlight ? 'text-blue-300' : 'text-gray-500'}`}>
                  {plan.tests}
                </p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle className={`h-4 w-4 shrink-0 ${plan.highlight ? 'text-blue-400' : 'text-gray-600'}`} />
                      <span className={plan.highlight ? 'text-gray-300' : 'text-gray-500'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block w-full text-center rounded-xl py-3 text-sm font-bold transition-all duration-200 ${plan.highlight
                    ? 'bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50'
                    : 'bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.08]'
                    }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className="relative bg-[#06080F] px-4 sm:px-6 py-16 sm:py-28 border-t border-white/[0.06]">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-8">
            <GraduationCap className="h-8 w-8 text-blue-400" />
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
            Democratizing <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Excellence</span>
          </h2>
          <p className="text-base sm:text-xl text-gray-400 leading-relaxed mb-8 sm:mb-10 max-w-2xl mx-auto">
            We believe every student deserves a personal tutor. Vidyai combines advanced AI with proven pedagogy to make high-quality exam preparation accessible to everyone.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8 text-left mt-10 sm:mt-16">
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <h3 className="font-bold text-white text-lg mb-2">For Students</h3>
              <p className="text-sm text-gray-500">Master concepts faster with instant feedback and personalized practice paths.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <h3 className="font-bold text-white text-lg mb-2">For Parents</h3>
              <p className="text-sm text-gray-500">Track progress effortlessly and see exactly where your child needs support.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <h3 className="font-bold text-white text-lg mb-2">For Schools</h3>
              <p className="text-sm text-gray-500">Empower teachers with data-driven insights to help every student succeed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative border-t border-white/[0.06] bg-[#06080F] py-10 sm:py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-500">
              <GraduationCap className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold text-white">Vidyai</span>
          </div>
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} Vidyai. Built for CBSE students across India.
          </p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="text-xs text-gray-600 hover:text-gray-300 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-xs text-gray-600 hover:text-gray-300 transition-colors">
              Terms
            </Link>
            <Link href="/contact" className="text-xs text-gray-600 hover:text-gray-300 transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

import Link from 'next/link';
import { GraduationCap, ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#06080F] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#06080F]/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500 shadow-lg shadow-blue-500/40">
              <GraduationCap className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold text-white tracking-tight">Vidyai</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Background atmosphere */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-blue-600/8 blur-[120px]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">Legal</p>
            <h1 className="text-5xl font-black text-white tracking-tight mb-4">Terms of Service</h1>
          </div>
          
          <div className="space-y-8 text-gray-400 bg-white/[0.02] border border-white/[0.07] rounded-2xl p-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using this service, you accept and agree to be bound by the terms 
              and provision of this agreement. If you do not agree to these terms, please do not 
              use this service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Use License</h2>
            <p>
              Permission is granted to temporarily access the materials on this platform for 
              personal, non-commercial use only. This is the grant of a license, not a transfer 
              of title.
            </p>
            <p className="mt-2">Under this license you may not:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Modify or copy the materials</li>
              <li>Use the materials for commercial purposes</li>
              <li>Attempt to reverse engineer any software</li>
              <li>Remove any copyright or proprietary notations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. User Account</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account and password. 
              You agree to accept responsibility for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Content Generation</h2>
            <p>
              Our AI-powered test generation service provides educational content. While we strive 
              for accuracy, we do not guarantee the correctness of all generated content. Users 
              should verify important information independently.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Prohibited Uses</h2>
            <p>You may not use this service:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>For any unlawful purpose</li>
              <li>To harass, abuse, or harm another person</li>
              <li>To impersonate or attempt to impersonate another user</li>
              <li>To upload malicious code or viruses</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Limitation of Liability</h2>
            <p>
              In no event shall the service or its suppliers be liable for any damages arising 
              out of the use or inability to use the materials on this platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Modifications</h2>
            <p>
              We reserve the right to revise these terms of service at any time without notice. 
              By using this service, you agree to be bound by the current version of these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Contact Information</h2>
            <p>
              Questions about the Terms of Service should be sent to{' '}
              <a href="mailto:sairam.maruri@gmail.com" className="text-blue-400 hover:text-blue-300 transition-colors">
                sairam.maruri@gmail.com
              </a>
            </p>
          </section>

          <p className="text-sm text-gray-600 mt-8 pt-6 border-t border-white/[0.06]">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';
import { GraduationCap, ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
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
            <h1 className="text-5xl font-black text-white tracking-tight mb-4">Privacy Policy</h1>
          </div>
          
          <div className="space-y-8 text-gray-400 bg-white/[0.02] border border-white/[0.07] rounded-2xl p-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
            <p>We collect information you provide directly to us, including:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Account information (name, email, password)</li>
              <li>Generated test content and study materials</li>
              <li>Usage data and preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Provide, maintain, and improve our services</li>
              <li>Generate personalized test content</li>
              <li>Send you technical notices and support messages</li>
              <li>Monitor and analyze trends and usage</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal 
              information against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to provide our services 
              and fulfill the purposes outlined in this privacy policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at{' '}
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

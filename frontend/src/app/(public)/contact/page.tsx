import Link from 'next/link';
import { Mail, Phone, Globe, Linkedin, Github, User, GraduationCap, ArrowLeft } from 'lucide-react';

export default function ContactPage() {
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
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">Get in Touch</p>
            <h1 className="text-5xl font-black text-white tracking-tight mb-4">Contact Us</h1>
            <p className="text-gray-400 text-lg">
              Have questions or need support? Feel free to reach out to us.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-4 p-6 bg-white/[0.02] border border-white/[0.07] rounded-2xl hover:bg-white/[0.04] hover:border-white/[0.12] transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Name</h3>
                <p className="text-gray-400">Maruri Sai Rama Linga Reddy</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 bg-white/[0.02] border border-white/[0.07] rounded-2xl hover:bg-white/[0.04] hover:border-white/[0.12] transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Email</h3>
                <a 
                  href="mailto:sairam.maruri@gmail.com"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  sairam.maruri@gmail.com
                </a>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 bg-white/[0.02] border border-white/[0.07] rounded-2xl hover:bg-white/[0.04] hover:border-white/[0.12] transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Phone</h3>
                <a 
                  href="tel:+917893865644"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  +91 78938 65644
                </a>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 bg-white/[0.02] border border-white/[0.07] rounded-2xl hover:bg-white/[0.04] hover:border-white/[0.12] transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                <Globe className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Portfolio</h3>
                <a 
                  href="https://saiii.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  saiii.in
                </a>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 bg-white/[0.02] border border-white/[0.07] rounded-2xl hover:bg-white/[0.04] hover:border-white/[0.12] transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                <Linkedin className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">LinkedIn</h3>
                <a 
                  href="https://linkedin.com/in/sairam-maruri/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  linkedin.com/in/sairam-maruri/
                </a>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 bg-white/[0.02] border border-white/[0.07] rounded-2xl hover:bg-white/[0.04] hover:border-white/[0.12] transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                <Github className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">GitHub</h3>
                <a 
                  href="https://github.com/sairam3824"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  github.com/sairam3824
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-blue-500/[0.08] border border-blue-500/30 rounded-2xl">
            <h2 className="text-lg font-semibold text-white mb-2">Business Hours</h2>
            <p className="text-gray-400">
              We typically respond to inquiries within 24-48 hours during business days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

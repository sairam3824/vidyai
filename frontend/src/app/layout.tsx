import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Vidyai — AI-Powered Learning',
    template: '%s | Vidyai',
  },
  description:
    'Practice CBSE Class 10 with AI-generated tests personalised to each chapter. Instant feedback, detailed explanations, track your progress.',
  keywords: ['CBSE', 'Class 10', 'MCQ', 'AI tutor', 'practice tests', 'education'],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  )
}

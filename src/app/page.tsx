import Link from 'next/link'
import { BookOpen, Brain, Zap, Target, BarChart3, Calendar, CheckCircle, ChevronRight, Star, ArrowRight } from 'lucide-react'

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-[var(--primary)]">
            <BookOpen className="h-6 w-6" />
            <span>StudySnap AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors hidden sm:block">
              Sign in
            </Link>
            <Link href="/signup" className="inline-flex items-center gap-1.5 bg-[var(--primary)] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[var(--primary-dark)] transition-colors">
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[var(--primary)]/10 text-[var(--primary)] text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Star className="h-4 w-4 fill-current" />
            AI-Powered Study Companion
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--foreground)] leading-tight mb-6">
            Study smarter.<br />
            <span className="text-[var(--primary)]">Not harder.</span>
          </h1>
          <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto mb-8 leading-relaxed">
            Upload your notes and let StudySnap AI turn them into summaries, quizzes, flashcards, study plans, and personalized learning — all powered by AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className="inline-flex items-center justify-center gap-2 bg-[var(--primary)] text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-[var(--primary-dark)] transition-colors text-base">
              Start Studying Free <ArrowRight className="h-5 w-5" />
            </Link>
            <a href="#how-it-works" className="inline-flex items-center justify-center gap-2 border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] font-medium px-8 py-3.5 rounded-xl hover:bg-[var(--muted)] transition-colors text-base">
              See How It Works
            </a>
          </div>
          <p className="text-sm text-[var(--muted-foreground)] mt-4">Free to start · No credit card required</p>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-4 bg-[var(--card)] border-y border-[var(--border)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[var(--foreground)] mb-3">How StudySnap works</h2>
            <p className="text-[var(--muted-foreground)]">From notes to mastery in four steps</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', icon: <BookOpen className="h-6 w-6" />, title: 'Upload Notes', desc: 'PDF, images, or text — we handle all formats including handwritten notes via OCR.' },
              { step: '02', icon: <Brain className="h-6 w-6" />, title: 'AI Understands', desc: 'StudySnap reads and indexes your material, creating a searchable knowledge base.' },
              { step: '03', icon: <Zap className="h-6 w-6" />, title: 'Study Tools Created', desc: 'Summaries, quizzes, and flashcards generated instantly from your actual notes.' },
              { step: '04', icon: <Target className="h-6 w-6" />, title: 'Track & Improve', desc: 'Weak topics detected. Smart revisions. Exam planner. You progress every day.' },
            ].map((item) => (
              <div key={item.step} className="relative bg-[var(--background)] rounded-xl p-6 border border-[var(--border)]">
                <div className="text-xs font-bold text-[var(--primary)] mb-3 opacity-60">{item.step}</div>
                <div className="text-[var(--primary)] mb-3">{item.icon}</div>
                <h3 className="font-semibold text-[var(--foreground)] mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[var(--foreground)] mb-3">Everything you need to ace your exams</h2>
            <p className="text-[var(--muted-foreground)]">A complete study system, not just another PDF tool</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: <Brain className="h-5 w-5" />, title: 'AI Summaries', desc: 'Quick, detailed, or exam-focused summaries from your notes in seconds.' },
              { icon: <CheckCircle className="h-5 w-5" />, title: 'Smart Quizzes', desc: 'MCQ, True/False, Fill-in-the-blank — generated from your actual material.' },
              { icon: <Zap className="h-5 w-5" />, title: 'Flashcards', desc: 'Spaced repetition flashcards to move concepts into long-term memory.' },
              { icon: <Target className="h-5 w-5" />, title: 'AI Tutor', desc: 'Ask anything. Get answers grounded in your notes. In English, Tamil, or Hindi.' },
              { icon: <BarChart3 className="h-5 w-5" />, title: 'Progress Tracking', desc: 'Weak topics detected automatically. See exactly where to improve.' },
              { icon: <Calendar className="h-5 w-5" />, title: 'Exam Planner', desc: 'AI creates a day-by-day study plan based on your exam date and syllabus.' },
            ].map((f) => (
              <div key={f.title} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 hover:border-[var(--primary)] transition-colors">
                <div className="text-[var(--primary)] mb-3">{f.icon}</div>
                <h3 className="font-semibold text-[var(--foreground)] mb-2">{f.title}</h3>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-[var(--primary)]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to study smarter?</h2>
          <p className="text-white/80 mb-8">Join thousands of students turning their notes into exam success.</p>
          <Link href="/signup" className="inline-flex items-center gap-2 bg-white text-[var(--primary)] font-semibold px-8 py-3.5 rounded-xl hover:bg-gray-50 transition-colors">
            Start for Free <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-[var(--primary)]">
            <BookOpen className="h-5 w-5" />
            <span>StudySnap AI</span>
          </div>
          <p className="text-sm text-[var(--muted-foreground)]">© 2024 StudySnap AI. Built for students.</p>
          <div className="flex gap-4 text-sm text-[var(--muted-foreground)]">
            <Link href="/login" className="hover:text-[var(--foreground)] transition-colors">Sign In</Link>
            <Link href="/signup" className="hover:text-[var(--foreground)] transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

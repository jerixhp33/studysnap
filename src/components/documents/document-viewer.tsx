'use client'
import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ChevronLeft, Sparkles, HelpCircle, Zap, Brain, FileText, RefreshCw, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import type { Summary } from '@/types'

// Lazy-load OCR — Tesseract is large, only needed for image docs
const OCRProcessor = dynamic(
  () => import('./ocr-processor').then(m => m.OCRProcessor),
  { ssr: false }
)

interface Doc {
  id: string; name: string; file_type: string; file_path: string
  page_count: number | null; status: string
  extracted_text: string | null
  subjects?: { name: string; color: string } | null
}

interface DocViewerProps {
  doc: Doc
  summaries: Summary[]
  subjects: { id: string; name: string; color: string }[]
  defaultTab: string
}

const TABS = [
  { id: 'overview',   label: 'Overview',   icon: FileText  },
  { id: 'summary',    label: 'Summary',    icon: Sparkles  },
  { id: 'quiz',       label: 'Quiz',       icon: HelpCircle },
  { id: 'flashcards', label: 'Flashcards', icon: Zap       },
  { id: 'tutor',      label: 'Ask AI',     icon: Brain     },
]

export function DocumentViewer({ doc, summaries, defaultTab }: DocViewerProps) {
  const [tab, setTab] = useState(defaultTab)
  const [summary, setSummary] = useState<Summary | null>(summaries[0] ?? null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryType, setSummaryType] = useState<'quick' | 'detailed' | 'exam'>('detailed')
  const [ocrText, setOcrText] = useState<string | null>(doc.extracted_text)
  const { toast } = useToast()

  async function generateSummary() {
    setSummaryLoading(true)
    try {
      const res = await fetch('/api/ai/summary', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: doc.id, summary_type: summaryType, language: 'english', difficulty: 'college' }),
      })
      const { data, error } = await res.json()
      if (error) throw new Error(error)
      setSummary(data)
      toast({ type: 'success', title: 'Summary ready!' })
    } catch (e) {
      toast({ type: 'error', title: 'Failed', description: e instanceof Error ? e.message : 'Try again' })
    } finally { setSummaryLoading(false) }
  }

  const effectiveText = ocrText ?? doc.extracted_text

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/dashboard/notes" className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors shrink-0 mt-0.5">
          <ChevronLeft className="h-5 w-5 text-[var(--muted-foreground)]" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-[var(--foreground)] truncate">{doc.name}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-[var(--muted-foreground)]">
            {doc.subjects && <span>{doc.subjects.name}</span>}
            {doc.page_count && <span>{doc.page_count} pages</span>}
            <span className="capitalize">{doc.file_type}</span>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex overflow-x-auto gap-1 bg-[var(--muted)] rounded-xl p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
              tab === id
                ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'overview' && (
        <div className="space-y-4">
          {/* OCR banner for image documents without text */}
          {doc.file_type === 'image' && !ocrText && doc.status === 'ready' && (
            <OCRProcessor documentId={doc.id} filePath={doc.file_path} onComplete={setOcrText} />
          )}

          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
            <h2 className="font-semibold text-[var(--foreground)] mb-3">Document Preview</h2>
            {doc.status !== 'ready' ? (
              <p className="text-sm text-[var(--muted-foreground)]">Document is still being processed…</p>
            ) : effectiveText ? (
              <div className="max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap font-sans text-sm text-[var(--foreground)] leading-relaxed">
                  {effectiveText.slice(0, 3000)}
                  {effectiveText.length > 3000 ? '\n\n[…truncated for preview…]' : ''}
                </pre>
              </div>
            ) : (
              <p className="text-sm text-[var(--muted-foreground)]">No text preview available</p>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Generate Summary', icon: Sparkles,   onClick: () => setTab('summary'),    color: 'text-[var(--primary)]'  },
              { label: 'Take Quiz',        icon: HelpCircle, onClick: () => setTab('quiz'),        color: 'text-[var(--success)]'  },
              { label: 'Make Flashcards',  icon: Zap,        onClick: () => setTab('flashcards'),  color: 'text-[var(--warning)]'  },
              { label: 'Ask AI',           icon: Brain,      onClick: () => setTab('tutor'),       color: 'text-[var(--info)]'     },
            ].map(({ label, icon: Icon, onClick, color }) => (
              <button key={label} onClick={onClick}
                className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 flex flex-col items-center gap-2 hover:border-[var(--primary)] transition-colors">
                <Icon className={`h-6 w-6 ${color}`} />
                <span className="text-xs font-medium text-[var(--foreground)] text-center">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Summary ── */}
      {tab === 'summary' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <select value={summaryType} onChange={e => setSummaryType(e.target.value as typeof summaryType)}
              className="h-9 px-3 rounded-lg border border-[var(--input)] bg-[var(--card)] text-sm focus-visible:outline-none">
              <option value="quick">Quick Summary</option>
              <option value="detailed">Detailed Summary</option>
              <option value="exam">Exam Notes</option>
            </select>
            <button onClick={generateSummary} disabled={summaryLoading}
              className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-60">
              {summaryLoading
                ? <><Loader2 className="h-4 w-4 animate-spin" />Generating…</>
                : <><RefreshCw className="h-4 w-4" />{summary ? 'Regenerate' : 'Generate Summary'}</>}
            </button>
          </div>

          {summaryLoading && (
            <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)] mx-auto mb-3" />
              <p className="text-sm font-medium text-[var(--foreground)]">Reading your notes…</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">Understanding the topics…</p>
            </div>
          )}

          {summary && !summaryLoading && (
            <div className="space-y-4">
              <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
                <h2 className="text-lg font-bold text-[var(--foreground)] mb-2">{summary.title}</h2>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{summary.overview}</p>
              </div>
              {summary.key_points?.length > 0 && (
                <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
                  <h3 className="font-semibold text-[var(--foreground)] mb-3">🎯 Key Points</h3>
                  <ul className="space-y-2">
                    {summary.key_points.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
                        <span className="text-[var(--primary)] font-bold shrink-0 mt-0.5">•</span>{p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {summary.definitions?.length > 0 && (
                <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
                  <h3 className="font-semibold text-[var(--foreground)] mb-3">📖 Key Definitions</h3>
                  <div className="space-y-3">
                    {summary.definitions.map((d, i) => (
                      <div key={i} className="border-l-2 border-[var(--primary)] pl-3">
                        <p className="text-sm font-semibold text-[var(--foreground)]">{d.term}</p>
                        <p className="text-sm text-[var(--muted-foreground)] mt-0.5">{d.definition}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {summary.exam_tips?.length > 0 && (
                <div className="bg-[var(--warning-bg)] rounded-xl border border-[var(--warning)]/20 p-5">
                  <h3 className="font-semibold text-[var(--warning)] mb-3">⚡ Exam Tips</h3>
                  <ul className="space-y-2">
                    {summary.exam_tips.map((t, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
                        <span className="text-[var(--warning)] shrink-0 mt-0.5">→</span>{t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!summary && !summaryLoading && (
            <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-10 text-center">
              <Sparkles className="h-10 w-10 text-[var(--muted-foreground)] mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium text-[var(--foreground)] mb-1">No summary yet</p>
              <p className="text-xs text-[var(--muted-foreground)]">Click &quot;Generate Summary&quot; to create one</p>
            </div>
          )}
        </div>
      )}

      {tab === 'quiz'       && <QuizTab       documentId={doc.id} />}
      {tab === 'flashcards' && <FlashcardsTab documentId={doc.id} />}
      {tab === 'tutor'      && <TutorTab      documentId={doc.id} documentName={doc.name} />}
    </div>
  )
}

/* ── Inline Quiz ─────────────────────────────────────────── */
function QuizTab({ documentId }: { documentId: string }) {
  const [loading, setLoading] = useState(false)
  const [count, setCount] = useState(10)
  const [difficulty, setDifficulty] = useState('medium')
  const [quizData, setQuizData] = useState<{
    questions: { id: string; question: string; options: string[] | null; correct_answer: string; explanation: string; question_type: string }[]
  } | null>(null)
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [answers, setAnswers] = useState<{ correct: boolean }[]>([])
  const [showExp, setShowExp] = useState(false)
  const [done, setDone] = useState(false)
  const [fillInput, setFillInput] = useState('')
  const { toast } = useToast()

  async function generateQuiz() {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/quiz', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: documentId, question_count: count, difficulty, question_types: ['mcq', 'true_false'], language: 'english' }),
      })
      const { data, error } = await res.json()
      if (error) throw new Error(error)
      setQuizData(data); setCurrentQ(0); setSelected(null); setAnswers([]); setShowExp(false); setDone(false); setFillInput('')
    } catch (e) { toast({ type: 'error', title: 'Quiz failed', description: e instanceof Error ? e.message : 'Try again' }) }
    finally { setLoading(false) }
  }

  function handleAnswer(ans: string) {
    if (selected) return
    setSelected(ans); setShowExp(true)
    const q = quizData!.questions[currentQ]
    const correct = ans.toLowerCase().trim() === q.correct_answer.toLowerCase().trim()
    setAnswers(prev => [...prev, { correct }])
  }

  function next() {
    if (currentQ + 1 >= quizData!.questions.length) { setDone(true); return }
    setCurrentQ(c => c + 1); setSelected(null); setShowExp(false); setFillInput('')
  }

  if (done && quizData) {
    const correctCount = answers.filter(a => a.correct).length
    const total = quizData.questions.length
    const pct = Math.round((correctCount / total) * 100)
    return (
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6 text-center space-y-4">
        <div className="text-5xl">{pct >= 80 ? '🏆' : pct >= 60 ? '⭐' : '📚'}</div>
        <h2 className="text-2xl font-bold text-[var(--foreground)]">{pct}%</h2>
        <p className="text-[var(--muted-foreground)]">{correctCount}/{total} correct</p>
        <button onClick={generateQuiz} className="w-full h-11 bg-[var(--primary)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--primary-dark)] transition-colors">
          Try Another Quiz
        </button>
      </div>
    )
  }

  if (quizData) {
    const q = quizData.questions[currentQ]
    const opts = q.options ?? (q.question_type === 'true_false' ? ['True', 'False'] : [])
    const isCorrect = selected && selected.toLowerCase().trim() === q.correct_answer.toLowerCase().trim()
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-[var(--muted-foreground)]">
          <span>Question {currentQ + 1}/{quizData.questions.length}</span>
          <span>{answers.filter(a => a.correct).length} correct</span>
        </div>
        <div className="h-1.5 bg-[var(--muted)] rounded-full">
          <div className="h-full bg-[var(--primary)] rounded-full transition-all" style={{ width: `${(currentQ / quizData.questions.length) * 100}%` }} />
        </div>
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
          <p className="font-medium text-[var(--foreground)] mb-4 leading-relaxed">{q.question}</p>
          <div className="space-y-2">
            {opts.length > 0 ? opts.map((opt, i) => {
              const letter = 'ABCD'[i] ?? String(i + 1)
              const isRight = opt.toLowerCase().trim() === q.correct_answer.toLowerCase().trim()
              const isSelected = selected === opt
              let cls = 'border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)]'
              if (selected) cls = isRight ? 'border-[var(--success)] bg-[var(--success-bg)]' : isSelected ? 'border-[var(--error)] bg-[var(--error-bg)]' : 'border-[var(--border)] opacity-50'
              return (
                <button key={i} onClick={() => handleAnswer(opt)} disabled={!!selected}
                  className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-xl border-2 transition-all ${cls}`}>
                  <span className="shrink-0 w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold">{letter}</span>
                  <span className="text-sm text-[var(--foreground)]">{opt}</span>
                </button>
              )
            }) : (
              <div className="flex gap-2">
                <input value={fillInput} onChange={e => setFillInput(e.target.value)} disabled={!!selected}
                  placeholder="Your answer…"
                  className="flex-1 h-10 px-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                  onKeyDown={e => e.key === 'Enter' && fillInput.trim() && handleAnswer(fillInput.trim())} />
                {!selected && <button onClick={() => fillInput.trim() && handleAnswer(fillInput.trim())} className="px-4 bg-[var(--primary)] text-white rounded-lg text-sm font-medium">Submit</button>}
              </div>
            )}
          </div>
          {showExp && (
            <div className={`mt-4 p-4 rounded-xl ${isCorrect ? 'bg-[var(--success-bg)]' : 'bg-[var(--error-bg)]'}`}>
              <p className={`text-sm font-semibold mb-1 ${isCorrect ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
                {isCorrect ? '✓ Correct!' : `✗ Answer: ${q.correct_answer}`}
              </p>
              <p className="text-sm text-[var(--foreground)]">{q.explanation}</p>
            </div>
          )}
        </div>
        {selected && (
          <button onClick={next} className="w-full h-11 bg-[var(--primary)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--primary-dark)] transition-colors">
            {currentQ + 1 >= quizData.questions.length ? 'See Results' : 'Next →'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5 space-y-4">
      <h3 className="font-semibold text-[var(--foreground)]">Quiz Settings</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Questions</label>
          <select value={count} onChange={e => setCount(+e.target.value)} className="w-full h-10 px-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none">
            {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Difficulty</label>
          <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none">
            <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
          </select>
        </div>
      </div>
      <button onClick={generateQuiz} disabled={loading}
        className="w-full h-11 bg-[var(--primary)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Generating Quiz…</> : 'Generate Quiz'}
      </button>
    </div>
  )
}

/* ── Inline Flashcards ───────────────────────────────────── */
function FlashcardsTab({ documentId }: { documentId: string }) {
  const [loading, setLoading] = useState(false)
  const [cards, setCards] = useState<{ id: string; front: string; back: string; topic: string }[]>([])
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [count, setCount] = useState(15)
  const { toast } = useToast()

  async function generateCards() {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/flashcards', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: documentId, card_count: count, difficulty: 'medium', language: 'english' }),
      })
      const { data, error } = await res.json()
      if (error) throw new Error(error)
      setCards(data); setCurrent(0); setFlipped(false)
    } catch (e) { toast({ type: 'error', title: 'Failed', description: e instanceof Error ? e.message : 'Try again' }) }
    finally { setLoading(false) }
  }

  async function handleConfidence(conf: string) {
    const card = cards[current]
    await fetch('/api/flashcards/review', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flashcard_id: card.id, confidence: conf }),
    })
    if (current + 1 >= cards.length) { toast({ type: 'success', title: 'Session complete! 🎉' }); setCards([]); setCurrent(0) }
    else { setCurrent(c => c + 1); setFlipped(false) }
  }

  if (cards.length > 0) {
    const card = cards[current]
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-[var(--muted-foreground)]">
          <span>Card {current + 1} of {cards.length}</span>
          {card.topic && <span className="bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded-full text-xs">{card.topic}</span>}
        </div>
        <div className="flashcard-container h-64 cursor-pointer select-none" onClick={() => setFlipped(!flipped)}>
          <div className={`flashcard-inner ${flipped ? 'flipped' : ''}`}>
            <div className="flashcard-front bg-[var(--card)] border-2 border-[var(--border)] rounded-2xl flex items-center justify-center p-6">
              <div className="text-center">
                <p className="text-xs text-[var(--muted-foreground)] mb-3 uppercase tracking-wider">Question</p>
                <p className="text-base font-medium text-[var(--foreground)] leading-relaxed">{card.front}</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-4">Tap to reveal</p>
              </div>
            </div>
            <div className="flashcard-back bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] rounded-2xl flex items-center justify-center p-6">
              <div className="text-center">
                <p className="text-xs text-white/60 mb-3 uppercase tracking-wider">Answer</p>
                <p className="text-base font-medium text-white leading-relaxed">{card.back}</p>
              </div>
            </div>
          </div>
        </div>
        {flipped && (
          <div className="grid grid-cols-4 gap-2">
            {[
              { c: 'again', l: 'Again', cl: 'bg-[var(--error-bg)] text-[var(--error)] border-[var(--error)]/20' },
              { c: 'hard',  l: 'Hard',  cl: 'bg-[var(--warning-bg)] text-[var(--warning)] border-[var(--warning)]/20' },
              { c: 'good',  l: 'Good',  cl: 'bg-[var(--info-bg)] text-[var(--info)] border-[var(--info)]/20' },
              { c: 'easy',  l: 'Easy',  cl: 'bg-[var(--success-bg)] text-[var(--success)] border-[var(--success)]/20' },
            ].map(b => (
              <button key={b.c} onClick={() => handleConfidence(b.c)}
                className={`h-12 rounded-xl border-2 font-semibold text-sm transition-all hover:scale-105 active:scale-95 ${b.cl}`}>
                {b.l}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5 space-y-4">
      <h3 className="font-semibold text-[var(--foreground)]">Generate Flashcards</h3>
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Number of cards</label>
        <select value={count} onChange={e => setCount(+e.target.value)} className="w-full h-10 px-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none">
          {[10, 15, 20, 30].map(n => <option key={n} value={n}>{n} cards</option>)}
        </select>
      </div>
      <button onClick={generateCards} disabled={loading}
        className="w-full h-11 bg-[var(--primary)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Creating Flashcards…</> : 'Generate Flashcards'}
      </button>
    </div>
  )
}

/* ── Inline Tutor ────────────────────────────────────────── */
function TutorTab({ documentId, documentName }: { documentId: string; documentName: string }) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return
    const question = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: question }])
    setLoading(true)
    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, document_id: documentId, learning_level: 'college', language: 'english', conversation_history: messages }),
      })
      const { data, error } = await res.json()
      if (error) throw new Error(error)
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }])
    } catch (e) {
      toast({ type: 'error', title: 'Error', description: e instanceof Error ? e.message : 'Failed' })
    } finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 min-h-64 max-h-96 overflow-y-auto space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Brain className="h-10 w-10 text-[var(--muted-foreground)] mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium text-[var(--foreground)]">Ask me anything about {documentName}</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">I&apos;ll answer from your notes</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              m.role === 'user'
                ? 'bg-[var(--primary)] text-white rounded-br-sm'
                : 'bg-[var(--muted)] text-[var(--foreground)] rounded-bl-sm'
            }`}>
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[var(--muted)] rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 75, 150].map(d => (
                  <span key={d} className="h-2 w-2 bg-[var(--muted-foreground)] rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2 flex-wrap">
        {['Explain the main concept', 'Give me an example', 'Summarize in 3 points', 'Create a 5-mark answer'].map(s => (
          <button key={s} onClick={() => setInput(s)}
            className="text-xs bg-[var(--muted)] text-[var(--muted-foreground)] px-3 py-1.5 rounded-full hover:bg-[var(--primary)]/10 hover:text-[var(--primary)] transition-colors">
            {s}
          </button>
        ))}
      </div>
      <form onSubmit={sendMessage} className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} disabled={loading}
          placeholder="Ask a question about your notes…"
          className="flex-1 h-11 px-4 rounded-xl border border-[var(--input)] bg-[var(--card)] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] disabled:opacity-60" />
        <button type="submit" disabled={loading || !input.trim()}
          className="px-4 bg-[var(--primary)] text-white rounded-xl font-medium text-sm hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-60">
          Send
        </button>
      </form>
    </div>
  )
}

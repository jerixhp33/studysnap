'use client'
import { useState } from 'react'
import { CheckCircle, XCircle, TrendingUp, Loader2, RotateCcw } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

interface Props {
  documents: { id: string; name: string; subject_id: string | null }[]
  subjects: { id: string; name: string }[]
}

interface EvalResult {
  score: number; max_score: number
  strengths: string[]; missing_concepts: string[]
  suggestions: string[]; improved_answer: string
}

const MARK_OPTIONS = [2, 5, 10] as const

export function EvaluatorClient({ documents, subjects }: Props) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [marks, setMarks] = useState<2 | 5 | 10>(5)
  const [docId, setDocId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<EvalResult | null>(null)
  const { toast } = useToast()

  async function evaluate(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim() || !answer.trim()) {
      toast({ type: 'error', title: 'Fill in question and answer' })
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/ai/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, student_answer: answer, marks, document_id: docId || undefined }),
      })
      const { data, error } = await res.json()
      if (error) throw new Error(error)
      setResult(data)
    } catch (err) {
      toast({ type: 'error', title: 'Evaluation failed', description: err instanceof Error ? err.message : 'Try again' })
    } finally {
      setLoading(false)
    }
  }

  function reset() { setResult(null); setAnswer(''); setQuestion('') }

  const pct = result ? Math.round((result.score / result.max_score) * 100) : 0

  return (
    <div className="space-y-5">
      {/* Input form */}
      {!result && (
        <form onSubmit={evaluate} className="space-y-4 bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
          {/* Document selector */}
          {documents.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Reference Document <span className="text-[var(--muted-foreground)] font-normal">(optional — improves accuracy)</span>
              </label>
              <select
                value={docId} onChange={e => setDocId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              >
                <option value="">No reference — use general knowledge</option>
                {documents.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          )}

          {/* Marks */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Marks</label>
            <div className="flex gap-2">
              {MARK_OPTIONS.map(m => (
                <button
                  key={m} type="button" onClick={() => setMarks(m)}
                  className={`flex-1 h-10 rounded-xl border-2 font-semibold text-sm transition-colors ${
                    marks === m
                      ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                      : 'border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/50'
                  }`}
                >
                  {m} marks
                </button>
              ))}
            </div>
          </div>

          {/* Question */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Question</label>
            <textarea
              required value={question} onChange={e => setQuestion(e.target.value)}
              rows={2} placeholder="e.g. Explain deadlock and its prevention methods."
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] resize-none leading-relaxed"
            />
          </div>

          {/* Answer */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Your Answer</label>
            <textarea
              required value={answer} onChange={e => setAnswer(e.target.value)}
              rows={8} placeholder="Write your answer here..."
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] resize-none leading-relaxed"
            />
            <p className="text-xs text-[var(--muted-foreground)] mt-1">{answer.length} characters</p>
          </div>

          <button
            type="submit" disabled={loading || !question.trim() || !answer.trim()}
            className="w-full h-11 bg-[var(--primary)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin" />Evaluating your answer...</>
              : 'Evaluate My Answer'}
          </button>
        </form>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Score card */}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6 text-center">
            <div className={`inline-flex items-center justify-center h-20 w-20 rounded-full text-2xl font-bold mb-3 ${
              pct >= 80 ? 'bg-[var(--success-bg)] text-[var(--success)]' :
              pct >= 60 ? 'bg-[var(--warning-bg)] text-[var(--warning)]' :
              'bg-[var(--error-bg)] text-[var(--error)]'
            }`}>
              {result.score}/{result.max_score}
            </div>
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              {pct >= 80 ? '🏆 Excellent!' : pct >= 60 ? '⭐ Good effort!' : '📚 Keep practising'}
            </h2>
            <p className="text-[var(--muted-foreground)] text-sm mt-1">{pct}% — {result.score} out of {result.max_score} marks</p>
            <div className="mt-3 h-2.5 bg-[var(--muted)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  backgroundColor: pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--error)',
                }}
              />
            </div>
          </div>

          {/* Strengths */}
          {result.strengths.length > 0 && (
            <div className="bg-[var(--success-bg)] border border-[var(--success)]/20 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-[var(--success)]" />
                <h3 className="font-semibold text-[var(--foreground)]">What you got right</h3>
              </div>
              <ul className="space-y-1.5">
                {result.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
                    <span className="text-[var(--success)] mt-0.5 shrink-0">✓</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing concepts */}
          {result.missing_concepts.length > 0 && (
            <div className="bg-[var(--error-bg)] border border-[var(--error)]/20 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="h-5 w-5 text-[var(--error)]" />
                <h3 className="font-semibold text-[var(--foreground)]">Missing concepts</h3>
              </div>
              <ul className="space-y-1.5">
                {result.missing_concepts.map((m, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
                    <span className="text-[var(--error)] mt-0.5 shrink-0">✗</span> {m}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {result.suggestions.length > 0 && (
            <div className="bg-[var(--warning-bg)] border border-[var(--warning)]/20 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-[var(--warning)]" />
                <h3 className="font-semibold text-[var(--foreground)]">How to improve</h3>
              </div>
              <ul className="space-y-1.5">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
                    <span className="text-[var(--warning)] mt-0.5 shrink-0">→</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Model answer */}
          {result.improved_answer && (
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
              <h3 className="font-semibold text-[var(--foreground)] mb-3">📝 Model Answer</h3>
              <div className="prose-study text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap bg-[var(--muted)] rounded-lg p-4">
                {result.improved_answer}
              </div>
            </div>
          )}

          <button
            onClick={reset}
            className="w-full h-11 flex items-center justify-center gap-2 border border-[var(--border)] text-[var(--foreground)] rounded-xl text-sm font-medium hover:bg-[var(--muted)] transition-colors"
          >
            <RotateCcw className="h-4 w-4" /> Evaluate Another Answer
          </button>
        </div>
      )}
    </div>
  )
}

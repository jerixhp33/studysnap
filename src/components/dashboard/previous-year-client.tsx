'use client'
import { useState } from 'react'
import { Upload, Loader2, TrendingUp, AlertCircle, BookOpen } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

interface Subject { id: string; name: string; color: string }
interface Analysis {
  frequent_topics: { topic: string; frequency: number; marks?: number }[]
  question_styles: string[]
  important_units: string[]
  exam_strategy: string
  practice_questions: string[]
}

export function PreviousYearClient({ subjects }: { subjects: Subject[] }) {
  const [file, setFile] = useState<File | null>(null)
  const [subjectId, setSubjectId] = useState('')
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [error, setError] = useState('')
  const { toast } = useToast()

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!['application/pdf', 'image/png', 'image/jpeg', 'image/webp'].includes(f.type)) {
      setError('Please upload a PDF or image file'); return
    }
    if (f.size > 20 * 1024 * 1024) { setError('File too large (max 20MB)'); return }
    setFile(f); setError(''); setAnalysis(null)
  }

  async function analyse() {
    if (!file) { toast({ type: 'error', title: 'Select a file first' }); return }
    setLoading(true); setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      if (subjectId) form.append('subject_id', subjectId)

      const res = await fetch('/api/ai/analyse-paper', { method: 'POST', body: form })
      const { data, error: err } = await res.json()
      if (err) throw new Error(err)
      setAnalysis(data)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Analysis failed'
      setError(msg)
      toast({ type: 'error', title: 'Analysis failed', description: msg })
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-5">
      {/* Upload card */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5 space-y-4">
        <h2 className="font-semibold text-[var(--foreground)]">Upload Previous Year Paper</h2>

        {/* File picker */}
        <label className={`flex flex-col items-center gap-3 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors ${file ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-[var(--border)] hover:border-[var(--primary)]'}`}>
          <Upload className="h-8 w-8 text-[var(--muted-foreground)]" />
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--foreground)]">
              {file ? file.name : 'Drop PDF or image here'}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">PDF, PNG, JPG · Max 20MB</p>
          </div>
          <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={handleFile} className="hidden" />
        </label>

        {subjects.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Subject (optional)</label>
            <select value={subjectId} onChange={e => setSubjectId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]">
              <option value="">No subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 bg-[var(--error-bg)] text-[var(--error)] px-3 py-2 rounded-lg text-sm">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{error}
          </div>
        )}

        <button onClick={analyse} disabled={!file || loading}
          className="w-full h-11 bg-[var(--primary)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          {loading
            ? <><Loader2 className="h-4 w-4 animate-spin" />Analysing paper…</>
            : 'Analyse Paper'}
        </button>

        <p className="text-xs text-[var(--muted-foreground)] text-center">
          ⚠️ Analysis identifies patterns in past papers. It does not guarantee what will appear in future exams.
        </p>
      </div>

      {/* Results */}
      {analysis && (
        <div className="space-y-4">
          {/* Frequent topics */}
          {analysis.frequent_topics.length > 0 && (
            <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-[var(--primary)]" />
                <h2 className="font-semibold text-[var(--foreground)]">Frequently Appearing Topics</h2>
              </div>
              <div className="space-y-3">
                {analysis.frequent_topics.map((t, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-[var(--foreground)]">{t.topic}</span>
                      <span className="text-[var(--muted-foreground)]">
                        {t.frequency}× {t.marks ? `· ${t.marks} marks` : ''}
                      </span>
                    </div>
                    <div className="h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--primary)] rounded-full"
                        style={{ width: `${Math.min(100, (t.frequency / (analysis.frequent_topics[0]?.frequency ?? 1)) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Important units */}
          {analysis.important_units.length > 0 && (
            <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-5 w-5 text-[var(--warning)]" />
                <h2 className="font-semibold text-[var(--foreground)]">High-Weight Units</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysis.important_units.map((u, i) => (
                  <span key={i} className="bg-[var(--warning-bg)] text-[var(--warning)] text-sm font-medium px-3 py-1 rounded-full">
                    {u}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Question styles */}
          {analysis.question_styles.length > 0 && (
            <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
              <h2 className="font-semibold text-[var(--foreground)] mb-3">Question Styles Observed</h2>
              <ul className="space-y-1.5">
                {analysis.question_styles.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
                    <span className="text-[var(--primary)] mt-0.5 shrink-0">•</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Strategy */}
          {analysis.exam_strategy && (
            <div className="bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-xl p-5">
              <h2 className="font-semibold text-[var(--primary)] mb-2">📋 Recommended Exam Strategy</h2>
              <p className="text-sm text-[var(--foreground)] leading-relaxed">{analysis.exam_strategy}</p>
            </div>
          )}

          {/* Practice questions */}
          {analysis.practice_questions.length > 0 && (
            <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
              <h2 className="font-semibold text-[var(--foreground)] mb-3">📝 Likely Practice Questions</h2>
              <ol className="space-y-2">
                {analysis.practice_questions.map((q, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-[var(--foreground)]">
                    <span className="text-[var(--muted-foreground)] font-semibold shrink-0 w-5">{i + 1}.</span>{q}
                  </li>
                ))}
              </ol>
              <p className="text-xs text-[var(--muted-foreground)] mt-4 italic">
                Based on patterns in the uploaded paper. These are practice suggestions, not guaranteed exam questions.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

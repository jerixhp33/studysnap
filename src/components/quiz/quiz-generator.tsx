'use client'
import { useState } from 'react'
import { HelpCircle, Loader2, Trophy, Clock } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { formatDate } from '@/lib/utils'

interface Props {
  documents: { id: string; name: string; subject_id: string | null }[]
  subjects: { id: string; name: string; color: string }[]
  recentAttempts: { id: string; score: number; correct_count: number; total_questions: number; completed_at: string; quizzes: { title: string } | null }[]
  defaultDocId?: string
}

export function QuizGeneratorClient({ documents, subjects, recentAttempts, defaultDocId }: Props) {
  const [source, setSource] = useState<'document' | 'subject'>(defaultDocId ? 'document' : 'document')
  const [docId, setDocId] = useState(defaultDocId ?? '')
  const [subjectId, setSubjectId] = useState('')
  const [count, setCount] = useState(10)
  const [difficulty, setDifficulty] = useState('medium')
  const [types, setTypes] = useState(['mcq'])
  const [loading, setLoading] = useState(false)
  const [quizData, setQuizData] = useState<{ quiz: { id: string; title: string }; questions: { id: string; question: string; options: string[] | null; correct_answer: string; explanation: string; question_type: string; topic: string }[] } | null>(null)
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [showExp, setShowExp] = useState(false)
  const [answers, setAnswers] = useState<{ correct: boolean; answer: string; topic: string }[]>([])
  const [done, setDone] = useState(false)
  const [fillInput, setFillInput] = useState('')
  const { toast } = useToast()

  function toggleType(t: string) {
    setTypes(prev => prev.includes(t) ? (prev.length > 1 ? prev.filter(x => x !== t) : prev) : [...prev, t])
  }

  async function generate() {
    if (source === 'document' && !docId) { toast({ type: 'error', title: 'Select a document' }); return }
    if (source === 'subject' && !subjectId) { toast({ type: 'error', title: 'Select a subject' }); return }
    setLoading(true)
    try {
      const res = await fetch('/api/ai/quiz', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: source === 'document' ? docId : undefined, subject_id: source === 'subject' ? subjectId : undefined, question_count: count, difficulty, question_types: types, language: 'english' }),
      })
      const { data, error } = await res.json()
      if (error) throw new Error(error)
      setQuizData(data); setCurrentQ(0); setSelected(null); setShowExp(false); setAnswers([]); setDone(false); setFillInput('')
    } catch (e) { toast({ type: 'error', title: 'Quiz generation failed', description: e instanceof Error ? e.message : 'Try again' }) }
    finally { setLoading(false) }
  }

  function handleAnswer(ans: string) {
    if (selected) return
    setSelected(ans); setShowExp(true)
    const q = quizData!.questions[currentQ]
    const correct = ans.toLowerCase().trim() === q.correct_answer.toLowerCase().trim()
    setAnswers(prev => [...prev, { correct, answer: ans, topic: q.topic }])
  }

  function next() {
    if (currentQ + 1 >= quizData!.questions.length) { setDone(true); return }
    setCurrentQ(c => c + 1); setSelected(null); setShowExp(false); setFillInput('')
  }

  function reset() { setQuizData(null); setDone(false); setAnswers([]); setCurrentQ(0); setSelected(null) }

  // Results screen
  if (done && quizData) {
    const correct = answers.filter(a => a.correct).length
    const total = quizData.questions.length
    const pct = Math.round((correct / total) * 100)
    const byTopic: Record<string, { correct: number; total: number }> = {}
    answers.forEach((a, i) => {
      const t = quizData.questions[i]?.topic ?? 'General'
      if (!byTopic[t]) byTopic[t] = { correct: 0, total: 0 }
      byTopic[t].total++
      if (a.correct) byTopic[t].correct++
    })
    const emoji = pct >= 80 ? '🏆' : pct >= 60 ? '⭐' : '📚'
    const msg = pct >= 80 ? 'Excellent!' : pct >= 60 ? 'Good effort!' : 'Keep practising!'
    return (
      <div className="space-y-4">
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 text-center">
          <div className="text-5xl mb-3">{emoji}</div>
          <h2 className="text-3xl font-bold text-[var(--foreground)]">{pct}%</h2>
          <p className="text-[var(--muted-foreground)] mt-1">{correct}/{total} correct · {msg}</p>
          <div className="mt-4 h-3 bg-[var(--muted)] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--error)' }} />
          </div>
        </div>
        {Object.entries(byTopic).length > 0 && (
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
            <h3 className="font-semibold text-[var(--foreground)] mb-3">Topic Performance</h3>
            <div className="space-y-2">
              {Object.entries(byTopic).map(([topic, stats]) => {
                const p = Math.round((stats.correct / stats.total) * 100)
                return (
                  <div key={topic}>
                    <div className="flex justify-between text-sm mb-1"><span className="text-[var(--foreground)]">{topic}</span><span className={p >= 70 ? 'text-[var(--success)]' : 'text-[var(--error)]'}>{p}%</span></div>
                    <div className="h-1.5 bg-[var(--muted)] rounded-full"><div className="h-full rounded-full" style={{ width: `${p}%`, backgroundColor: p >= 70 ? 'var(--success)' : 'var(--error)' }} /></div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={reset} className="flex-1 h-11 border border-[var(--border)] rounded-xl text-sm font-medium hover:bg-[var(--muted)] transition-colors">Back</button>
          <button onClick={generate} className="flex-1 h-11 bg-[var(--primary)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--primary-dark)] transition-colors">Retry Quiz</button>
        </div>
      </div>
    )
  }

  // Active quiz
  if (quizData) {
    const q = quizData.questions[currentQ]
    const opts = q.options ?? (q.question_type === 'true_false' ? ['True', 'False'] : [])
    const isCorrect = selected && selected.toLowerCase().trim() === q.correct_answer.toLowerCase().trim()
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--muted-foreground)]">Question {currentQ + 1}/{quizData.questions.length}</span>
          <span className="text-sm text-[var(--muted-foreground)]">{answers.filter(a => a.correct).length} correct</span>
        </div>
        <div className="h-2 bg-[var(--muted)] rounded-full"><div className="h-full bg-[var(--primary)] rounded-full transition-all" style={{ width: `${(currentQ / quizData.questions.length) * 100}%` }} /></div>
        {q.topic && <span className="text-xs bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-1 rounded-full">{q.topic}</span>}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 space-y-4">
          <p className="font-medium text-[var(--foreground)] leading-relaxed text-base">{q.question}</p>
          {opts.length > 0 ? (
            <div className="space-y-2">
              {opts.map((opt, i) => {
                const letter = 'ABCD'[i] ?? String(i + 1)
                const isRight = opt.toLowerCase().trim() === q.correct_answer.toLowerCase().trim()
                const isSelected = selected === opt
                let cls = 'border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5'
                if (selected) cls = isRight ? 'border-[var(--success)] bg-[var(--success-bg)]' : isSelected ? 'border-[var(--error)] bg-[var(--error-bg)]' : 'border-[var(--border)] bg-[var(--background)] opacity-50'
                return (
                  <button key={i} onClick={() => handleAnswer(opt)} disabled={!!selected}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-xl border-2 transition-all ${cls}`}>
                    <span className="shrink-0 w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold">{letter}</span>
                    <span className="text-sm text-[var(--foreground)] leading-relaxed">{opt}</span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="flex gap-2">
              <input value={fillInput} onChange={e => setFillInput(e.target.value)} disabled={!!selected} placeholder="Type your answer..."
                className="flex-1 h-10 px-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                onKeyDown={e => e.key === 'Enter' && fillInput.trim() && handleAnswer(fillInput.trim())} />
              {!selected && <button onClick={() => fillInput.trim() && handleAnswer(fillInput.trim())} className="px-4 bg-[var(--primary)] text-white rounded-lg text-sm font-medium">Submit</button>}
            </div>
          )}
          {showExp && (
            <div className={`p-4 rounded-xl border ${isCorrect ? 'bg-[var(--success-bg)] border-[var(--success)]/20' : 'bg-[var(--error-bg)] border-[var(--error)]/20'}`}>
              <p className={`text-sm font-semibold mb-1 ${isCorrect ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>{isCorrect ? '✓ Correct!' : `✗ Answer: ${q.correct_answer}`}</p>
              <p className="text-sm text-[var(--foreground)] leading-relaxed">{q.explanation}</p>
            </div>
          )}
        </div>
        {selected && <button onClick={next} className="w-full h-11 bg-[var(--primary)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--primary-dark)] transition-colors">{currentQ + 1 >= quizData.questions.length ? 'See Results' : 'Next →'}</button>}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5 space-y-5">
        <h2 className="font-semibold text-[var(--foreground)]">Generate a Quiz</h2>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Quiz from</label>
          <div className="flex gap-2">
            {(['document', 'subject'] as const).map(s => (
              <button key={s} onClick={() => setSource(s)} className={`flex-1 h-9 rounded-lg text-sm font-medium border transition-colors capitalize ${source === s ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)]'}`}>{s}</button>
            ))}
          </div>
        </div>
        {source === 'document' ? (
          <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Select Document</label>
            <select value={docId} onChange={e => setDocId(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none">
              <option value="">Choose a document...</option>
              {documents.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        ) : (
          <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Select Subject</label>
            <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none">
              <option value="">Choose a subject...</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Questions</label>
            <select value={count} onChange={e => setCount(+e.target.value)} className="w-full h-10 px-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none">
              {[5,10,15,20,25].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Difficulty</label>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none">
              <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
            </select>
          </div>
        </div>
        <div><label className="block text-sm font-medium text-[var(--foreground)] mb-2">Question Types</label>
          <div className="flex gap-2 flex-wrap">
            {[['mcq','MCQ'],['true_false','True/False'],['fill_blank','Fill Blank'],['short_answer','Short Answer']].map(([val, label]) => (
              <button key={val} onClick={() => toggleType(val)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${types.includes(val) ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)]'}`}>{label}</button>
            ))}
          </div>
        </div>
        <button onClick={generate} disabled={loading} className="w-full h-11 bg-[var(--primary)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Generating Quiz...</> : 'Generate Quiz'}
        </button>
      </div>

      {recentAttempts.length > 0 && (
        <div>
          <h2 className="font-semibold text-[var(--foreground)] mb-3">Recent Attempts</h2>
          <div className="space-y-2">
            {recentAttempts.map(a => {
              const pct = Math.round((a.correct_count / a.total_questions) * 100)
              return (
                <div key={a.id} className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${pct >= 80 ? 'bg-[var(--success-bg)] text-[var(--success)]' : pct >= 60 ? 'bg-[var(--warning-bg)] text-[var(--warning)]' : 'bg-[var(--error-bg)] text-[var(--error)]'}`}>{pct}%</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)] truncate">{a.quizzes?.title ?? 'Quiz'}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{a.correct_count}/{a.total_questions} correct · {a.completed_at ? formatDate(a.completed_at) : ''}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

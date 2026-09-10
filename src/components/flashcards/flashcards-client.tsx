'use client'
import { useState } from 'react'
import { Zap, Plus, Loader2, RotateCcw } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

interface Flashcard { id: string; front: string; back: string; topic: string | null; difficulty: string; confidence: string | null; review_count: number }
interface Props {
  allCards: Flashcard[]; dueCards: Flashcard[]
  documents: { id: string; name: string }[]
  subjects: { id: string; name: string; color: string }[]
  defaultDocId?: string; defaultSubjectId?: string
}

export function FlashcardsClient({ allCards, dueCards, documents, subjects, defaultDocId }: Props) {
  const [mode, setMode] = useState<'home' | 'study' | 'generate'>('home')
  const [studyCards, setStudyCards] = useState<Flashcard[]>([])
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [sessionDone, setSessionDone] = useState(false)
  const [genLoading, setGenLoading] = useState(false)
  const [docId, setDocId] = useState(defaultDocId ?? '')
  const [subjectId, setSubjectId] = useState('')
  const [cardCount, setCardCount] = useState(15)
  const { toast } = useToast()

  function startDue() { setStudyCards(dueCards); setCurrent(0); setFlipped(false); setSessionDone(false); setMode('study') }
  function startAll() { setStudyCards([...allCards].sort(() => Math.random() - 0.5).slice(0, 30)); setCurrent(0); setFlipped(false); setSessionDone(false); setMode('study') }

  async function handleConfidence(conf: string) {
    const card = studyCards[current]
    await fetch('/api/flashcards/review', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flashcard_id: card.id, confidence: conf }),
    })
    if (current + 1 >= studyCards.length) { setSessionDone(true) }
    else { setCurrent(c => c + 1); setFlipped(false) }
  }

  async function generate() {
    if (!docId && !subjectId) { toast({ type: 'error', title: 'Select a source' }); return }
    setGenLoading(true)
    try {
      const res = await fetch('/api/ai/flashcards', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: docId || undefined, subject_id: subjectId || undefined, card_count: cardCount, difficulty: 'medium', language: 'english' }),
      })
      const { data, error } = await res.json()
      if (error) throw new Error(error)
      toast({ type: 'success', title: `${data.length} flashcards created!` })
      setStudyCards(data); setCurrent(0); setFlipped(false); setSessionDone(false); setMode('study')
    } catch (e) { toast({ type: 'error', title: 'Failed', description: e instanceof Error ? e.message : 'Try again' }) }
    finally { setGenLoading(false) }
  }

  if (mode === 'study' && studyCards.length > 0) {
    if (sessionDone) return (
      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-8 text-center space-y-4">
        <div className="text-5xl">🎉</div>
        <h2 className="text-xl font-bold text-[var(--foreground)]">Session Complete!</h2>
        <p className="text-[var(--muted-foreground)]">{studyCards.length} cards reviewed</p>
        <button onClick={() => setMode('home')} className="w-full h-11 bg-[var(--primary)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--primary-dark)] transition-colors">Back to Flashcards</button>
      </div>
    )

    const card = studyCards[current]
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-[var(--muted-foreground)]">
          <button onClick={() => setMode('home')} className="text-[var(--primary)] hover:underline">← Back</button>
          <span>Card {current + 1} of {studyCards.length}</span>
        </div>
        <div className="h-1.5 bg-[var(--muted)] rounded-full"><div className="h-full bg-[var(--primary)] rounded-full transition-all" style={{ width: `${(current / studyCards.length) * 100}%` }} /></div>
        {card.topic && <div className="text-center"><span className="text-xs bg-[var(--primary)]/10 text-[var(--primary)] px-3 py-1 rounded-full">{card.topic}</span></div>}
        <div className="flashcard-container h-72 cursor-pointer select-none" onClick={() => setFlipped(!flipped)}>
          <div className={`flashcard-inner ${flipped ? 'flipped' : ''}`}>
            <div className="flashcard-front bg-[var(--card)] border-2 border-[var(--border)] rounded-2xl flex items-center justify-center p-8">
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] mb-4 font-medium">Question</p>
                <p className="text-lg font-medium text-[var(--foreground)] leading-relaxed">{card.front}</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-6">Tap to flip</p>
              </div>
            </div>
            <div className="flashcard-back bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] rounded-2xl flex items-center justify-center p-8">
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-widest text-white/60 mb-4 font-medium">Answer</p>
                <p className="text-lg font-medium text-white leading-relaxed">{card.back}</p>
              </div>
            </div>
          </div>
        </div>
        {flipped && (
          <div>
            <p className="text-center text-xs text-[var(--muted-foreground)] mb-3">How well did you know this?</p>
            <div className="grid grid-cols-4 gap-2">
              {[{ c:'again', l:'Again', cl:'bg-[var(--error-bg)] text-[var(--error)] border-[var(--error)]/30' },{ c:'hard', l:'Hard', cl:'bg-[var(--warning-bg)] text-[var(--warning)] border-[var(--warning)]/30' },{ c:'good', l:'Good', cl:'bg-[var(--info-bg)] text-[var(--info)] border-[var(--info)]/30' },{ c:'easy', l:'Easy', cl:'bg-[var(--success-bg)] text-[var(--success)] border-[var(--success)]/30' }].map(b => (
                <button key={b.c} onClick={() => handleConfidence(b.c)} className={`h-14 rounded-xl border-2 font-semibold text-sm transition-all hover:scale-105 active:scale-95 ${b.cl}`}>{b.l}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[{ label:'Due Now', value: dueCards.length, color:'text-[var(--error)]', bg:'bg-[var(--error-bg)]' },{ label:'Total Cards', value: allCards.length, color:'text-[var(--primary)]', bg:'bg-[var(--primary)]/10' },{ label:'Reviewed', value: allCards.filter(c => c.confidence).length, color:'text-[var(--success)]', bg:'bg-[var(--success-bg)]' }].map(s => (
          <div key={s.label} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="grid sm:grid-cols-3 gap-3">
        <button onClick={startDue} disabled={dueCards.length === 0}
          className="bg-[var(--primary)] text-white rounded-xl p-4 text-left hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-40">
          <Zap className="h-5 w-5 mb-2" />
          <p className="font-semibold text-sm">Study Due Cards</p>
          <p className="text-xs text-white/70 mt-0.5">{dueCards.length} ready</p>
        </button>
        <button onClick={startAll} disabled={allCards.length === 0}
          className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 text-left hover:border-[var(--primary)] transition-colors disabled:opacity-40">
          <RotateCcw className="h-5 w-5 mb-2 text-[var(--primary)]" />
          <p className="font-semibold text-sm text-[var(--foreground)]">Random Review</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Any 30 cards</p>
        </button>
        <button onClick={() => setMode('generate')}
          className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 text-left hover:border-[var(--primary)] transition-colors">
          <Plus className="h-5 w-5 mb-2 text-[var(--primary)]" />
          <p className="font-semibold text-sm text-[var(--foreground)]">Generate New</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">From your notes</p>
        </button>
      </div>

      {mode === 'generate' && (
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5 space-y-4">
          <h3 className="font-semibold text-[var(--foreground)]">Generate Flashcards</h3>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">From Document</label>
            <select value={docId} onChange={e => setDocId(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none">
              <option value="">Select document...</option>
              {documents.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Number of Cards</label>
            <select value={cardCount} onChange={e => setCardCount(+e.target.value)} className="w-full h-10 px-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none">
              {[10,15,20,25,30].map(n => <option key={n} value={n}>{n} cards</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setMode('home')} className="flex-1 h-11 border border-[var(--border)] rounded-xl text-sm font-medium hover:bg-[var(--muted)] transition-colors">Cancel</button>
            <button onClick={generate} disabled={genLoading} className="flex-1 h-11 bg-[var(--primary)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {genLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Generating...</> : 'Generate'}
            </button>
          </div>
        </div>
      )}

      {allCards.length === 0 && mode !== 'generate' && (
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-8 text-center">
          <Zap className="h-10 w-10 text-[var(--muted-foreground)] mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium text-[var(--foreground)] mb-1">No flashcards yet</p>
          <p className="text-xs text-[var(--muted-foreground)]">Generate flashcards from your notes to start studying</p>
        </div>
      )}
    </div>
  )
}

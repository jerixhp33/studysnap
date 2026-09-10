'use client'
import { useState, useRef, useEffect } from 'react'
import { Brain, Send, Settings, ChevronDown } from 'lucide-react'
import { StudyTimer } from '@/components/dashboard/study-timer'
import { useToast } from '@/components/ui/toast'

interface Message { role: 'user' | 'assistant'; content: string; sourceReferenced?: boolean }
interface Props {
  profile: { learning_level: string; preferred_language: string; full_name: string | null } | null
  subjects: { id: string; name: string; color: string }[]
  documents: { id: string; name: string; subject_id: string | null }[]
  defaultSubjectId?: string
  defaultDocId?: string
}

const QUICK_PROMPTS = [
  'Explain this concept simply', 'Give me a real-world example', 'Quiz me on this topic',
  'Create flashcards from this', 'What are the key points?', 'How does this compare to...?',
  'Explain the difference between...', 'Make a 5-mark answer for...', 'Summarize in 3 points',
]

const LEVELS = [
  { value: 'beginner', label: 'Beginner' }, { value: 'simple', label: 'Simple' },
  { value: 'college', label: 'College' }, { value: 'exam', label: 'Exam Mode' }, { value: 'interview', label: 'Interview' },
]

export function TutorClient({ profile, subjects, documents, defaultSubjectId, defaultDocId }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [subjectId, setSubjectId] = useState(defaultSubjectId ?? '')
  const [docId, setDocId] = useState(defaultDocId ?? '')
  const [level, setLevel] = useState(profile?.learning_level ?? 'college')
  const [language, setLanguage] = useState(profile?.preferred_language ?? 'english')
  const [showSettings, setShowSettings] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  // Filter docs by selected subject
  const filteredDocs = subjectId ? documents.filter(d => d.subject_id === subjectId) : documents

  async function sendMessage(question?: string) {
    const q = (question ?? input).trim()
    if (!q || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setLoading(true)
    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q, subject_id: subjectId || undefined, document_id: docId || undefined,
          learning_level: level, language,
          conversation_history: messages.slice(-8),
        }),
      })
      const { data, error } = await res.json()
      if (error) throw new Error(error)
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer, sourceReferenced: data.source_referenced }])
    } catch (e) {
      toast({ type: 'error', title: 'Tutor error', description: e instanceof Error ? e.message : 'Try again' })
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now. Please try again." }])
    } finally { setLoading(false) }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const systemConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Settings bar */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-3 mb-4">
        <button onClick={() => setShowSettings(!showSettings)} className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)] w-full">
          <Settings className="h-4 w-4 text-[var(--muted-foreground)]" />
          <span>Tutor Settings</span>
          <ChevronDown className={`h-4 w-4 text-[var(--muted-foreground)] ml-auto transition-transform ${showSettings ? 'rotate-180' : ''}`} />
        </button>
        {showSettings && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Level</label>
              <select value={level} onChange={e => setLevel(e.target.value)} className="w-full h-9 px-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none">
                {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Language</label>
              <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full h-9 px-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none">
                <option value="english">English</option><option value="tamil">Tamil</option><option value="hindi">Hindi</option>
              </select>
            </div>
            {subjects.length > 0 && (
              <div><label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Subject</label>
                <select value={subjectId} onChange={e => { setSubjectId(e.target.value); setDocId('') }} className="w-full h-9 px-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none">
                  <option value="">All subjects</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}
            {filteredDocs.length > 0 && (
              <div><label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Document</label>
                <select value={docId} onChange={e => setDocId(e.target.value)} className="w-full h-9 px-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none">
                  <option value="">All notes</option>
                  {filteredDocs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Study Timer */}
      <StudyTimer subjectId={subjectId || undefined} activityType="study" />

      {/* Chat */}
      <div className="flex-1 bg-[var(--card)] rounded-xl border border-[var(--border)] flex flex-col min-h-[400px] max-h-[60vh]">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full py-10">
              <Brain className="h-12 w-12 text-[var(--primary)] opacity-60 mb-4" />
              <h3 className="font-semibold text-[var(--foreground)] mb-1">Your AI Study Tutor</h3>
              <p className="text-sm text-[var(--muted-foreground)] text-center max-w-xs">
                Ask me anything about your subjects. I'll use your uploaded notes to give accurate answers.
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="h-7 w-7 rounded-full bg-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] shrink-0 mr-2 mt-1">
                  <Brain className="h-4 w-4" />
                </div>
              )}
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === 'user' ? 'bg-[var(--primary)] text-white rounded-br-none' : 'bg-[var(--muted)] text-[var(--foreground)] rounded-bl-none'}`}>
                <div className="prose-study whitespace-pre-wrap">{m.content}</div>
                {m.role === 'assistant' && m.sourceReferenced && (
                  <p className="text-xs opacity-60 mt-2 border-t border-current/10 pt-2">📎 From your notes</p>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-start gap-2">
              <div className="h-7 w-7 rounded-full bg-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] shrink-0">
                <Brain className="h-4 w-4" />
              </div>
              <div className="bg-[var(--muted)] rounded-2xl rounded-bl-none px-4 py-3">
                <div className="flex gap-1.5 items-center">
                  <div className="h-2 w-2 bg-[var(--muted-foreground)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="h-2 w-2 bg-[var(--muted-foreground)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="h-2 w-2 bg-[var(--muted-foreground)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts */}
        {messages.length === 0 && (
          <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
            {QUICK_PROMPTS.slice(0, 5).map(p => (
              <button key={p} onClick={() => sendMessage(p)} className="shrink-0 text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] px-3 py-1.5 rounded-full hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors whitespace-nowrap">{p}</button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="border-t border-[var(--border)] p-3 flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Ask a question... (Enter to send, Shift+Enter for new line)"
            rows={1} disabled={loading}
            className="flex-1 resize-none px-3 py-2.5 rounded-xl border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] disabled:opacity-60 max-h-32 overflow-y-auto"
            style={{ lineHeight: '1.5' }}
          />
          <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
            className="h-10 w-10 bg-[var(--primary)] text-white rounded-xl flex items-center justify-center hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-60 shrink-0">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'
import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Square } from 'lucide-react'

interface Props {
  subjectId?: string
  activityType?: 'study' | 'quiz' | 'flashcards' | 'revision'
  onSessionEnd?: (durationSeconds: number) => void
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function StudyTimer({ subjectId, activityType = 'study', onSessionEnd }: Props) {
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  async function start() {
    setRunning(true)
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', subject_id: subjectId, activity_type: activityType }),
      })
      const { data } = await res.json()
      if (data?.id) setSessionId(data.id)
    } catch { /* non-critical */ }
  }

  async function pause() {
    setRunning(false)
    if (sessionId && elapsed > 0) {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end', session_id: sessionId, duration_seconds: elapsed }),
      }).catch(() => {})
    }
  }

  async function stop() {
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (sessionId && elapsed > 0) {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end', session_id: sessionId, duration_seconds: elapsed }),
      }).catch(() => {})
      onSessionEnd?.(elapsed)
    }
    setElapsed(0)
    setSessionId(null)
  }

  return (
    <div className="flex items-center gap-3 bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-2.5">
      <div className={`font-mono text-lg font-bold tabular-nums min-w-[60px] ${running ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}>
        {formatTime(elapsed)}
      </div>
      <div className="flex gap-1.5 ml-auto">
        {!running ? (
          <button onClick={start} aria-label="Start timer"
            className="h-8 w-8 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center hover:bg-[var(--primary-dark)] transition-colors">
            <Play className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={pause} aria-label="Pause timer"
            className="h-8 w-8 rounded-lg bg-[var(--warning)] text-white flex items-center justify-center hover:opacity-90 transition-opacity">
            <Pause className="h-4 w-4" />
          </button>
        )}
        {(running || elapsed > 0) && (
          <button onClick={stop} aria-label="Stop and save session"
            className="h-8 w-8 rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] flex items-center justify-center hover:bg-[var(--muted)] transition-colors">
            <Square className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

'use client'
import { useState, useRef, useEffect } from 'react'
import { Search, FileText, Zap, HelpCircle, X, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SearchResult {
  id: string; type: string; title: string; snippet: string; url: string
}

const TYPE_ICONS = {
  document: FileText,
  flashcard: Zap,
  question: HelpCircle,
}
const TYPE_LABELS = { document: 'Note', flashcard: 'Flashcard', question: 'Question' }

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  let debounce: ReturnType<typeof setTimeout>

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounce)
    if (val.length < 2) { setResults([]); setOpen(false); return }
    debounce = setTimeout(() => search(val), 350)
  }

  async function search(q: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const { data } = await res.json()
      setResults(data ?? [])
      setOpen(true)
    } catch { setResults([]) }
    finally { setLoading(false) }
  }

  function go(url: string) {
    setQuery(''); setResults([]); setOpen(false)
    router.push(url)
  }

  function clear() { setQuery(''); setResults([]); setOpen(false) }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') clear()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="relative w-full max-w-sm">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
        <input
          ref={inputRef}
          value={query}
          onChange={handleChange}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="Search notes, flashcards… ⌘K"
          className="w-full h-9 pl-9 pr-8 rounded-xl border border-[var(--input)] bg-[var(--muted)] text-sm placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] transition-colors"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted-foreground)] animate-spin" />}
        {query && !loading && (
          <button onClick={clear} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg z-50 overflow-hidden">
          {results.map(r => {
            const Icon = TYPE_ICONS[r.type as keyof typeof TYPE_ICONS] ?? FileText
            const label = TYPE_LABELS[r.type as keyof typeof TYPE_LABELS] ?? r.type
            return (
              <button key={r.id} onClick={() => go(r.url)}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[var(--muted)] transition-colors text-left">
                <Icon className="h-4 w-4 text-[var(--primary)] shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)] truncate">{r.title}</p>
                  {r.snippet && <p className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">{r.snippet}</p>}
                </div>
                <span className="text-xs text-[var(--muted-foreground)] shrink-0 mt-0.5 capitalize">{label}</span>
              </button>
            )
          })}
        </div>
      )}

      {open && query.length >= 2 && !loading && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg z-50 px-4 py-3 text-sm text-[var(--muted-foreground)]">
          No results for &quot;{query}&quot;
        </div>
      )}
    </div>
  )
}

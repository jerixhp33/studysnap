'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  const resolved = theme === 'system' ? getSystemTheme() : theme
  root.classList.toggle('dark', resolved === 'dark')
  return resolved
}

export function ThemeProvider({ children, defaultTheme = 'system' }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Read from localStorage on mount
    const stored = (localStorage.getItem('studysnap-theme') as Theme) ?? 'system'
    setThemeState(stored)
    const resolved = applyTheme(stored)
    setResolvedTheme(resolved)
    setMounted(true)

    // Watch system preference changes
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (stored === 'system') {
        const r = applyTheme('system')
        setResolvedTheme(r)
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  function setTheme(t: Theme) {
    localStorage.setItem('studysnap-theme', t)
    setThemeState(t)
    const resolved = applyTheme(t)
    setResolvedTheme(resolved)
  }

  // Prevent flash of wrong theme
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
        <div style={{ visibility: 'hidden' }}>{children}</div>
      </ThemeContext.Provider>
    )
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

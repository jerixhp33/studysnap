import { describe, it, expect } from 'vitest'
import { formatFileSize, formatDuration, getDaysUntil, truncate, getGreeting } from '../../src/lib/utils'

describe('formatFileSize', () => {
  it('formats bytes', () => { expect(formatFileSize(500)).toBe('500 B') })
  it('formats KB', () => { expect(formatFileSize(1500)).toBe('1.5 KB') })
  it('formats MB', () => { expect(formatFileSize(2500000)).toBe('2.4 MB') })
})

describe('formatDuration', () => {
  it('shows minutes for short durations', () => { expect(formatDuration(300)).toBe('5m') })
  it('shows hours and minutes', () => { expect(formatDuration(3720)).toBe('1h 2m') })
  it('handles zero', () => { expect(formatDuration(0)).toBe('0m') })
})

describe('getDaysUntil', () => {
  it('returns positive for future date', () => {
    const future = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]
    expect(getDaysUntil(future)).toBeGreaterThan(0)
  })
  it('returns negative for past date', () => {
    const past = new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0]
    expect(getDaysUntil(past)).toBeLessThan(0)
  })
})

describe('truncate', () => {
  it('leaves short strings unchanged', () => { expect(truncate('hello', 10)).toBe('hello') })
  it('truncates long strings', () => { expect(truncate('hello world', 5)).toBe('hello…') })
})

describe('getGreeting', () => {
  it('returns a string', () => { expect(typeof getGreeting()).toBe('string') })
  it('contains a time of day', () => { expect(['morning', 'afternoon', 'evening'].some(t => getGreeting().includes(t))).toBe(true) })
})

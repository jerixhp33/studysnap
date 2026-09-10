import { describe, it, expect } from 'vitest'
import { cleanExtractedText } from '../../src/lib/pdf'

describe('cleanExtractedText', () => {
  it('removes null bytes', () => {
    expect(cleanExtractedText('hello\0world')).toBe('helloworld')
  })

  it('normalises excessive whitespace', () => {
    const input = 'para one\n\n\n\n\npara two'
    const result = cleanExtractedText(input)
    expect(result).not.toMatch(/\n{3,}/)
  })

  it('replaces form feeds with double newlines', () => {
    const result = cleanExtractedText('page1\fpage2')
    expect(result).toContain('page1')
    expect(result).toContain('page2')
    expect(result).not.toContain('\f')
  })

  it('trims leading and trailing whitespace', () => {
    const result = cleanExtractedText('   hello   ')
    expect(result).toBe('hello')
  })

  it('replaces long dashes with ---', () => {
    const result = cleanExtractedText('section\n----------\ncontent')
    expect(result).toContain('---')
  })

  it('normalises Windows line endings', () => {
    const result = cleanExtractedText('line1\r\nline2\rline3')
    expect(result).not.toContain('\r')
  })
})

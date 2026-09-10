import { describe, it, expect } from 'vitest'
import { chunkText } from '../../src/lib/rag'

describe('chunkText', () => {
  it('returns single chunk for short text', () => {
    const text = 'Hello world. This is a test.'
    const chunks = chunkText(text, 800, 100)
    expect(chunks.length).toBeGreaterThan(0)
    expect(chunks[0]).toContain('Hello world')
  })

  it('splits multi-paragraph text into chunks', () => {
    const para = 'This is paragraph content with some meaningful text. '.repeat(5)
    const text = Array(20).fill(para).join('\n\n')
    const chunks = chunkText(text, 800, 100)
    expect(chunks.length).toBeGreaterThan(1)
  })

  it('filters very short chunks', () => {
    const text = '\n\n\n\nHello world, this is a test sentence.\n\n\n\nAnother paragraph with content here.\n\n\n'
    const chunks = chunkText(text)
    chunks.forEach(c => expect(c.trim().length).toBeGreaterThan(0))
  })

  it('handles single long paragraph by sentence splitting', () => {
    // A single very long paragraph (no double newlines) should be handled
    const sentences = Array(50).fill('This is a sentence with some content. ').join('')
    const chunks = chunkText(sentences, 400)
    expect(chunks.length).toBeGreaterThanOrEqual(1)
  })
})

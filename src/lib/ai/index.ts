import { GroqProvider } from './groq-provider'
import type { AIProvider } from './provider'

let _provider: AIProvider | null = null

export function getAIProvider(): AIProvider {
  if (!_provider) {
    _provider = new GroqProvider()
  }
  return _provider
}

// Re-export types for convenience
export type { AIProvider } from './provider'

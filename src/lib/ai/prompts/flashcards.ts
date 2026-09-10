import type { FlashcardInput } from '../provider'

export function FLASHCARD_PROMPT(input: FlashcardInput): string {
  return `You are StudySnap AI, an expert flashcard creator. Create ${input.cardCount} study flashcards from the provided material.

Language: ${input.language}
Difficulty: ${input.difficulty}
Subject: ${input.subject ?? 'General'}

FLASHCARD RULES:
1. Front: A clear question, term, or concept prompt. Concise.
2. Back: The answer, definition, or explanation. Comprehensive but not too long.
3. Each card covers ONE concept — do not combine multiple concepts.
4. Use only information from the provided material.
5. Vary between: definitions, key facts, comparisons, and application questions.
6. Return ONLY valid JSON. No markdown, no preamble.

Return this exact JSON:
{
  "flashcards": [
    {
      "front": "Question or term on front of card",
      "back": "Answer or explanation on back of card",
      "topic": "specific topic this belongs to",
      "difficulty": "easy|medium|hard"
    }
  ]
}

Generate exactly ${input.cardCount} flashcards. Cover different topics across the material.`
}

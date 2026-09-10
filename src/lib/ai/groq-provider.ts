import Groq from 'groq-sdk'
import type {
  AIProvider, SummaryInput, SummaryOutput,
  QuizInput, QuizQuestionOutput,
  FlashcardInput, FlashcardOutput,
  TutorInput, TutorOutput,
  EvaluatorInput, EvaluatorOutput,
  StudyPlanInput, StudyPlanOutput,
  WeakTopicInput,
} from './provider'
import {
  SUMMARY_PROMPT,
  QUIZ_PROMPT,
  FLASHCARD_PROMPT,
  TUTOR_PROMPT,
  EVALUATOR_PROMPT,
  PLANNER_PROMPT,
} from './prompts'
import { summarySchema, quizSchema, flashcardSchema, evaluatorSchema, studyPlanSchema } from '@/schemas/ai'

// ─── Key rotation ─────────────────────────────────────────────────────────────

function getApiKeys(): string[] {
  const keys: string[] = []
  for (let i = 1; i <= 5; i++) {
    const key = process.env[`GROQ_API_KEY_${i}`]
    if (key && key.length > 10) keys.push(key)
  }
  return keys
}

async function withKeyFallback<T>(
  fn: (client: Groq) => Promise<T>
): Promise<T> {
  const keys = getApiKeys()
  if (keys.length === 0) {
    throw new Error('No Groq API keys configured. Please add GROQ_API_KEY_1 to your environment.')
  }

  let lastError: Error | null = null
  for (const key of keys) {
    try {
      const client = new Groq({ apiKey: key })
      return await fn(client)
    } catch (err) {
      const error = err as { status?: number; message?: string }
      // Only try next key on rate limit errors
      if (error.status === 429 || error.status === 503) {
        lastError = new Error(error.message ?? 'Rate limited')
        continue
      }
      throw err
    }
  }
  throw lastError ?? new Error('All API keys exhausted')
}

// ─── JSON parsing helper ───────────────────────────────────────────────────────

function parseJSON<T>(text: string): T {
  // Strip markdown fences if present
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()

  // Find JSON object/array boundaries
  const start = cleaned.indexOf('{') !== -1 ? cleaned.indexOf('{') : cleaned.indexOf('[')
  const isArray = cleaned.indexOf('[') !== -1 && (cleaned.indexOf('[') < cleaned.indexOf('{') || cleaned.indexOf('{') === -1)
  const end = isArray ? cleaned.lastIndexOf(']') : cleaned.lastIndexOf('}')

  if (start === -1 || end === -1) {
    throw new Error('No JSON found in response')
  }

  return JSON.parse(cleaned.slice(start, end + 1))
}

async function callGroq(
  client: Groq,
  systemPrompt: string,
  userPrompt: string,
  model = 'llama-3.3-70b-versatile',
  maxTokens = 4096
): Promise<string> {
  const completion = await client.chat.completions.create({
    model,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
  })

  return completion.choices[0]?.message?.content ?? ''
}

// ─── Groq Provider ────────────────────────────────────────────────────────────

export class GroqProvider implements AIProvider {
  async generateSummary(input: SummaryInput): Promise<SummaryOutput> {
    const raw = await withKeyFallback((client) =>
      callGroq(
        client,
        SUMMARY_PROMPT(input),
        `Content to summarize:\n\n${input.content.slice(0, 12000)}`,
        'llama-3.3-70b-versatile',
        3000
      )
    )

    const parsed = parseJSON<SummaryOutput>(raw)
    return summarySchema.parse(parsed)
  }

  async generateQuiz(input: QuizInput): Promise<QuizQuestionOutput[]> {
    const raw = await withKeyFallback((client) =>
      callGroq(
        client,
        QUIZ_PROMPT(input),
        `Study material:\n\n${input.content.slice(0, 10000)}`,
        'llama-3.3-70b-versatile',
        4096
      )
    )

    const parsed = parseJSON<{ questions: QuizQuestionOutput[] }>(raw)
    const result = quizSchema.parse(parsed)
    return result.questions
  }

  async generateFlashcards(input: FlashcardInput): Promise<FlashcardOutput[]> {
    const raw = await withKeyFallback((client) =>
      callGroq(
        client,
        FLASHCARD_PROMPT(input),
        `Study material:\n\n${input.content.slice(0, 10000)}`,
        'llama-3.3-70b-versatile',
        3000
      )
    )

    const parsed = parseJSON<{ flashcards: FlashcardOutput[] }>(raw)
    const result = flashcardSchema.parse(parsed)
    return result.flashcards
  }

  async answerTutorQuestion(input: TutorInput): Promise<TutorOutput> {
    const messages: Groq.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: TUTOR_PROMPT(input) },
      ...input.conversationHistory.slice(-8).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      {
        role: 'user',
        content: input.context
          ? `Context from student's notes:\n${input.context}\n\nQuestion: ${input.question}`
          : input.question,
      },
    ]

    const raw = await withKeyFallback(async (client) => {
      const completion = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 2048,
        messages,
        temperature: 0.4,
      })
      return completion.choices[0]?.message?.content ?? ''
    })

    // Tutor responds in natural language, wrap it
    return {
      answer: raw.trim(),
      follow_up_suggestions: [],
      source_referenced: input.context.length > 0,
    }
  }

  async evaluateAnswer(input: EvaluatorInput): Promise<EvaluatorOutput> {
    const raw = await withKeyFallback((client) =>
      callGroq(
        client,
        EVALUATOR_PROMPT(input),
        `Student answer:\n${input.studentAnswer}`,
        'llama-3.3-70b-versatile',
        2000
      )
    )

    const parsed = parseJSON<EvaluatorOutput>(raw)
    return evaluatorSchema.parse(parsed)
  }

  async generateStudyPlan(input: StudyPlanInput): Promise<StudyPlanOutput> {
    const raw = await withKeyFallback((client) =>
      callGroq(
        client,
        PLANNER_PROMPT(input),
        `Create a study plan.`,
        'llama-3.3-70b-versatile',
        3000
      )
    )

    const parsed = parseJSON<StudyPlanOutput>(raw)
    return studyPlanSchema.parse(parsed)
  }

  async analyzeWeakTopics(input: WeakTopicInput): Promise<string[]> {
    const topicSummary = input.topics
      .map((t) => `${t.topic}: ${t.accuracy}% accuracy (${t.attempts} attempts)`)
      .join('\n')

    const raw = await withKeyFallback((client) =>
      callGroq(
        client,
        `You are an educational analyst. Analyze quiz performance data and identify topics needing revision. Return JSON: {"recommendations": ["string", ...]}`,
        `Topics performance:\n${topicSummary}\nSubject: ${input.subject ?? 'Unknown'}`,
        'llama3-8b-8192',
        1000
      )
    )

    const parsed = parseJSON<{ recommendations: string[] }>(raw)
    return parsed.recommendations ?? []
  }
}

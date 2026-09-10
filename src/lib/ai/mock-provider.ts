/**
 * MockProvider — returns deterministic fake data.
 * Use in unit/integration tests to avoid real API calls.
 *
 * Usage:
 *   import { MockProvider } from '@/lib/ai/mock-provider'
 *   // In tests: override getAIProvider() to return new MockProvider()
 */
import type {
  AIProvider, SummaryInput, SummaryOutput,
  QuizInput, QuizQuestionOutput,
  FlashcardInput, FlashcardOutput,
  TutorInput, TutorOutput,
  EvaluatorInput, EvaluatorOutput,
  StudyPlanInput, StudyPlanOutput,
  WeakTopicInput,
} from './provider'

export class MockProvider implements AIProvider {
  async generateSummary(_input: SummaryInput): Promise<SummaryOutput> {
    return {
      title: 'Mock Summary',
      overview: 'This is a mock summary for testing.',
      key_points: ['Key point 1', 'Key point 2', 'Key point 3'],
      definitions: [{ term: 'Test term', definition: 'Test definition' }],
      important_concepts: ['Concept A', 'Concept B'],
      examples: ['Example 1'],
      exam_tips: ['Study regularly', 'Review definitions'],
    }
  }

  async generateQuiz(input: QuizInput): Promise<QuizQuestionOutput[]> {
    return Array.from({ length: input.questionCount }, (_, i) => ({
      question: `Mock question ${i + 1}?`,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correct_answer: 'Option A',
      explanation: 'Option A is correct because this is a mock.',
      difficulty: input.difficulty,
      topic: 'Mock Topic',
      question_type: 'mcq' as const,
    }))
  }

  async generateFlashcards(input: FlashcardInput): Promise<FlashcardOutput[]> {
    return Array.from({ length: input.cardCount }, (_, i) => ({
      front: `Mock question ${i + 1}`,
      back: `Mock answer ${i + 1}`,
      topic: 'Mock Topic',
      difficulty: input.difficulty,
    }))
  }

  async answerTutorQuestion(_input: TutorInput): Promise<TutorOutput> {
    return {
      answer: 'This is a mock answer from the AI tutor.',
      follow_up_suggestions: ['Follow-up question 1', 'Follow-up question 2'],
      source_referenced: false,
    }
  }

  async evaluateAnswer(input: EvaluatorInput): Promise<EvaluatorOutput> {
    return {
      score: Math.floor(input.marks * 0.7),
      max_score: input.marks,
      strengths: ['Good structure', 'Clear explanation'],
      missing_concepts: ['Missing concept A'],
      suggestions: ['Add more detail', 'Include examples'],
      improved_answer: 'This is a model answer that covers all the required concepts.',
    }
  }

  async generateStudyPlan(input: StudyPlanInput): Promise<StudyPlanOutput> {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    return {
      strategy: 'Focus on weak areas first, then revise strong topics.',
      tasks: input.units.map((unit, i) => ({
        title: `Study ${unit}`,
        description: `Cover key concepts in ${unit}`,
        task_type: i % 2 === 0 ? 'study' : 'quiz',
        scheduled_date: new Date(Date.now() + (i + 1) * 86400000).toISOString().split('T')[0],
        duration_minutes: input.dailyMinutes,
      })),
    }
  }

  async analyzeWeakTopics(_input: WeakTopicInput): Promise<string[]> {
    return ['Focus on the lowest-scoring topic first.', 'Create flashcards for definitions.']
  }
}

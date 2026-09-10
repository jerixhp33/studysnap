import type { SupportedLanguage, LearningLevel, DifficultyLevel, QuestionType } from '@/types'

// ─── Input types ─────────────────────────────────────────────────────────────

export interface SummaryInput {
  content: string
  summaryType: 'quick' | 'detailed' | 'exam' | 'simple' | 'deep'
  language: SupportedLanguage
  difficulty: LearningLevel
  title?: string
}

export interface QuizInput {
  content: string
  questionCount: number
  difficulty: DifficultyLevel
  questionTypes: QuestionType[]
  subject?: string
  chapter?: string
  language: SupportedLanguage
}

export interface FlashcardInput {
  content: string
  cardCount: number
  difficulty: DifficultyLevel
  subject?: string
  language: SupportedLanguage
}

export interface TutorInput {
  question: string
  context: string
  subject?: string
  learningLevel: LearningLevel
  language: SupportedLanguage
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
}

export interface EvaluatorInput {
  question: string
  studentAnswer: string
  referenceContent: string
  marks: 2 | 5 | 10
  subject?: string
}

export interface StudyPlanInput {
  subject: string
  units: string[]
  examDate: string
  dailyMinutes: number
  currentLevel: DifficultyLevel
  existingProgress?: string
}

export interface WeakTopicInput {
  topics: Array<{ topic: string; accuracy: number; attempts: number }>
  subject?: string
}

// ─── Output types ─────────────────────────────────────────────────────────────

export interface SummaryOutput {
  title: string
  overview: string
  key_points: string[]
  definitions: Array<{ term: string; definition: string }>
  important_concepts: string[]
  examples: string[]
  exam_tips: string[]
}

export interface QuizQuestionOutput {
  question: string
  options: string[] | null
  correct_answer: string
  explanation: string
  difficulty: DifficultyLevel
  topic: string
  question_type: QuestionType
}

export interface FlashcardOutput {
  front: string
  back: string
  topic: string
  difficulty: DifficultyLevel
}

export interface TutorOutput {
  answer: string
  follow_up_suggestions: string[]
  source_referenced: boolean
}

export interface EvaluatorOutput {
  score: number
  max_score: number
  strengths: string[]
  missing_concepts: string[]
  suggestions: string[]
  improved_answer: string
}

export interface StudyPlanOutput {
  tasks: Array<{
    title: string
    description: string
    task_type: 'study' | 'quiz' | 'flashcards' | 'revision'
    scheduled_date: string
    duration_minutes: number
  }>
  strategy: string
}

// ─── Provider interface ───────────────────────────────────────────────────────

export interface AIProvider {
  generateSummary(input: SummaryInput): Promise<SummaryOutput>
  generateQuiz(input: QuizInput): Promise<QuizQuestionOutput[]>
  generateFlashcards(input: FlashcardInput): Promise<FlashcardOutput[]>
  answerTutorQuestion(input: TutorInput): Promise<TutorOutput>
  evaluateAnswer(input: EvaluatorInput): Promise<EvaluatorOutput>
  generateStudyPlan(input: StudyPlanInput): Promise<StudyPlanOutput>
  analyzeWeakTopics(input: WeakTopicInput): Promise<string[]>
}

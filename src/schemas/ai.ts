import { z } from 'zod'

export const summarySchema = z.object({
  title: z.string().min(1),
  overview: z.string().min(1),
  key_points: z.array(z.string()).min(1),
  definitions: z.array(z.object({
    term: z.string(),
    definition: z.string(),
  })),
  important_concepts: z.array(z.string()),
  examples: z.array(z.string()),
  exam_tips: z.array(z.string()),
})

const questionTypeEnum = z.enum(['mcq', 'true_false', 'fill_blank', 'short_answer'])
const difficultyEnum = z.enum(['easy', 'medium', 'hard'])

export const quizSchema = z.object({
  questions: z.array(z.object({
    question: z.string().min(1),
    options: z.array(z.string()).nullable(),
    correct_answer: z.string().min(1),
    explanation: z.string().min(1),
    difficulty: difficultyEnum,
    topic: z.string(),
    question_type: questionTypeEnum,
  })).min(1),
})

export const flashcardSchema = z.object({
  flashcards: z.array(z.object({
    front: z.string().min(1),
    back: z.string().min(1),
    topic: z.string(),
    difficulty: difficultyEnum,
  })).min(1),
})

export const evaluatorSchema = z.object({
  score: z.number().min(0),
  max_score: z.number().min(1),
  strengths: z.array(z.string()),
  missing_concepts: z.array(z.string()),
  suggestions: z.array(z.string()),
  improved_answer: z.string().min(1),
})

export const studyPlanSchema = z.object({
  strategy: z.string(),
  tasks: z.array(z.object({
    title: z.string().min(1),
    description: z.string(),
    task_type: z.enum(['study', 'quiz', 'flashcards', 'revision']),
    scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    duration_minutes: z.number().min(5).max(240),
  })),
})

// ─── API Input schemas ────────────────────────────────────────────────────────

export const summaryInputSchema = z.object({
  document_id: z.string().uuid(),
  summary_type: z.enum(['quick', 'detailed', 'exam', 'simple', 'deep']).default('detailed'),
  language: z.enum(['english', 'tamil', 'hindi']).default('english'),
  difficulty: z.enum(['beginner', 'simple', 'college', 'exam', 'interview']).default('college'),
})

export const quizInputSchema = z.object({
  document_id: z.string().uuid().optional(),
  subject_id: z.string().uuid().optional(),
  question_count: z.number().int().min(3).max(30).default(10),
  difficulty: difficultyEnum.default('medium'),
  question_types: z.array(questionTypeEnum).min(1).default(['mcq']),
  language: z.enum(['english', 'tamil', 'hindi']).default('english'),
})

export const flashcardInputSchema = z.object({
  document_id: z.string().uuid().optional(),
  subject_id: z.string().uuid().optional(),
  card_count: z.number().int().min(5).max(50).default(20),
  difficulty: difficultyEnum.default('medium'),
  language: z.enum(['english', 'tamil', 'hindi']).default('english'),
})

export const tutorInputSchema = z.object({
  question: z.string().min(1).max(2000),
  subject_id: z.string().uuid().optional(),
  document_id: z.string().uuid().optional(),
  learning_level: z.enum(['beginner', 'simple', 'college', 'exam', 'interview']).default('college'),
  language: z.enum(['english', 'tamil', 'hindi']).default('english'),
  conversation_id: z.string().optional(),
})

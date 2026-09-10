// ─── User & Auth ────────────────────────────────────────────────────────────

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  learning_level: LearningLevel
  preferred_language: SupportedLanguage
  daily_goal_minutes: number
  streak_days: number
  total_xp: number
  created_at: string
  updated_at: string
}

export type LearningLevel = 'beginner' | 'simple' | 'college' | 'exam' | 'interview'
export type SupportedLanguage = 'english' | 'tamil' | 'hindi'

// ─── Subjects ────────────────────────────────────────────────────────────────

export interface Subject {
  id: string
  user_id: string
  name: string
  description: string | null
  color: string
  icon: string
  semester: string | null
  archived: boolean
  created_at: string
  updated_at: string
  chapter_count?: number
  document_count?: number
  progress?: number
}

export interface Chapter {
  id: string
  subject_id: string
  user_id: string
  name: string
  order_index: number
  created_at: string
  updated_at: string
}

// ─── Documents ───────────────────────────────────────────────────────────────

export type DocumentStatus =
  | 'uploading'
  | 'reading'
  | 'extracting'
  | 'understanding'
  | 'indexing'
  | 'ready'
  | 'failed'

export type DocumentType = 'pdf' | 'image' | 'text'

export interface Document {
  id: string
  user_id: string
  subject_id: string | null
  chapter_id: string | null
  name: string
  file_path: string
  file_type: DocumentType
  file_size: number
  page_count: number | null
  status: DocumentStatus
  error_message: string | null
  extracted_text: string | null
  created_at: string
  updated_at: string
  subject?: Pick<Subject, 'id' | 'name' | 'color'>
}

export interface DocumentChunk {
  id: string
  document_id: string
  user_id: string
  content: string
  page_number: number | null
  chunk_index: number
  chapter: string | null
  topic: string | null
  embedding?: number[]
  created_at: string
}

// ─── Summaries ───────────────────────────────────────────────────────────────

export type SummaryType = 'quick' | 'detailed' | 'exam' | 'simple' | 'deep'

export interface Summary {
  id: string
  document_id: string
  user_id: string
  summary_type: SummaryType
  language: SupportedLanguage
  difficulty: LearningLevel
  title: string
  overview: string
  key_points: string[]
  definitions: Array<{ term: string; definition: string }>
  important_concepts: string[]
  examples: string[]
  exam_tips: string[]
  created_at: string
}

// ─── Quizzes ─────────────────────────────────────────────────────────────────

export type QuestionType = 'mcq' | 'true_false' | 'fill_blank' | 'short_answer'
export type DifficultyLevel = 'easy' | 'medium' | 'hard'

export interface Question {
  id: string
  document_id: string | null
  subject_id: string | null
  user_id: string
  question: string
  options: string[] | null
  correct_answer: string
  explanation: string
  difficulty: DifficultyLevel
  topic: string | null
  question_type: QuestionType
  source: string | null
  created_at: string
}

export interface Quiz {
  id: string
  user_id: string
  document_id: string | null
  subject_id: string | null
  title: string
  question_count: number
  difficulty: DifficultyLevel
  created_at: string
  questions?: Question[]
}

export interface QuizAttempt {
  id: string
  quiz_id: string
  user_id: string
  score: number
  total_questions: number
  correct_count: number
  incorrect_count: number
  time_taken_seconds: number | null
  completed_at: string | null
  topic_performance: Record<string, { correct: number; total: number }> | null
  created_at: string
}

export interface QuizAnswer {
  id: string
  attempt_id: string
  question_id: string
  user_answer: string
  is_correct: boolean
  created_at: string
}

// ─── Flashcards ───────────────────────────────────────────────────────────────

export type FlashcardConfidence = 'again' | 'hard' | 'good' | 'easy'

export interface Flashcard {
  id: string
  document_id: string | null
  subject_id: string | null
  user_id: string
  front: string
  back: string
  topic: string | null
  difficulty: DifficultyLevel
  source: string | null
  review_count: number
  confidence: FlashcardConfidence | null
  last_reviewed: string | null
  next_review: string | null
  created_at: string
}

export interface FlashcardReview {
  id: string
  flashcard_id: string
  user_id: string
  confidence: FlashcardConfidence
  reviewed_at: string
}

// ─── Exams & Planning ────────────────────────────────────────────────────────

export interface Exam {
  id: string
  user_id: string
  subject_id: string | null
  name: string
  exam_date: string
  daily_available_minutes: number
  current_knowledge_level: DifficultyLevel
  units: string[]
  notes: string | null
  created_at: string
  updated_at: string
}

export type StudyTaskType = 'study' | 'quiz' | 'flashcards' | 'revision' | 'rest'
export type StudyTaskStatus = 'pending' | 'completed' | 'skipped' | 'rescheduled'

export interface StudyTask {
  id: string
  exam_id: string | null
  user_id: string
  title: string
  description: string | null
  task_type: StudyTaskType
  scheduled_date: string
  duration_minutes: number
  status: StudyTaskStatus
  subject_id: string | null
  chapter_id: string | null
  created_at: string
  updated_at: string
}

// ─── Progress & Analytics ─────────────────────────────────────────────────────

export interface StudySession {
  id: string
  user_id: string
  subject_id: string | null
  topic: string | null
  activity_type: StudyTaskType
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  created_at: string
}

export interface WeakTopic {
  id: string
  user_id: string
  subject_id: string | null
  topic: string
  accuracy_percentage: number
  attempt_count: number
  last_attempted: string | null
  needs_revision: boolean
  created_at: string
  updated_at: string
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | 'study_reminder'
  | 'quiz_reminder'
  | 'exam_reminder'
  | 'flashcards_due'
  | 'weak_topic'
  | 'system'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  metadata: Record<string, unknown> | null
  created_at: string
}

// ─── Usage & Subscriptions ───────────────────────────────────────────────────

export type SubscriptionTier = 'free' | 'pro' | 'college'

export interface Subscription {
  id: string
  user_id: string
  tier: SubscriptionTier
  started_at: string
  expires_at: string | null
  created_at: string
}

export interface UsageLimit {
  id: string
  user_id: string
  feature: string
  count: number
  period: string
  reset_at: string
  created_at: string
  updated_at: string
}

// ─── AI ──────────────────────────────────────────────────────────────────────

export interface AIGenerationRecord {
  id: string
  user_id: string
  feature: string
  model: string
  prompt_tokens: number | null
  completion_tokens: number | null
  created_at: string
}

// ─── API Response Shapes ──────────────────────────────────────────────────────

export interface ApiResponse<T = void> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  has_more: boolean
}

// ─── Badges ──────────────────────────────────────────────────────────────────

export interface UserBadge {
  id: string
  user_id: string
  badge_id: string
  earned_at: string
}

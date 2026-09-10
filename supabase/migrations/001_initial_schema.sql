-- ============================================================
-- StudySnap AI — Initial Database Schema
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- PROFILES
-- ============================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  learning_level TEXT NOT NULL DEFAULT 'college'
    CHECK (learning_level IN ('beginner', 'simple', 'college', 'exam', 'interview')),
  preferred_language TEXT NOT NULL DEFAULT 'english'
    CHECK (preferred_language IN ('english', 'tamil', 'hindi')),
  daily_goal_minutes INTEGER NOT NULL DEFAULT 60,
  streak_days INTEGER NOT NULL DEFAULT 0,
  total_xp INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON profiles(email);

-- ============================================================
-- SUBJECTS
-- ============================================================

CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#6366f1',
  icon TEXT NOT NULL DEFAULT 'book',
  semester TEXT,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subjects_user_id ON subjects(user_id);
CREATE INDEX idx_subjects_archived ON subjects(archived);

-- ============================================================
-- CHAPTERS
-- ============================================================

CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chapters_subject_id ON chapters(subject_id);
CREATE INDEX idx_chapters_user_id ON chapters(user_id);

-- ============================================================
-- DOCUMENTS
-- ============================================================

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'image', 'text')),
  file_size BIGINT NOT NULL DEFAULT 0,
  page_count INTEGER,
  status TEXT NOT NULL DEFAULT 'uploading'
    CHECK (status IN ('uploading', 'reading', 'extracting', 'understanding', 'indexing', 'ready', 'failed')),
  error_message TEXT,
  extracted_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_subject_id ON documents(subject_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);

-- ============================================================
-- DOCUMENT CHUNKS (with pgvector embeddings)
-- ============================================================

CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  page_number INTEGER,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  chapter TEXT,
  topic TEXT,
  embedding vector(768),  -- nomic-embed-text-v1_5 dimension
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_document_chunks_user_id ON document_chunks(user_id);
CREATE INDEX idx_document_chunks_content ON document_chunks USING gin(to_tsvector('english', content));

-- Vector similarity search index
CREATE INDEX idx_document_chunks_embedding ON document_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ============================================================
-- SUMMARIES
-- ============================================================

CREATE TABLE summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  summary_type TEXT NOT NULL DEFAULT 'detailed'
    CHECK (summary_type IN ('quick', 'detailed', 'exam', 'simple', 'deep')),
  language TEXT NOT NULL DEFAULT 'english',
  difficulty TEXT NOT NULL DEFAULT 'college',
  title TEXT NOT NULL,
  overview TEXT NOT NULL,
  key_points JSONB NOT NULL DEFAULT '[]',
  definitions JSONB NOT NULL DEFAULT '[]',
  important_concepts JSONB NOT NULL DEFAULT '[]',
  examples JSONB NOT NULL DEFAULT '[]',
  exam_tips JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_summaries_document_id ON summaries(document_id);
CREATE INDEX idx_summaries_user_id ON summaries(user_id);

-- ============================================================
-- QUESTIONS
-- ============================================================

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium'
    CHECK (difficulty IN ('easy', 'medium', 'hard')),
  topic TEXT,
  question_type TEXT NOT NULL DEFAULT 'mcq'
    CHECK (question_type IN ('mcq', 'true_false', 'fill_blank', 'short_answer')),
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_questions_user_id ON questions(user_id);
CREATE INDEX idx_questions_document_id ON questions(document_id);
CREATE INDEX idx_questions_subject_id ON questions(subject_id);
CREATE INDEX idx_questions_topic ON questions(topic);

-- ============================================================
-- QUIZZES
-- ============================================================

CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  question_count INTEGER NOT NULL DEFAULT 10,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quizzes_user_id ON quizzes(user_id);

CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);

CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL,
  correct_count INTEGER NOT NULL DEFAULT 0,
  incorrect_count INTEGER NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER,
  completed_at TIMESTAMPTZ,
  topic_performance JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_created_at ON quiz_attempts(created_at DESC);

CREATE TABLE quiz_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quiz_answers_attempt_id ON quiz_answers(attempt_id);

-- ============================================================
-- FLASHCARDS
-- ============================================================

CREATE TABLE flashcards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  topic TEXT,
  difficulty TEXT NOT NULL DEFAULT 'medium'
    CHECK (difficulty IN ('easy', 'medium', 'hard')),
  source TEXT,
  review_count INTEGER NOT NULL DEFAULT 0,
  confidence TEXT CHECK (confidence IN ('again', 'hard', 'good', 'easy')),
  last_reviewed TIMESTAMPTZ,
  next_review TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX idx_flashcards_subject_id ON flashcards(subject_id);
CREATE INDEX idx_flashcards_next_review ON flashcards(next_review);
CREATE INDEX idx_flashcards_topic ON flashcards(topic);

CREATE TABLE flashcard_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flashcard_id UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  confidence TEXT NOT NULL CHECK (confidence IN ('again', 'hard', 'good', 'easy')),
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_flashcard_reviews_flashcard_id ON flashcard_reviews(flashcard_id);
CREATE INDEX idx_flashcard_reviews_user_id ON flashcard_reviews(user_id);

-- ============================================================
-- EXAMS & STUDY PLANS
-- ============================================================

CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  exam_date DATE NOT NULL,
  daily_available_minutes INTEGER NOT NULL DEFAULT 120,
  current_knowledge_level TEXT NOT NULL DEFAULT 'medium'
    CHECK (current_knowledge_level IN ('easy', 'medium', 'hard')),
  units JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exams_user_id ON exams(user_id);
CREATE INDEX idx_exams_exam_date ON exams(exam_date);

CREATE TABLE study_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL DEFAULT 'study'
    CHECK (task_type IN ('study', 'quiz', 'flashcards', 'revision', 'rest')),
  scheduled_date DATE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'skipped', 'rescheduled')),
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_study_tasks_user_id ON study_tasks(user_id);
CREATE INDEX idx_study_tasks_scheduled_date ON study_tasks(scheduled_date);
CREATE INDEX idx_study_tasks_status ON study_tasks(status);

-- ============================================================
-- STUDY SESSIONS
-- ============================================================

CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  topic TEXT,
  activity_type TEXT NOT NULL DEFAULT 'study'
    CHECK (activity_type IN ('study', 'quiz', 'flashcards', 'revision', 'rest')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_study_sessions_started_at ON study_sessions(started_at DESC);

-- ============================================================
-- WEAK TOPICS
-- ============================================================

CREATE TABLE weak_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  topic TEXT NOT NULL,
  accuracy_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_attempted TIMESTAMPTZ,
  needs_revision BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, topic, subject_id)
);

CREATE INDEX idx_weak_topics_user_id ON weak_topics(user_id);
CREATE INDEX idx_weak_topics_accuracy ON weak_topics(accuracy_percentage);
CREATE INDEX idx_weak_topics_needs_revision ON weak_topics(needs_revision);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL
    CHECK (type IN ('study_reminder', 'quiz_reminder', 'exam_reminder', 'flashcards_due', 'weak_topic', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================
-- SUBSCRIPTIONS & USAGE
-- ============================================================

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'college')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);

CREATE TABLE usage_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  period TEXT NOT NULL,
  reset_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, feature, period)
);

CREATE INDEX idx_usage_limits_user_id ON usage_limits(user_id);
CREATE INDEX idx_usage_limits_feature ON usage_limits(feature);

-- ============================================================
-- AI GENERATION LOG
-- ============================================================

CREATE TABLE ai_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'llama-3.3-70b-versatile',
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_generations_user_id ON ai_generations(user_id);
CREATE INDEX idx_ai_generations_created_at ON ai_generations(created_at DESC);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON chapters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_study_tasks_updated_at BEFORE UPDATE ON study_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_weak_topics_updated_at BEFORE UPDATE ON weak_topics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_usage_limits_updated_at BEFORE UPDATE ON usage_limits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Increment usage count function (atomic)
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_feature TEXT,
  p_period TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE usage_limits
  SET count = count + 1, updated_at = NOW()
  WHERE user_id = p_user_id
    AND feature = p_feature
    AND period = p_period;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vector similarity search function
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding TEXT,
  match_user_id UUID,
  filter_document_id UUID DEFAULT NULL,
  match_count INTEGER DEFAULT 5
)
RETURNS TABLE(
  content TEXT,
  page_number INTEGER,
  document_id UUID,
  similarity FLOAT
) AS $$
DECLARE
  query_vec vector(768);
BEGIN
  query_vec := query_embedding::vector;

  RETURN QUERY
  SELECT
    dc.content,
    dc.page_number,
    dc.document_id,
    1 - (dc.embedding <=> query_vec) as similarity
  FROM document_chunks dc
  WHERE dc.user_id = match_user_id
    AND dc.embedding IS NOT NULL
    AND (filter_document_id IS NULL OR dc.document_id = filter_document_id)
  ORDER BY dc.embedding <=> query_vec
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create free subscription
  INSERT INTO subscriptions (user_id, tier)
  VALUES (NEW.id, 'free')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all user tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weak_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

-- ─── RLS Policies ─────────────────────────────────────────────────────────────

-- Profiles: users can only see/edit their own
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (auth.uid() = id);

-- Subjects
CREATE POLICY "subjects_own" ON subjects FOR ALL USING (auth.uid() = user_id);

-- Chapters
CREATE POLICY "chapters_own" ON chapters FOR ALL USING (auth.uid() = user_id);

-- Documents
CREATE POLICY "documents_own" ON documents FOR ALL USING (auth.uid() = user_id);

-- Document chunks
CREATE POLICY "chunks_own" ON document_chunks FOR ALL USING (auth.uid() = user_id);

-- Summaries
CREATE POLICY "summaries_own" ON summaries FOR ALL USING (auth.uid() = user_id);

-- Questions
CREATE POLICY "questions_own" ON questions FOR ALL USING (auth.uid() = user_id);

-- Quizzes
CREATE POLICY "quizzes_own" ON quizzes FOR ALL USING (auth.uid() = user_id);

-- Quiz questions (via quiz ownership)
CREATE POLICY "quiz_questions_own" ON quiz_questions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM quizzes WHERE quizzes.id = quiz_questions.quiz_id AND quizzes.user_id = auth.uid()
  ));

-- Quiz attempts
CREATE POLICY "quiz_attempts_own" ON quiz_attempts FOR ALL USING (auth.uid() = user_id);

-- Quiz answers (via attempt ownership)
CREATE POLICY "quiz_answers_own" ON quiz_answers FOR ALL
  USING (EXISTS (
    SELECT 1 FROM quiz_attempts WHERE quiz_attempts.id = quiz_answers.attempt_id AND quiz_attempts.user_id = auth.uid()
  ));

-- Flashcards
CREATE POLICY "flashcards_own" ON flashcards FOR ALL USING (auth.uid() = user_id);

-- Flashcard reviews
CREATE POLICY "flashcard_reviews_own" ON flashcard_reviews FOR ALL USING (auth.uid() = user_id);

-- Exams
CREATE POLICY "exams_own" ON exams FOR ALL USING (auth.uid() = user_id);

-- Study tasks
CREATE POLICY "study_tasks_own" ON study_tasks FOR ALL USING (auth.uid() = user_id);

-- Study sessions
CREATE POLICY "study_sessions_own" ON study_sessions FOR ALL USING (auth.uid() = user_id);

-- Weak topics
CREATE POLICY "weak_topics_own" ON weak_topics FOR ALL USING (auth.uid() = user_id);

-- Notifications
CREATE POLICY "notifications_own" ON notifications FOR ALL USING (auth.uid() = user_id);

-- Subscriptions
CREATE POLICY "subscriptions_own" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Usage limits
CREATE POLICY "usage_limits_own" ON usage_limits FOR SELECT USING (auth.uid() = user_id);

-- AI generations
CREATE POLICY "ai_generations_own" ON ai_generations FOR ALL USING (auth.uid() = user_id);

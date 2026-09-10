-- ============================================================
-- StudySnap AI — Migration 003: Full-text search & performance
-- ============================================================

-- Full-text search on documents name + extracted text
CREATE INDEX IF NOT EXISTS idx_documents_fts
  ON documents
  USING gin(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(extracted_text, '')));

-- Full-text search on questions
CREATE INDEX IF NOT EXISTS idx_questions_fts
  ON questions
  USING gin(to_tsvector('english', question || ' ' || coalesce(explanation, '')));

-- Full-text search on flashcards
CREATE INDEX IF NOT EXISTS idx_flashcards_fts
  ON flashcards
  USING gin(to_tsvector('english', front || ' ' || back));

-- Global search function (searches documents, flashcards, and quizzes)
CREATE OR REPLACE FUNCTION global_search(
  p_user_id UUID,
  p_query TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  type TEXT,
  title TEXT,
  snippet TEXT,
  url TEXT
) AS $$
BEGIN
  -- Search documents
  RETURN QUERY
  SELECT
    d.id,
    'document'::TEXT,
    d.name,
    left(coalesce(d.extracted_text, ''), 120),
    ('/dashboard/notes/' || d.id::TEXT)::TEXT
  FROM documents d
  WHERE d.user_id = p_user_id
    AND d.status = 'ready'
    AND to_tsvector('english', d.name || ' ' || coalesce(d.extracted_text, ''))
        @@ plainto_tsquery('english', p_query)
  LIMIT p_limit / 3;

  -- Search flashcards
  RETURN QUERY
  SELECT
    f.id,
    'flashcard'::TEXT,
    f.front,
    left(f.back, 120),
    '/dashboard/flashcards'::TEXT
  FROM flashcards f
  WHERE f.user_id = p_user_id
    AND to_tsvector('english', f.front || ' ' || f.back)
        @@ plainto_tsquery('english', p_query)
  LIMIT p_limit / 3;

  -- Search questions
  RETURN QUERY
  SELECT
    q.id,
    'question'::TEXT,
    q.question,
    left(q.explanation, 120),
    '/dashboard/quizzes'::TEXT
  FROM questions q
  WHERE q.user_id = p_user_id
    AND to_tsvector('english', q.question || ' ' || coalesce(q.explanation, ''))
        @@ plainto_tsquery('english', p_query)
  LIMIT p_limit / 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

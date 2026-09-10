-- ============================================================
-- StudySnap AI — Migration 002: Helper Functions & Indexes
-- ============================================================

-- XP increment function
CREATE OR REPLACE FUNCTION increment_xp(p_user_id UUID, p_xp INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET total_xp = total_xp + p_xp,
      updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Streak update function (call daily via cron or after study session)
CREATE OR REPLACE FUNCTION update_streak(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  last_session TIMESTAMPTZ;
  yesterday_start TIMESTAMPTZ;
  yesterday_end TIMESTAMPTZ;
BEGIN
  yesterday_start := date_trunc('day', NOW() - interval '1 day');
  yesterday_end   := date_trunc('day', NOW());

  SELECT MAX(started_at) INTO last_session
  FROM study_sessions
  WHERE user_id = p_user_id
    AND started_at >= yesterday_start
    AND started_at < yesterday_end;

  IF last_session IS NOT NULL THEN
    -- User studied yesterday → increment streak
    UPDATE profiles
    SET streak_days = streak_days + 1,
        updated_at  = NOW()
    WHERE id = p_user_id;
  ELSE
    -- No session yesterday → reset streak
    UPDATE profiles
    SET streak_days = 0,
        updated_at  = NOW()
    WHERE id = p_user_id
      AND streak_days > 0;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Additional performance indexes
CREATE INDEX IF NOT EXISTS idx_summaries_type     ON summaries(summary_type);
CREATE INDEX IF NOT EXISTS idx_flashcards_confidence ON flashcards(confidence);
CREATE INDEX IF NOT EXISTS idx_study_tasks_exam_id ON study_tasks(exam_id);
CREATE INDEX IF NOT EXISTS idx_weak_topics_topic   ON weak_topics(topic);
CREATE INDEX IF NOT EXISTS idx_notifications_type  ON notifications(type);

-- View: user dashboard stats (used by dashboard page)
CREATE OR REPLACE VIEW user_dashboard_stats AS
SELECT
  p.id AS user_id,
  p.streak_days,
  p.total_xp,
  p.daily_goal_minutes,
  COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'ready')             AS ready_docs,
  COUNT(DISTINCT s.id)                                                AS total_subjects,
  COUNT(DISTINCT qa.id) FILTER (WHERE qa.completed_at IS NOT NULL)   AS completed_quizzes,
  COUNT(DISTINCT f.id)                                                AS total_flashcards,
  COUNT(DISTINCT f.id) FILTER (WHERE f.next_review <= NOW())         AS due_flashcards,
  COALESCE(SUM(ss.duration_seconds) FILTER (
    WHERE ss.started_at >= date_trunc('week', NOW())
  ), 0) / 60                                                          AS weekly_study_minutes
FROM profiles p
LEFT JOIN documents        d  ON d.user_id = p.id
LEFT JOIN subjects         s  ON s.user_id = p.id AND NOT s.archived
LEFT JOIN quiz_attempts    qa ON qa.user_id = p.id
LEFT JOIN flashcards       f  ON f.user_id  = p.id
LEFT JOIN study_sessions   ss ON ss.user_id = p.id
GROUP BY p.id, p.streak_days, p.total_xp, p.daily_goal_minutes;

-- Grant select on view to authenticated users (RLS via profiles.id = auth.uid())
GRANT SELECT ON user_dashboard_stats TO authenticated;

-- ============================================================
-- Supabase Storage policy: private documents bucket
-- Run this in the Supabase dashboard → Storage → Policies
-- ============================================================

-- Documents bucket: users can only access their own files
-- (path convention: {user_id}/{filename})

-- INSERT policy
-- CREATE POLICY "Users upload own docs"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- SELECT policy
-- CREATE POLICY "Users read own docs"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- DELETE policy
-- CREATE POLICY "Users delete own docs"
-- ON storage.objects FOR DELETE
-- USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- XP increment via simple UPDATE (fallback if rpc not used)
-- Called from quiz attempt API
CREATE OR REPLACE FUNCTION increment_xp(p_user_id UUID, p_xp INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
     SET total_xp  = total_xp + p_xp,
         updated_at = NOW()
   WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- User badges table
-- ============================================================
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_badges_own" ON user_badges FOR ALL USING (auth.uid() = user_id);

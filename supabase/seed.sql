-- ============================================================
-- StudySnap AI — Development Seed Data
-- Only for development environments. Do NOT run in production.
-- ============================================================

-- NOTE: Replace 'YOUR_TEST_USER_ID' with a real Supabase auth user ID
-- after creating a test account via the app.

-- Example subject
-- INSERT INTO subjects (id, user_id, name, description, color, semester)
-- VALUES (
--   gen_random_uuid(),
--   'YOUR_TEST_USER_ID',
--   'Database Management Systems',
--   'SQL, Normalization, Transactions, Indexing',
--   '#6366f1',
--   'Semester 6'
-- );

-- Example chapters
-- INSERT INTO chapters (subject_id, user_id, name, order_index)
-- VALUES
--   ('SUBJECT_ID', 'YOUR_TEST_USER_ID', 'Unit 1: Introduction', 0),
--   ('SUBJECT_ID', 'YOUR_TEST_USER_ID', 'Unit 2: Relational Model', 1),
--   ('SUBJECT_ID', 'YOUR_TEST_USER_ID', 'Unit 3: SQL', 2),
--   ('SUBJECT_ID', 'YOUR_TEST_USER_ID', 'Unit 4: Normalization', 3),
--   ('SUBJECT_ID', 'YOUR_TEST_USER_ID', 'Unit 5: Transactions', 4);

-- Example weak topic (for testing the dashboard)
-- INSERT INTO weak_topics (user_id, topic, accuracy_percentage, attempt_count, needs_revision)
-- VALUES
--   ('YOUR_TEST_USER_ID', 'Functional Dependencies', 42.0, 5, true),
--   ('YOUR_TEST_USER_ID', 'ACID Properties', 60.0, 4, true),
--   ('YOUR_TEST_USER_ID', 'SQL Joins', 85.0, 8, false);

-- Subscription (free tier — created automatically on signup via trigger)
-- INSERT INTO subscriptions (user_id, tier) VALUES ('YOUR_TEST_USER_ID', 'free')
-- ON CONFLICT (user_id) DO NOTHING;

-- To use: uncomment the above, replace placeholders, and run in Supabase SQL editor.
-- After signing up in the app, find your user ID in Authentication > Users.

SELECT 'Seed file loaded. Uncomment and configure before running.' AS status;

-- ============================================================
-- NOOI.NET — Live Session visibility & sample data
-- Allows all authenticated users to view live sessions
-- ============================================================

-- 1. Policy: all authenticated users can SELECT live_sessions
CREATE POLICY IF NOT EXISTS "select_all_live_sessions"
  ON documents
  FOR SELECT
  USING (auth.role() = 'authenticated' AND file_type = 'live_session');

-- 2. Policy: all authenticated users can INSERT registrations
CREATE POLICY IF NOT EXISTS "insert_own_registrations"
  ON documents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND file_type IN ('live_registration', 'live_session'));

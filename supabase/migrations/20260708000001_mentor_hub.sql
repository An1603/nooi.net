-- NOOI — Mentor Hub & Groups Schema
-- ============================================================

-- Mentors
CREATE TABLE IF NOT EXISTS mentors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  bio TEXT,
  specialties TEXT[] DEFAULT '{}',
  experience_years INTEGER DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mentor-Mentee relationships
CREATE TABLE IF NOT EXISTS mentor_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
  mentee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(mentor_id, mentee_id)
);

-- Groups
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  mentor_id UUID REFERENCES mentors(id) ON DELETE SET NULL,
  max_members INTEGER DEFAULT 20,
  schedule TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Group members
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'mentor', 'leader')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- RLS
ALTER TABLE mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "mentors_select" ON mentors FOR SELECT USING (true);
CREATE POLICY "mentors_insert" ON mentors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mentors_update" ON mentors FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "rel_select" ON mentor_relationships FOR SELECT USING (auth.uid() = mentee_id OR auth.uid() IN (SELECT user_id FROM mentors WHERE id = mentor_id));
CREATE POLICY "rel_insert" ON mentor_relationships FOR INSERT WITH CHECK (auth.uid() = mentee_id);
CREATE POLICY "rel_update" ON mentor_relationships FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM mentors WHERE id = mentor_id));

CREATE POLICY "groups_select" ON groups FOR SELECT USING (true);

CREATE POLICY "gm_select" ON group_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "gm_insert" ON group_members FOR INSERT WITH CHECK (auth.uid() = user_id);

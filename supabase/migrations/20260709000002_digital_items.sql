-- Kho Vật Phẩm Đồ Họa NOOI
-- Phase 1: digital_items + user_items

-- ─── 1. Digital Items ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS digital_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('hoc-tap', 'ky-niem', 'qua-tang')),
  type TEXT NOT NULL CHECK (type IN ('image', 'pdf', 'svg')),
  image_url TEXT,
  file_url TEXT,
  price_n INT DEFAULT 0,
  level_required INT DEFAULT 0,
  auto_unlock BOOLEAN DEFAULT false,
  description TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE digital_items ENABLE ROW LEVEL SECURITY;

-- PUBLIC can READ all items
CREATE POLICY "digital_items_select_policy"
  ON digital_items FOR SELECT
  USING (true);

-- Only service role can INSERT/UPDATE/DELETE
CREATE POLICY "digital_items_insert_policy"
  ON digital_items FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "digital_items_update_policy"
  ON digital_items FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "digital_items_delete_policy"
  ON digital_items FOR DELETE
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ─── 2. User Items ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES digital_items(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  source TEXT NOT NULL CHECK (source IN ('purchase', 'achievement', 'gift')),
  UNIQUE(user_id, item_id)
);

ALTER TABLE user_items ENABLE ROW LEVEL SECURITY;

-- User can READ their own items
CREATE POLICY "user_items_select_policy"
  ON user_items FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can INSERT/UPDATE/DELETE
CREATE POLICY "user_items_insert_policy"
  ON user_items FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR auth.uid() = user_id);

CREATE POLICY "user_items_update_policy"
  ON user_items FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "user_items_delete_policy"
  ON user_items FOR DELETE
  USING (auth.uid() = user_id);

-- ─── 3. Indexes ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_user_items_user_id ON user_items(user_id);
CREATE INDEX IF NOT EXISTS idx_user_items_item_id ON user_items(item_id);
CREATE INDEX IF NOT EXISTS idx_digital_items_category ON digital_items(category);
CREATE INDEX IF NOT EXISTS idx_digital_items_sort ON digital_items(sort_order);

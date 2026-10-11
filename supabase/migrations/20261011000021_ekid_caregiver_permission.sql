-- eKid v2.4 — mở rộng role (thêm ong/ba) + cột permission cho ekid_caregivers.
-- permission: 'viewer' (người thân chỉ đọc) | 'admin' (đồng quản lý hồ sơ bé).
-- role cũ: cha/me/nguoi-giam-ho → bổ sung ong (ông) và ba (bà).

ALTER TABLE public.ekid_caregivers
  ADD COLUMN IF NOT EXISTS permission TEXT NOT NULL DEFAULT 'viewer'
  CHECK (permission IN ('admin', 'viewer'));

ALTER TABLE public.ekid_caregivers
  DROP CONSTRAINT IF EXISTS ekid_caregivers_role_check;

ALTER TABLE public.ekid_caregivers
  ADD CONSTRAINT ekid_caregivers_role_check
  CHECK (role IN ('cha', 'me', 'ong', 'ba', 'nguoi-giam-ho'));
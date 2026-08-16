-- Khởi tạo migration (chạy trên production VPS):
-- Xuất file SQL hoàn chỉnh, verify cú pháp
-- Đảm bảo format UUID thích hợp cho database hiện tại
-- ===========================================
-- Bước 1: Kết nối máy
-- ssh -p4821 hadmin@nooi.net
-- ===========================================
-- Bước 2: Chạy migration
-- cd ~/nooi.net && 
-- npx supabase db push
-- ===========================================
-- Hoặc: Thực thi từng phần
-- psql -d PGDATABASE -U PGUSER -h PGHOST -p PGPORT -f ~/nooi.net/supabase/migrations/20260811_investment_system.sql


-- ========= ĐÂY LÀ MIGRATION ĐÃ FIX TYPE MISMATCH =========
-- (Chuẩn xác uuid, áp dụng liền)

-- ===========================================
-- 1. Mở rộng bảng projects hiện có (uuid)
-- ===========================================
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS investment_target integer DEFAULT 0 CHECK (investment_target >= 0),
  ADD COLUMN IF NOT EXISTS break_even integer DEFAULT 0 CHECK (break_even >= 0),
  ADD COLUMN IF NOT EXISTS revenue_share text,
  ADD COLUMN IF NOT EXISTS roi_estimate jsonb;

-- ===========================================
-- 2. Bảng investments (đăng ký đầu tư)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.investments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL DEFAULT 0 CHECK (amount > 0),
  investment_date date DEFAULT CURRENT_DATE,
  payment_status varchar(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled', 'failed')),
  payment_method varchar(50),
  investor_name varchar(255),
  investor_email varchar(255),
  investor_phone text,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT valid_investment CHECK (amount > 0 AND payment_status IS NOT NULL)
);

-- ===========================================
-- 3. Bảng project_progress (lịch sử tiến độ)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.project_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  progress_date date NOT NULL,
  progress_percent integer NOT NULL CHECK (progress_percent >= 0 AND progress_percent <= 100),
  milestones_completed text[],
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  created_by uuid REFERENCES auth.users(id),
  CONSTRAINT valid_progress CHECK (progress_percent >= 0 AND progress_percent <= 100)
);

-- ===========================================
-- 4. Indexes để tối ưu query
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_investments_project_id ON public.investments(project_id);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON public.investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_payment_status ON public.investments(payment_status);
CREATE INDEX IF NOT EXISTS idx_project_progress_project_id ON public.project_progress(project_id);
CREATE INDEX IF NOT EXISTS idx_project_progress_date ON public.project_progress(project_id, progress_date DESC);

-- ===========================================
-- 5. Policies RLS (Row Level Security)
-- ===========================================

-- Policies cho bảng investments
CREATE POLICY "Public view investments" ON public.investments
  FOR SELECT USING (true); -- Cho phép xem tất cả investments (public)

CREATE POLICY "Admin manage investments" ON public.investments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "User own investments" ON public.investments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "User insert own investments" ON public.investments
  FOR INSERT WITH CHECK (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin')
  ));

CREATE POLICY "User update own investments" ON public.investments
  FOR UPDATE USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin')
  ));

-- Policies cho bảng project_progress
CREATE POLICY "Public view progress" ON public.project_progress
  FOR SELECT USING (true); -- Cho phép xem tất cả tiến độ (public)

CREATE POLICY "Admin manage progress" ON public.project_progress
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Project owner manage progress" ON public.project_progress
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- ===========================================
-- 6. Trigger để auto-update updated_at
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_investments_updated_at ON public.investments;
CREATE TRIGGER update_investments_updated_at
  BEFORE UPDATE ON public.investments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON FUNCTION update_updated_at_column() IS 'Tự động cập nhật updated_at khi có thay đổi';

-- ===========================================
-- 7. View aggregates (cơ sở cho dashboard)
-- ===========================================
CREATE OR REPLACE VIEW project_investment_summary AS
SELECT 
  p.id as project_id,
  p.title,
  p.investment_target,
  COALESCE(SUM(i.amount), 0) as total_raised,
  ROUND(COALESCE(SUM(i.amount), 0) / NULLIF(p.investment_target, 0) * 100, 2) as funding_percentage,
  COUNT(i.id) as total_investors,
  COALESCE(AVG(i.amount), 0) as avg_investment,
  MAX(i.investment_date) as last_investment_date
FROM public.projects p
LEFT JOIN public.investments i ON p.id = i.project_id AND i.payment_status = 'paid'
GROUP BY p.id, p.title, p.investment_target;

CREATE OR REPLACE VIEW project_progress_summary AS
SELECT 
  p.id as project_id,
  p.title,
  MAX(pp.progress_percent) as latest_progress,
  (SELECT COUNT(*) FROM project_progress WHERE project_id = p.id) as total_milestones,
  (SELECT progress_date FROM project_progress WHERE project_id = p.id ORDER BY progress_date DESC LIMIT 1) as last_update_date
FROM public.projects p
LEFT JOIN public.project_progress pp ON p.id = pp.project_id
GROUP BY p.id, p.title;

-- Chạy xong migration này, kiểm tra tables:
-- \dt public.projects
-- \dt public.investments
-- \dt public.project_progress

-- Nếu lỗi: \d+ investments
-- Xem index: \d+ investments
-- Xóa table: DROP TABLE public.investments;
-- Xóa triggers: DROP TRIGGER update_investments_updated_at ON public.investments;

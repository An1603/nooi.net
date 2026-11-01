-- Siết quyền sau kiểm chứng ngày 01/11/2026 (audit run-1, mục 5/6/7)
--
-- 1) investments: đang có policy SELECT `true` cho public ⇒ khách vãng lai đọc được
--    tên nhà đầu tư + số tiền góp vốn. Bỏ hết policy, chỉ service-role dùng.
-- 2) digital_items: policy SELECT `true` kèm cột `file_url` ⇒ lộ đường dẫn tệp trả phí.
--    Giữ catalog công khai nhưng thu hồi quyền đọc cột file_url với anon/authenticated.
-- 3) user_items: policy INSERT cho phép thành viên tự chèn dòng sở hữu ⇒ tự mở khoá
--    vật phẩm trả phí. Bỏ policy; mọi insert đi qua service-role ở route (unlock/gift).

BEGIN;

-- ── 1. investments ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public view investments" ON public.investments;
DROP POLICY IF EXISTS "Auth insert investments" ON public.investments;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.investments FROM anon, authenticated;

-- ── 2. digital_items: bỏ file_url khỏi quyền đọc công khai ──────────────────
REVOKE SELECT ON public.digital_items FROM anon, authenticated;
GRANT SELECT (
  id, name, slug, category, type, image_url,
  price_n, level_required, auto_unlock, description, sort_order, created_at
) ON public.digital_items TO anon, authenticated;

-- ── 3. user_items: không cho tự phát hành quyền sở hữu ──────────────────────
DROP POLICY IF EXISTS "user_items_insert_policy" ON public.user_items;

COMMIT;

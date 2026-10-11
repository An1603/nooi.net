-- eKid v2 — Fix C1: cho tài khoản CON tự đọc dòng ekid_kids của mình.
-- Trước đây ekid_kids chỉ có policy cho phụ huynh (ekid_kids_owner/user_id) và
-- người chăm sóc (ekid_kids_caregiver_read). Khi middleware dùng JWT của CON để
-- query .eq('child_user_id', auth.uid()) → RLS chặn → luôn rỗng → con bị nhận
-- nhầm là người lớn. Policy dưới đây cho phép CON SELECT đúng dòng của mình.

DROP POLICY IF EXISTS "ekid_kids_child_read" ON public.ekid_kids;
CREATE POLICY "ekid_kids_child_read" ON public.ekid_kids
  FOR SELECT TO authenticated USING (child_user_id = auth.uid());

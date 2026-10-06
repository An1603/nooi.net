DROP VIEW IF EXISTS public.project_investment_summary;
ALTER TABLE public.investments ALTER COLUMN amount TYPE bigint;
CREATE VIEW public.project_investment_summary AS SELECT p.id AS project_id, p.title, p.investment_target, COALESCE(sum(i.amount), 0::bigint) AS total_raised, count(i.id) AS total_investors FROM projects p LEFT JOIN investments i ON p.id = i.project_id AND i.payment_status::text = 'paid'::text GROUP BY p.id, p.title, p.investment_target;
INSERT INTO public.investments (project_id, user_id, investor_name, amount, payment_status, investment_date, notes) VALUES ('44b1faf9-5d03-4aee-8b5c-42bdfb41d8c7', NULL, 'Nguyễn An', 2600000000, 'paid', '2026-10-06', 'Góp vốn cổ đông sáng lập — cấu trúc FINAL v5 (26%)'), ('44b1faf9-5d03-4aee-8b5c-42bdfb41d8c7', NULL, 'Hà Hùng', 1200000000, 'paid', '2026-10-06', 'Góp vốn cổ đông sáng lập — cấu trúc FINAL v5 (12%)');
SELECT investor_name, amount, payment_status, investment_date FROM public.investments WHERE project_id='44b1faf9-5d03-4aee-8b5c-42bdfb41d8c7' ORDER BY amount DESC;
SELECT project_id, investment_target, total_raised, total_investors FROM public.project_investment_summary;

INSERT INTO public.investments (project_id, user_id, investor_name, amount, payment_status, investment_date, notes) VALUES ('44b1faf9-5d03-4aee-8b5c-42bdfb41d8c7', NULL, 'Đỗ Phạm Thái', 300000000, 'paid', '2026-10-06', 'Góp vốn cổ đông sáng lập — cổ phần tiền mặt 3% (FINAL v5)');
SELECT investor_name, amount, payment_status FROM public.investments WHERE project_id='44b1faf9-5d03-4aee-8b5c-42bdfb41d8c7' ORDER BY amount DESC;
SELECT investment_target, total_raised, total_investors FROM public.project_investment_summary;

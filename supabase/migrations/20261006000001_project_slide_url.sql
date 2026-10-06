-- Thêm URL tài liệu (slide) cho dự án đầu tư — nối /app/projects với slides.nooi.net
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS slide_html_url text;
COMMENT ON COLUMN public.projects.slide_html_url IS 'URL bản trình bày (slide) của dự án, thường trỏ tới slides.nooi.net/<slug>/';
UPDATE public.projects SET slide_html_url = 'https://slides.nooi.net/nooi-forest/'
 WHERE title = 'NOOI Forest' AND (slide_html_url IS NULL OR slide_html_url = '');

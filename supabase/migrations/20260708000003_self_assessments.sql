-- Tạo bảng self_assessments
CREATE TABLE IF NOT EXISTS public.self_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL DEFAULT 'self_7axes',
  scores JSONB,
  raw_answers JSONB,
  current_question INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, assessment_type)
);

-- Enable RLS
ALTER TABLE public.self_assessments ENABLE ROW LEVEL SECURITY;

-- Policy: user đọc dữ liệu của chính mình
CREATE POLICY "Users can read own assessments"
  ON public.self_assessments FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: user ghi dữ liệu của chính mình
CREATE POLICY "Users can insert own assessments"
  ON public.self_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: user cập nhật dữ liệu của chính mình
CREATE POLICY "Users can update own assessments"
  ON public.self_assessments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: user xóa dữ liệu của chính mình
CREATE POLICY "Users can delete own assessments"
  ON public.self_assessments FOR DELETE
  USING (auth.uid() = user_id);

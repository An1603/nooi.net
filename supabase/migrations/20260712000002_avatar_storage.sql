-- ============================================================
-- NOOI Public Profile: Avatar Storage Bucket
-- ============================================================

-- Insert the bucket (idempotent — IF NOT EXISTS is not supported for buckets)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,  -- public read
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[];

-- RLS policy: public read (avatars are public)
DROP POLICY IF EXISTS "public_read_avatars" ON storage.objects;
CREATE POLICY "public_read_avatars" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

-- RLS policy: authenticated users can upload their own avatars
DROP POLICY IF EXISTS "insert_own_avatar" ON storage.objects;
CREATE POLICY "insert_own_avatar" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS policy: users can update their own avatars
DROP POLICY IF EXISTS "update_own_avatar" ON storage.objects;
CREATE POLICY "update_own_avatar" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS policy: users can delete their own avatars
DROP POLICY IF EXISTS "delete_own_avatar" ON storage.objects;
CREATE POLICY "delete_own_avatar" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
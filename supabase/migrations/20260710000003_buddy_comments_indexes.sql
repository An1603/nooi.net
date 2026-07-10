-- Buddy system: add buddy_request and buddy_relationship support via documents table
-- file_type: 'buddy_request' (title=buddy_id, content={status:'pending'|'accepted'|'rejected'})
-- file_type: 'buddy_relationship' (title=buddy_user_id, content={since, streak_together})

-- Comment enhancement: add parent_id for threading, likes tracking
-- We'll use the existing documents table structure
-- For likes: store in content JSON {text, likes_count, liked_by: []}

-- Add index for faster comment queries
CREATE INDEX IF NOT EXISTS idx_documents_comment_thread 
  ON documents(file_type, title) WHERE file_type = 'comment';

-- Add index for buddy queries
CREATE INDEX IF NOT EXISTS idx_documents_buddy 
  ON documents(file_type, user_id) WHERE file_type IN ('buddy_request', 'buddy_relationship');

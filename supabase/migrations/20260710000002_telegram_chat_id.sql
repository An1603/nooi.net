-- Add telegram_chat_id to profiles for Telegram notification
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;

-- Index for quick lookup when sending notifications
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_chat_id 
  ON profiles(telegram_chat_id) 
  WHERE telegram_chat_id IS NOT NULL;

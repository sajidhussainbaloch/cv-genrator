-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  api_key TEXT NOT NULL,
  model TEXT NOT NULL,
  temperature FLOAT DEFAULT 0.7,
  max_tokens INT DEFAULT 4096,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_providers_user ON providers(user_id);

ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (used by backend)
-- Users can only see their own providers
CREATE POLICY "Users can view own providers"
  ON providers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own providers"
  ON providers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own providers"
  ON providers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own providers"
  ON providers FOR DELETE
  USING (auth.uid() = user_id);

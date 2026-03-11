-- ============================================================
-- NG Volunteer Connect — User Content Responses
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS general_onboarding_user_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  block_id uuid REFERENCES general_onboarding_content_blocks(id) ON DELETE CASCADE,
  task_id uuid REFERENCES general_onboarding_tasks(id) ON DELETE CASCADE,
  response_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, block_id)
);

ALTER TABLE general_onboarding_user_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own responses" ON general_onboarding_user_responses;
CREATE POLICY "Users can view their own responses" ON general_onboarding_user_responses FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own responses" ON general_onboarding_user_responses;
CREATE POLICY "Users can insert their own responses" ON general_onboarding_user_responses FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own responses" ON general_onboarding_user_responses;
CREATE POLICY "Users can update their own responses" ON general_onboarding_user_responses FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Wait, the admin also needs to view them eventually, but for now this enables the volunteer frontend.

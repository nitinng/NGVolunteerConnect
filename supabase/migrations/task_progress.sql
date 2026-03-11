-- ============================================================
-- NG Volunteer Connect — General Onboarding Task Progress
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS general_onboarding_task_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id uuid REFERENCES general_onboarding_tasks(id) ON DELETE CASCADE,
    completed_pages integer[] DEFAULT '{}',
    is_completed boolean DEFAULT false,
    completed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, task_id)
);

-- RLS
ALTER TABLE general_onboarding_task_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own progress" ON general_onboarding_task_progress;
CREATE POLICY "Users can view their own progress" 
    ON general_onboarding_task_progress 
    FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own progress" ON general_onboarding_task_progress;
CREATE POLICY "Users can insert their own progress" 
    ON general_onboarding_task_progress 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own progress" ON general_onboarding_task_progress;
CREATE POLICY "Users can update their own progress" 
    ON general_onboarding_task_progress 
    FOR UPDATE 
    USING (auth.uid() = user_id);

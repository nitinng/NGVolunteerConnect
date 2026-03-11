-- ============================================================
-- NG Volunteer Connect — Task Content Blocks Schema Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create content_blocks table
CREATE TABLE IF NOT EXISTS general_onboarding_content_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES general_onboarding_tasks(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text,
  content text,
  order_index integer DEFAULT 0,
  layout text DEFAULT 'full_width',
  page_behavior text DEFAULT 'same_page',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE general_onboarding_content_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "general_onboarding_content_blocks: public read" ON general_onboarding_content_blocks;
CREATE POLICY "general_onboarding_content_blocks: public read" ON general_onboarding_content_blocks FOR SELECT USING (true);

-- 2. Migrate existing content to the new structure (optional safeguard)
DO $$
DECLARE
  task RECORD;
BEGIN
  FOR task IN SELECT * FROM general_onboarding_tasks WHERE content_body IS NOT NULL OR content_url IS NOT NULL LOOP
    IF task.content_type = 'reading' AND task.content_body IS NOT NULL THEN
      INSERT INTO general_onboarding_content_blocks (task_id, type, content, order_index)
      VALUES (task.id, 'text', task.content_body, 1);
    ELSIF task.content_type = 'video' AND task.content_url IS NOT NULL THEN
      INSERT INTO general_onboarding_content_blocks (task_id, type, title, metadata, order_index)
      VALUES (task.id, 'embed', 'Video', jsonb_build_object('url', task.content_url), 1);
      IF task.content_body IS NOT NULL THEN
        INSERT INTO general_onboarding_content_blocks (task_id, type, content, order_index)
        VALUES (task.id, 'text', task.content_body, 2);
      END IF;
    END IF;
  END LOOP;
END $$;

-- 3. We can optionally drop the old columns from the task, but for now we leave them to avoid breaking the UI right away during migration. Once the UI is entirely switched, the older columns can be dropped.
-- ALTER TABLE general_onboarding_tasks DROP COLUMN content_type, DROP COLUMN content_url, DROP COLUMN content_body;

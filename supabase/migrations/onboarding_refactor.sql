-- ============================================================
-- NG Volunteer Connect — Onboarding Schema Refactor
-- Renaming general_onboarding_* to onboarding_*
-- Adding Support for Department-Specific Onboarding
-- ============================================================

BEGIN;

-- 1. Create departments if not exists
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid NOT NULL DEFAULT gen_random_uuid (),
  name text NOT NULL,
  description text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT departments_pkey PRIMARY KEY (id),
  CONSTRAINT departments_name_key UNIQUE (name)
);

-- 2. Handle collision for onboarding_tasks (legacy vs new)
DO $$
BEGIN
    -- If onboarding_tasks exists and is NOT part of the new system (checked by module_id column)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'onboarding_tasks') AND 
       NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'onboarding_tasks' AND column_name = 'module_id') THEN
        
        -- Rename old table
        ALTER TABLE onboarding_tasks RENAME TO legacy_onboarding_tasks;
        
        -- Update foreign key in task_assignments if exists
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'task_assignments') THEN
             ALTER TABLE task_assignments DROP CONSTRAINT IF EXISTS task_assignments_task_id_fkey;
             ALTER TABLE task_assignments ADD CONSTRAINT task_assignments_legacy_task_id_fkey 
                FOREIGN KEY (task_id) REFERENCES legacy_onboarding_tasks(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- 3. Rename General Onboarding Tables to the clean 'onboarding_' prefix
ALTER TABLE IF EXISTS general_onboarding_modules RENAME TO onboarding_modules;
ALTER TABLE IF EXISTS general_onboarding_tasks RENAME TO onboarding_tasks;
ALTER TABLE IF EXISTS general_onboarding_content_blocks RENAME TO onboarding_content_blocks;
ALTER TABLE IF EXISTS general_onboarding_task_progress RENAME TO onboarding_task_progress;
ALTER TABLE IF EXISTS general_onboarding_user_responses RENAME TO onboarding_user_responses;

-- 4. Add columns for Department-Specific Onboarding
ALTER TABLE onboarding_modules ADD COLUMN IF NOT EXISTS type text DEFAULT 'General' CHECK (type IN ('General', 'Specific'));
ALTER TABLE onboarding_modules ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL;

-- 5. Enable RLS on new tables (if not already enabled)
ALTER TABLE IF EXISTS onboarding_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS onboarding_content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS onboarding_task_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS onboarding_user_responses ENABLE ROW LEVEL SECURITY;

-- 6. Update Policies (Drop old ones if they were under the old table name, then create new ones)
-- Note: Simple SELECT policies for public readability of modules/tasks
DROP POLICY IF EXISTS "general_onboarding_modules: public read" ON onboarding_modules;
CREATE POLICY "onboarding_modules: public read" ON onboarding_modules FOR SELECT USING (true);

DROP POLICY IF EXISTS "general_onboarding_tasks: public read" ON onboarding_tasks;
CREATE POLICY "onboarding_tasks: public read" ON onboarding_tasks FOR SELECT USING (true);

DROP POLICY IF EXISTS "general_onboarding_content_blocks: public read" ON onboarding_content_blocks;
CREATE POLICY "onboarding_content_blocks: public read" ON onboarding_content_blocks FOR SELECT USING (true);

-- 7. RLS for Departments
ALTER TABLE IF EXISTS departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "departments: public read" ON departments;
CREATE POLICY "departments: public read" ON departments FOR SELECT USING (true);

COMMIT;

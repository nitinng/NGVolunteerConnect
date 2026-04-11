-- ============================================================
-- NG Volunteer Connect — Modular Project Onboarding Migration
-- Supporting Project-Specific Onboarding Modules
-- ============================================================

BEGIN;

-- 1. Add project_id to onboarding_modules
ALTER TABLE public.onboarding_modules 
ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;

-- 2. Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_onboarding_modules_project_id ON public.onboarding_modules(project_id);

-- 3. Update type check to include 'Project'
ALTER TABLE public.onboarding_modules 
DROP CONSTRAINT IF EXISTS onboarding_modules_type_check;

ALTER TABLE public.onboarding_modules 
ADD CONSTRAINT onboarding_modules_type_check 
CHECK (type IN ('General', 'Specific', 'Project'));

-- 4. Update Policies for onboarding_modules
-- Allow anyone to read project-specific modules (required for volunteer view)
DROP POLICY IF EXISTS "onboarding_modules: public read" ON public.onboarding_modules;
CREATE POLICY "onboarding_modules: public read" ON public.onboarding_modules FOR SELECT USING (true);

-- 5. Update Policies for onboarding_tasks
DROP POLICY IF EXISTS "onboarding_tasks: public read" ON public.onboarding_tasks;
CREATE POLICY "onboarding_tasks: public read" ON public.onboarding_tasks FOR SELECT USING (true);

-- 6. Update Policies for onboarding_content_blocks
DROP POLICY IF EXISTS "onboarding_content_blocks: public read" ON public.onboarding_content_blocks;
CREATE POLICY "onboarding_content_blocks: public read" ON public.onboarding_content_blocks FOR SELECT USING (true);

COMMIT;

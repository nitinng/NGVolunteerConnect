-- Migration: Automated Screening System
-- Adds screening criteria to projects and results to applications

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS screening_questions TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS screening_criteria JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS screening_cutoff_score INTEGER DEFAULT 75;

ALTER TABLE volunteer_applications
ADD COLUMN IF NOT EXISTS screening_answers TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS screening_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS screening_results JSONB DEFAULT '{}'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN projects.screening_criteria IS 'List of profile and manual criteria for automated screening';
COMMENT ON COLUMN projects.screening_cutoff_score IS 'Minimum score required for auto-approval to onboarding';
COMMENT ON COLUMN projects.screening_questions IS 'Redundant flat list of manual questions for easier volunteer UI rendering';

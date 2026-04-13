-- ============================================================
-- NG Volunteer Connect — Withdrawal and Removal Support
-- Supporting feedback on withdrawal and admin-initiated removals
-- ============================================================

BEGIN;

-- 1. Add feedback and removal columns to volunteer_applications
ALTER TABLE public.volunteer_applications 
ADD COLUMN IF NOT EXISTS withdrawal_feedback TEXT,
ADD COLUMN IF NOT EXISTS removal_reason TEXT,
ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ;

-- 2. Update status check to include 'removed'
-- Note: PostgreSQL doesn't support direct ALTER TABLE for check constraints easily.
-- We drop and recreate it.
ALTER TABLE public.volunteer_applications 
DROP CONSTRAINT IF EXISTS volunteer_applications_status_check;

ALTER TABLE public.volunteer_applications 
ADD CONSTRAINT volunteer_applications_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn', 'removed'));

COMMIT;

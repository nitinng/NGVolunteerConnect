-- ============================================================
-- NG Volunteer Connect — Project Flow Restructuring
-- Supporting 'onboarding' status as the initial application phase
-- ============================================================

BEGIN;

-- 1. Update status check to include 'onboarding'
ALTER TABLE public.volunteer_applications 
DROP CONSTRAINT IF EXISTS volunteer_applications_status_check;

ALTER TABLE public.volunteer_applications 
ADD CONSTRAINT volunteer_applications_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn', 'removed', 'onboarding'));

COMMIT;

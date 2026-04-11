-- ============================================================
-- Ticket Assignees Table
-- Curated list of staff members who can be assigned to tickets
-- Run this in the Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ticket_assignees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (profile_id)
);

-- Enable RLS
ALTER TABLE public.ticket_assignees ENABLE ROW LEVEL SECURITY;

-- Admins can read the assignees list (used for the dropdown)
CREATE POLICY "Authenticated users can read assignees"
    ON public.ticket_assignees FOR SELECT
    TO authenticated
    USING (true);

-- Only service role (admin client) can insert/delete
-- (managed via server actions with createAdminClient)

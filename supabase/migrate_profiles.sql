-- ============================================================
-- NG Volunteer Connect — profiles table migration
-- Run this in Supabase SQL Editor to add all missing columns
-- to the existing profiles table.
-- Safe to re-run — uses ADD COLUMN IF NOT EXISTS.
-- ============================================================

-- ── Drop the old restrictive commitment_type CHECK constraint ──
-- (Old constraint only allowed 'one_off'/'ongoing'; we now store full strings)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_commitment_type_check;

-- ── Add all missing columns ──

-- Registration form data (steps 1–7 of /register)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience_years_label text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS start_time text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS source_other text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS volunteering_type text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS inclusion_agreed boolean DEFAULT false;

-- Personal contact
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_option text DEFAULT 'same';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_number text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contact_mode text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS newsletter boolean DEFAULT false;

-- Education
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education_degree text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education_institution text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education_year text;

-- Professional
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS resume_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS months_of_experience integer;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience_description text;

-- Skills
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS primary_skill_category text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS secondary_skill_category text;

-- Availability / Commitment
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS apply_project text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hours_per_week text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS volunteer_mode text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS acknowledgement boolean DEFAULT false;

-- Platform meta
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ── Verify: show all columns on the table ──
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

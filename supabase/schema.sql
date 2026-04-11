-- ============================================================
-- NG Volunteer Connect — Supabase Schema (V2)
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────
-- 1. profiles — master volunteer record, one row per user
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- ── Clerk synced (read-only, pulled from Clerk on create) ──
  full_name text NOT NULL,
  email text NOT NULL,

  -- ── Volunteer taxonomy (A1 type-selection screen) ──
  volunteer_type text CHECK (volunteer_type IN (
    'external_individual',
    'external_corporate',
    'internal_alumni_ext',
    'internal_alumni_staff'
  )),

  -- ── Registration form data (steps 1–7 of /register) ──
  city text,
  state text,
  country text,
  description text,                  -- "What best describes you?" (Working Professional, Student, etc.)
  experience_years_label text,       -- "0–1", "1–3", "3–7", "7+" label from registration step 3
  start_time text,                   -- "Immediately" | "Within a month" | "Just exploring for now"
  source text,                       -- How they heard about NG
  source_other text,                 -- Free-text when source = "Other"
  volunteering_type text,            -- "Individual" | "Corporate-sponsored" | "Alumni network"
  inclusion_agreed boolean DEFAULT false,

  -- ── Personal contact (profile tab: Personal) ──
  phone text,
  whatsapp_option text DEFAULT 'same',   -- "same" | "different"
  whatsapp_number text,
  contact_mode text,                     -- "Mail" | "SMS" | "WhatsApp" | "Call"
  newsletter boolean DEFAULT false,
  linkedin_url text,
  pronouns text,

  -- ── Education (profile tab: Education) ──
  education_degree text,
  education_institution text,
  education_year text,

  -- ── Professional (profile tab: Professional) ──
  resume_url text,
  years_of_experience integer,            -- slider value (years)
  months_of_experience integer,           -- slider value (months)
  job_title text,                         -- current role/job title
  employer text,
  industry_vertical text,
  experience_description text,

  -- ── Skills & primary categories (profile tab: Skills) ──
  primary_skill_category text,
  secondary_skill_category text,

  -- ── Availability / Commitment (profile tab: Commitment) ──
  apply_project text,
  commitment_type text,                   -- "One-time session" | "Short-term" | "Long term"
  hours_per_week text,
  volunteer_mode text,                    -- "Remote" | "In-person" | "Hybrid"
  acknowledgement boolean DEFAULT false,
  availability_hours_per_week integer,    -- numeric for impact engine
  preferred_days text[],

  -- ── Alumni-specific (internal flows) ──
  alumni_verified boolean DEFAULT false,
  alumni_graduation_year integer,
  alumni_campus text,
  corporate_company_name text,

  -- ── Platform meta ──
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);


-- ─────────────────────────────────────────────────────────
-- 2. skill_categories — top-level skill groupings
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS skill_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  key text UNIQUE NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────
-- 3. skill_subcategories — roles within a category
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS skill_subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES skill_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────
-- 4. skill_tags — flat searchable tags volunteers can claim
--    complexity_multiplier feeds the impact valuation engine (1.0–1.8x)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS skill_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subcategory_id uuid REFERENCES skill_subcategories(id) ON DELETE SET NULL,
  complexity_multiplier numeric(3,2) DEFAULT 1.0
    CHECK (complexity_multiplier BETWEEN 1.0 AND 1.8),
  created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────
-- 5. volunteer_skills — many-to-many: profiles ↔ skill_tags
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS volunteer_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  skill_tag_id uuid REFERENCES skill_tags(id) ON DELETE CASCADE,
  proficiency_level text CHECK (proficiency_level IN ('beginner', 'intermediate', 'expert')),
  UNIQUE(profile_id, skill_tag_id)
);

-- ─────────────────────────────────────────────────────────
-- 6. market_rate_lookup — admin-configurable base hourly rates
--    Used by impact engine: industry_vertical × experience_band → base_rate_inr
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS market_rate_lookup (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_vertical text NOT NULL,
  experience_band text NOT NULL CHECK (experience_band IN ('0-2', '3-5', '6-10', '10+')),
  base_rate_inr numeric(10,2) NOT NULL,
  UNIQUE(industry_vertical, experience_band)
);

-- ─────────────────────────────────────────────────────────
-- 7. projects — volunteer projects created by Program Managers
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_auth_id text NOT NULL,
  title text NOT NULL,
  description text,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  team text,
  required_skill_ids uuid[],
  volunteers_needed integer DEFAULT 1,
  estimated_hours_per_week integer,
  duration_weeks integer,
  start_date timestamptz,
  end_date timestamptz,
  approval_mode text DEFAULT 'open' CHECK (approval_mode IN ('open', 'curated')),
  screening_questions jsonb DEFAULT '[]'::jsonb,
  impact_tier text DEFAULT 'Community'
    CHECK (impact_tier IN ('Community', 'Program', 'Strategic')),
  status text DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'completed', 'archived')),
  created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────
-- 8. volunteer_applications — tracks who applied to what project
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS volunteer_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  screening_answers jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
  rejection_reason text,
  applied_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by text,
  UNIQUE(project_id, profile_id)
);

-- ─────────────────────────────────────────────────────────
-- 9. volunteer_contributions — hour logging + impact engine core
--    Every PM-approved row gets calculated_hourly_rate & calculated_value
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS volunteer_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  date_of_work date NOT NULL,
  hours_logged numeric(5,2) NOT NULL CHECK (hours_logged > 0),
  work_description text,
  deliverable_url text,
  pm_approved boolean DEFAULT false,
  approved_by text,
  calculated_hourly_rate numeric(10,2),
  calculated_value numeric(10,2),
  created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────
-- 10. onboarding_tasks — migrated from skills-config.ts
--     Managed via Skills CMS admin panel
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS onboarding_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type text CHECK (type IN ('essay', 'mcq', 'report', 'upload', 'video', 'reading')),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'on-hold')),
  required boolean DEFAULT true,
  options jsonb,
  created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────
-- 11. task_assignments — tasks assigned to skill subcategories
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES onboarding_tasks(id) ON DELETE CASCADE,
  subcategory_id uuid REFERENCES skill_subcategories(id) ON DELETE CASCADE,
  UNIQUE(task_id, subcategory_id)
);

-- ─────────────────────────────────────────────────────────
-- 12. project_onboarding_steps — project specific tasks
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_onboarding_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  step_order integer NOT NULL DEFAULT 0,
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('info', 'form', 'checkbox')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────
-- 13. volunteer_onboarding_progress — tracking project application progress
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS volunteer_onboarding_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES volunteer_applications(id) ON DELETE CASCADE,
  step_id uuid REFERENCES project_onboarding_steps(id) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  UNIQUE(application_id, step_id)
);


-- ============================================================
-- ROW LEVEL SECURITY
-- All tables default-deny; service role bypasses all policies.
-- DROP IF EXISTS makes this block fully idempotent (safe to re-run).
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_rate_lookup ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_onboarding_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "profiles: own row" ON profiles;
CREATE POLICY "profiles: own row" ON profiles
  FOR ALL USING (true) WITH CHECK (true);

-- Skill reference tables (public read — static lookup data)
DROP POLICY IF EXISTS "skill_categories: public read" ON skill_categories;
CREATE POLICY "skill_categories: public read" ON skill_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "skill_subcategories: public read" ON skill_subcategories;
CREATE POLICY "skill_subcategories: public read" ON skill_subcategories FOR SELECT USING (true);

DROP POLICY IF EXISTS "skill_tags: public read" ON skill_tags;
CREATE POLICY "skill_tags: public read" ON skill_tags FOR SELECT USING (true);

DROP POLICY IF EXISTS "market_rate_lookup: public read" ON market_rate_lookup;
CREATE POLICY "market_rate_lookup: public read" ON market_rate_lookup FOR SELECT USING (true);

DROP POLICY IF EXISTS "onboarding_tasks: public read" ON onboarding_tasks;
CREATE POLICY "onboarding_tasks: public read" ON onboarding_tasks FOR SELECT USING (true);

DROP POLICY IF EXISTS "task_assignments: public read" ON task_assignments;
CREATE POLICY "task_assignments: public read" ON task_assignments FOR SELECT USING (true);

-- Projects: published projects readable by all
DROP POLICY IF EXISTS "projects: published read" ON projects;
CREATE POLICY "projects: published read" ON projects
  FOR SELECT USING (status = 'published');

-- Applications
DROP POLICY IF EXISTS "applications: own read" ON volunteer_applications;
CREATE POLICY "applications: own read" ON volunteer_applications
  FOR SELECT USING (true);

-- Contributions
DROP POLICY IF EXISTS "contributions: read" ON volunteer_contributions;
CREATE POLICY "contributions: read" ON volunteer_contributions
  FOR SELECT USING (true);

-- Volunteer skills
DROP POLICY IF EXISTS "volunteer_skills: own" ON volunteer_skills;
CREATE POLICY "volunteer_skills: own" ON volunteer_skills
  FOR ALL USING (true) WITH CHECK (true);

-- Project onboarding steps (public read for now, projects control assignment)
DROP POLICY IF EXISTS "project_onboarding_steps: read" ON project_onboarding_steps;
CREATE POLICY "project_onboarding_steps: read" ON project_onboarding_steps FOR SELECT USING (true);

-- Volunteer onboarding progress (public read/update for now)
DROP POLICY IF EXISTS "volunteer_onboarding_progress: read_update" ON volunteer_onboarding_progress;
CREATE POLICY "volunteer_onboarding_progress: read_update" ON volunteer_onboarding_progress
  FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- SEED: Market Rate Lookup (Base Rates in INR/hour)
-- These are editable via the Admin CMS (S3 task)
-- ============================================================
INSERT INTO market_rate_lookup (industry_vertical, experience_band, base_rate_inr) VALUES
  ('Software Engineering',  '0-2',  500),
  ('Software Engineering',  '3-5',  1500),
  ('Software Engineering',  '6-10', 3000),
  ('Software Engineering',  '10+',  6000),
  ('Product Management',    '0-2',  600),
  ('Product Management',    '3-5',  1800),
  ('Product Management',    '6-10', 3500),
  ('Product Management',    '10+',  7000),
  ('Design / UX',           '0-2',  500),
  ('Design / UX',           '3-5',  1400),
  ('Design / UX',           '6-10', 2800),
  ('Design / UX',           '10+',  5500),
  ('Legal',                 '0-2',  1000),
  ('Legal',                 '3-5',  3000),
  ('Legal',                 '6-10', 6000),
  ('Legal',                 '10+',  10000),
  ('Finance / Accounting',  '0-2',  800),
  ('Finance / Accounting',  '3-5',  2200),
  ('Finance / Accounting',  '6-10', 4500),
  ('Finance / Accounting',  '10+',  8000),
  ('Marketing / Content',   '0-2',  400),
  ('Marketing / Content',   '3-5',  1200),
  ('Marketing / Content',   '6-10', 2500),
  ('Marketing / Content',   '10+',  5000),
  ('HR / People Ops',       '0-2',  400),
  ('HR / People Ops',       '3-5',  1100),
  ('HR / People Ops',       '6-10', 2200),
  ('HR / People Ops',       '10+',  4500),
  ('Data / ML / AI',        '0-2',  800),
  ('Data / ML / AI',        '3-5',  2500),
  ('Data / ML / AI',        '6-10', 5000),
  ('Data / ML / AI',        '10+',  9000),
  ('Teaching / Education',  '0-2',  400),
  ('Teaching / Education',  '3-5',  1000),
  ('Teaching / Education',  '6-10', 2000),
  ('Teaching / Education',  '10+',  4000),
  ('General / Other',       '0-2',  300),
  ('General / Other',       '3-5',  800),
  ('General / Other',       '6-10', 1500),
  ('General / Other',       '10+',  3000)
ON CONFLICT (industry_vertical, experience_band) DO NOTHING;


-- ============================================================
-- SEED: Skill Categories (migrated from skills-config.ts)
-- ============================================================
INSERT INTO skill_categories (title, key, display_order) VALUES
  ('Technical',                    'technical',        1),
  ('Non-Technical / Professional', 'nonTechnical',     2),
  ('Creative',                     'creative',         3),
  ('Leadership & Operations',      'leadershipOps',    4)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- SEED: Skill Subcategories
-- ============================================================
DO $$
DECLARE
  tech_id uuid;
  nontech_id uuid;
  creative_id uuid;
  ops_id uuid;
BEGIN
  SELECT id INTO tech_id     FROM skill_categories WHERE key = 'technical';
  SELECT id INTO nontech_id  FROM skill_categories WHERE key = 'nonTechnical';
  SELECT id INTO creative_id FROM skill_categories WHERE key = 'creative';
  SELECT id INTO ops_id      FROM skill_categories WHERE key = 'leadershipOps';

  INSERT INTO skill_subcategories (category_id, name) VALUES
    (tech_id,     'Programming'),
    (tech_id,     'DevOps'),
    (tech_id,     'Tech Mentorship'),
    (tech_id,     'Coding Interviews'),
    (tech_id,     'Data & AI'),
    (nontech_id,  'Teaching & Facilitation'),
    (nontech_id,  'Legal & Compliance'),
    (nontech_id,  'Finance & Accounting'),
    (nontech_id,  'HR & People Ops'),
    (nontech_id,  'Marketing & Content'),
    (creative_id, 'Design & UX'),
    (creative_id, 'Video & Media'),
    (ops_id,      'Project Management'),
    (ops_id,      'Strategy & Consulting'),
    (ops_id,      'Fundraising & Grants');
END $$;

-- ============================================================
-- SEED: Skill Tags (representative set — expand via CMS)
-- ============================================================
DO $$
DECLARE
  prog_id uuid;
  devops_id uuid;
  data_id uuid;
  mentorship_id uuid;
  teaching_id uuid;
  legal_id uuid;
  finance_id uuid;
  design_id uuid;
  marketing_id uuid;
  pm_id uuid;
BEGIN
  SELECT id INTO prog_id      FROM skill_subcategories WHERE name = 'Programming';
  SELECT id INTO devops_id    FROM skill_subcategories WHERE name = 'DevOps';
  SELECT id INTO data_id      FROM skill_subcategories WHERE name = 'Data & AI';
  SELECT id INTO mentorship_id FROM skill_subcategories WHERE name = 'Tech Mentorship';
  SELECT id INTO teaching_id  FROM skill_subcategories WHERE name = 'Teaching & Facilitation';
  SELECT id INTO legal_id     FROM skill_subcategories WHERE name = 'Legal & Compliance';
  SELECT id INTO finance_id   FROM skill_subcategories WHERE name = 'Finance & Accounting';
  SELECT id INTO design_id    FROM skill_subcategories WHERE name = 'Design & UX';
  SELECT id INTO marketing_id FROM skill_subcategories WHERE name = 'Marketing & Content';
  SELECT id INTO pm_id        FROM skill_subcategories WHERE name = 'Project Management';

  INSERT INTO skill_tags (name, subcategory_id, complexity_multiplier) VALUES
    -- Programming
    ('Python',          prog_id,     1.2),
    ('JavaScript',      prog_id,     1.1),
    ('TypeScript',      prog_id,     1.2),
    ('React / Next.js', prog_id,     1.2),
    ('Node.js',         prog_id,     1.2),
    ('SQL',             prog_id,     1.0),
    ('Java',            prog_id,     1.1),
    ('Go',              prog_id,     1.3),
    -- DevOps
    ('Docker / K8s',    devops_id,   1.3),
    ('CI/CD Pipelines', devops_id,   1.2),
    ('AWS / GCP / Azure', devops_id, 1.3),
    -- Data & AI
    ('Machine Learning',  data_id,   1.6),
    ('Data Analysis',     data_id,   1.3),
    ('Business Intelligence', data_id, 1.3),
    ('NLP',               data_id,   1.7),
    ('LLM Engineering',   data_id,   1.8),
    -- Mentorship
    ('1:1 Technical Mentoring', mentorship_id, 1.0),
    ('Mock Interviews',         mentorship_id, 1.0),
    -- Teaching
    ('Curriculum Design',  teaching_id, 1.1),
    ('Classroom Facilitation', teaching_id, 1.0),
    -- Legal
    ('Corporate Law',     legal_id,  1.6),
    ('IP & Compliance',   legal_id,  1.6),
    ('Non-profit Law',    legal_id,  1.5),
    -- Finance
    ('Financial Modelling', finance_id, 1.4),
    ('Grant Writing',       finance_id, 1.3),
    ('Bookkeeping',         finance_id, 1.0),
    -- Design
    ('UI Design',           design_id, 1.1),
    ('UX Research',         design_id, 1.2),
    ('Branding',            design_id, 1.1),
    ('Figma',               design_id, 1.0),
    -- Marketing
    ('Social Media',        marketing_id, 1.0),
    ('Copywriting',         marketing_id, 1.0),
    ('SEO / SEM',           marketing_id, 1.1),
    -- PM
    ('Agile / Scrum',     pm_id, 1.1),
    ('OKRs & Strategy',   pm_id, 1.2),
    ('Operations Management', pm_id, 1.1);
END $$;

-- ============================================================
-- SEED: Onboarding Tasks (migrated from skills-config.ts)
-- ============================================================
INSERT INTO onboarding_tasks (title, description, type, status, required) VALUES
  ('Complete Coding Challenge',       'Submit your solution for the programming assessment.',      'report',  'published', true),
  ('Review NG Tech Stack',            'Read about our internal tools and development practices.',  'reading', 'published', true),
  ('Setup Local Environment',         'Follow our guide to set up your development environment.', 'reading', 'published', true),
  ('CI/CD Pipeline Introduction',     'A video introduction to our deployment workflow.',         'video',   'published', true),
  ('Tech Mentorship Guidelines',      'Read the mentorship code of conduct and best practices.',  'reading', 'published', true),
  ('Watch Facilitation Video',        'Learn how we teach and facilitate at NavGurukul.',         'video',   'published', true),
  ('NG Mission & Impact Overview',    'Read about our mission and the communities we serve.',     'reading', 'published', true),
  ('Student Profile Understanding',   'Understanding the students you will be supporting.',       'reading', 'published', true),
  ('Code of Conduct',                 'Review and acknowledge the NavGurukul code of conduct.',   'reading', 'published', true),
  ('Collaboration Norms',             'How we work together across campuses and teams.',          'reading', 'published', true);

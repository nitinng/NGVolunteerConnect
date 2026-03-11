-- ============================================================
-- NG Volunteer Connect — General Onboarding Schema
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS general_onboarding_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  icon text,
  color text,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS general_onboarding_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES general_onboarding_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  icon text,
  content_type text CHECK (content_type IN ('reading', 'video', 'quiz', 'upload', 'link')),
  content_url text,      
  content_body text,     
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE general_onboarding_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE general_onboarding_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "general_onboarding_modules: public read" ON general_onboarding_modules;
CREATE POLICY "general_onboarding_modules: public read" ON general_onboarding_modules FOR SELECT USING (true);

DROP POLICY IF EXISTS "general_onboarding_tasks: public read" ON general_onboarding_tasks;
CREATE POLICY "general_onboarding_tasks: public read" ON general_onboarding_tasks FOR SELECT USING (true);

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO general_onboarding_modules (title, description, icon, color, order_index) VALUES
  ('Organization', 'Learn about NavGurukul''s history and structure.', 'Building2', 'indigo', 10),
  ('Mission', 'Understand our core mission and the impact we aim to create.', 'Target', 'rose', 20),
  ('Programs', 'Explore the various programs we offer to our students.', 'GraduationCap', 'amber', 30),
  ('Volunteer Philosophy', 'Our approach to volunteering and community engagement.', 'Heart', 'emerald', 40),
  ('Role Fit', 'How your skills and interests align with our needs.', 'Puzzle', 'blue', 50),
  ('Expectations', 'What we expect from you and what you can expect from us.', 'ListTodo', 'violet', 60),
  ('Alignment Confirmation', 'Final confirmation of your commitment and alignment.', 'ShieldCheck', 'orange', 70)
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  org_id uuid;
  mission_id uuid;
  prog_id uuid;
  phil_id uuid;
  role_id uuid;
  exp_id uuid;
  align_id uuid;
BEGIN
  SELECT id INTO org_id FROM general_onboarding_modules WHERE title = 'Organization' LIMIT 1;
  SELECT id INTO mission_id FROM general_onboarding_modules WHERE title = 'Mission' LIMIT 1;
  SELECT id INTO prog_id FROM general_onboarding_modules WHERE title = 'Programs' LIMIT 1;
  SELECT id INTO phil_id FROM general_onboarding_modules WHERE title = 'Volunteer Philosophy' LIMIT 1;
  SELECT id INTO role_id FROM general_onboarding_modules WHERE title = 'Role Fit' LIMIT 1;
  SELECT id INTO exp_id FROM general_onboarding_modules WHERE title = 'Expectations' LIMIT 1;
  SELECT id INTO align_id FROM general_onboarding_modules WHERE title = 'Alignment Confirmation' LIMIT 1;

  -- Organization Tasks
  INSERT INTO general_onboarding_tasks (module_id, title, description, icon, content_type, content_body, order_index) VALUES
    (org_id, 'Our History', 'How NavGurukul started and evolved over the years.', 'BookOpen', 'reading', 'Our story begins in 2016...', 10),
    (org_id, 'Leadership Team', 'Meet the people leading the various programs.', 'Building2', 'reading', 'Meet Abhishek and others.', 20),
    (org_id, 'Campus Network', 'Explore our residential campuses across India.', 'Heart', 'reading', 'Locations across India...', 30),
    (org_id, 'Org Structure', 'Understanding how different teams collaborate.', 'Puzzle', 'reading', 'Teams include Ops, Academics, etc.', 40);

  -- Mission Tasks
  INSERT INTO general_onboarding_tasks (module_id, title, description, icon, content_type, content_body, order_index) VALUES
    (mission_id, 'Core Values', 'The principles that guide everything we do.', 'ShieldCheck', 'reading', 'Transparency, Inclusion...', 10),
    (mission_id, 'Impact Stories', 'Watch how our graduates are changing their lives.', 'PlayCircle', 'video', 'https://youtube.com/...', 20),
    (mission_id, 'Future Vision', 'Where we want to be in the next 5 years.', 'Target', 'reading', 'Our scale goals...', 30);
END $$;

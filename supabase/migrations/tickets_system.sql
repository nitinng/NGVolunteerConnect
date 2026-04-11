-- Support Ops Hub Master Schema
-- This script initializes the entire ticketing and support infrastructure.

-- Clean up existing tables (Optional: Uncomment if you want to reset)
-- DROP TABLE IF EXISTS public.feedback_responses CASCADE;
-- DROP TABLE IF EXISTS public.feedback_forms CASCADE;
-- DROP TABLE IF EXISTS public.contact_directory CASCADE;
-- DROP TABLE IF EXISTS public.faqs CASCADE;
-- DROP TABLE IF EXISTS public.ticket_timeline CASCADE;
-- DROP TABLE IF EXISTS public.ticket_priorities CASCADE;
-- DROP TABLE IF EXISTS public.ticket_categories CASCADE;
-- DROP TABLE IF EXISTS public.tickets CASCADE;

-- 1. TICKETING SYSTEM
-----------------------------------------------------------

-- Categories and Priorities Lookup Tables
CREATE TABLE public.ticket_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.ticket_priorities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    color TEXT,
    weight INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Main Tickets Table
CREATE TABLE public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number SERIAL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL, -- Logical link to ticket_categories(name)
    priority TEXT NOT NULL, -- Logical link to ticket_priorities(name)
    status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_users UUID[] DEFAULT '{}', -- Array of profile IDs
    departments TEXT[] DEFAULT '{}', -- Array of department names
    attachments TEXT[] DEFAULT '{}', -- Array of file URLs
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Ticket Timeline (Unified Activity Log)
CREATE TABLE public.ticket_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('creation', 'message', 'status', 'assignment')),
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    author_name TEXT,
    author_role TEXT,
    text_content TEXT,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. FAQs SYSTEM
-----------------------------------------------------------
CREATE TABLE public.faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    order_index INT DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CONTACT DIRECTORY
-----------------------------------------------------------
CREATE TABLE public.contact_directory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL DEFAULT 'email',
    title TEXT NOT NULL,
    value TEXT NOT NULL,
    icon TEXT,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. FEEDBACK SYSTEM
-----------------------------------------------------------
CREATE TABLE public.feedback_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT false,
    schema JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.feedback_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES public.feedback_forms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    response_data JSONB NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);


-- 5. AUTOMATION & TRIGGERS
-----------------------------------------------------------

-- Generic updated_at function
CREATE OR REPLACE FUNCTION update_modified_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER sync_tickets_updated_at BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER sync_faqs_updated_at BEFORE UPDATE ON public.faqs FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER sync_feedback_forms_updated_at BEFORE UPDATE ON public.feedback_forms FOR EACH ROW EXECUTE FUNCTION update_modified_column();


-- 6. SECURITY (RLS)
-----------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_responses ENABLE ROW LEVEL SECURITY;

-- 6.1 Tickets RLS
CREATE POLICY "Users can view their own tickets" ON public.tickets FOR SELECT USING (created_by IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can create tickets" ON public.tickets FOR INSERT WITH CHECK (created_by IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));
CREATE POLICY "Staff can view all tickets" ON public.tickets FOR SELECT USING ((auth.jwt() ->> 'role') IN ('Admin', 'Program', 'Operations'));
CREATE POLICY "Staff can update tickets" ON public.tickets FOR UPDATE USING ((auth.jwt() ->> 'role') IN ('Admin', 'Program', 'Operations'));

-- 6.2 Lookup Tables RLS
CREATE POLICY "Allow public read for categories" ON public.ticket_categories FOR SELECT USING (true);
CREATE POLICY "Allow staff management for categories" ON public.ticket_categories FOR ALL USING ((auth.jwt() ->> 'role') IN ('Admin', 'Program', 'Operations'));
CREATE POLICY "Allow public read for priorities" ON public.ticket_priorities FOR SELECT USING (true);
CREATE POLICY "Allow staff management for priorities" ON public.ticket_priorities FOR ALL USING ((auth.jwt() ->> 'role') IN ('Admin', 'Program', 'Operations'));

-- 6.3 Timeline RLS
CREATE POLICY "Timeline visible to ticket viewers" ON public.ticket_timeline FOR SELECT USING (EXISTS (SELECT 1 FROM public.tickets WHERE id = ticket_timeline.ticket_id));
CREATE POLICY "Allow adding to timeline" ON public.ticket_timeline FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.tickets WHERE id = ticket_timeline.ticket_id));

-- 6.4 FAQs & Directory RLS
CREATE POLICY "Public read for FAQs" ON public.faqs FOR SELECT USING (is_published = true);
CREATE POLICY "Staff management for FAQs" ON public.faqs FOR ALL USING ((auth.jwt() ->> 'role') IN ('Admin', 'Program', 'Operations'));
CREATE POLICY "Public read for Directory" ON public.contact_directory FOR SELECT USING (true);
CREATE POLICY "Staff management for Directory" ON public.contact_directory FOR ALL USING ((auth.jwt() ->> 'role') IN ('Admin', 'Program', 'Operations'));

-- 6.5 Feedback RLS
CREATE POLICY "Public read for active forms" ON public.feedback_forms FOR SELECT USING (is_active = true);
CREATE POLICY "Staff management for forms" ON public.feedback_forms FOR ALL USING ((auth.jwt() ->> 'role') IN ('Admin', 'Program', 'Operations'));
CREATE POLICY "Users can view own responses" ON public.feedback_responses FOR SELECT USING (user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can submit responses" ON public.feedback_responses FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));
CREATE POLICY "Staff can view all responses" ON public.feedback_responses FOR SELECT USING ((auth.jwt() ->> 'role') IN ('Admin', 'Program', 'Operations'));


-- 7. SEED DATA (Optional)
-----------------------------------------------------------
INSERT INTO public.ticket_categories (name) VALUES 
('Tech Issue'), 
('Academic Support'), 
('Ops'), 
('HR'), 
('Other') 
ON CONFLICT DO NOTHING;

INSERT INTO public.ticket_priorities (name, color, weight) VALUES 
('Low', 'text-slate-500', 0),
('Medium', 'text-amber-500', 1),
('High', 'text-rose-500', 2)
ON CONFLICT DO NOTHING;

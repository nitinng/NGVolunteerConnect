import { createBrowserClient as _createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// ─────────────────────────────────────────────────────────────────────────────
// Browser Client — SINGLETON
//
// CRITICAL: This must be a single shared instance for the entire browser session.
// Creating a new client on every call (e.g. inside a React hook body) causes:
//   - Each instance gets its own disconnected onAuthStateChange listener
//   - Stale closures in useEffect that capture the wrong client instance
//   - Race conditions where user appears null despite being signed in
//
// Never call _createBrowserClient() directly in components or hooks.
// Always import and use `browserClient` or call `createBrowserClient()` once.
// ─────────────────────────────────────────────────────────────────────────────
let _browserClientInstance: ReturnType<typeof _createBrowserClient> | null = null;

export function createBrowserClient() {
    // Only create the client on the browser side (not during SSR)
    if (typeof window === 'undefined') {
        // During SSR, return a fresh instance (it won't be used for auth state)
        return _createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    if (!_browserClientInstance) {
        _browserClientInstance = _createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return _browserClientInstance;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types — mirrors the Supabase schema exactly
// ─────────────────────────────────────────────────────────────────────────────

export type VolunteerType =
    | 'external_individual'
    | 'external_corporate'
    | 'internal_alumni_ext'
    | 'internal_alumni_staff';

export type CommitmentType = 'one_off' | 'ongoing';

export type ApprovalMode = 'open' | 'curated';

export type ProjectStatus = 'draft' | 'published' | 'completed' | 'archived';

export type ImpactTier = 'Community' | 'Program' | 'Strategic';

export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';

export type ProficiencyLevel = 'beginner' | 'intermediate' | 'expert';

export type ExperienceBand = '0-2' | '3-5' | '6-10' | '10+';

export interface Profile {
    id: string;
    auth_user_id: string;

    // Clerk-synced (populated from Clerk on first login)
    full_name: string;
    email: string;

    // Volunteer taxonomy
    volunteer_type: VolunteerType | null;

    // Registration form data (steps 1–7)
    city: string | null;
    state: string | null;
    country: string | null;
    description: string | null;
    experience_years_label: string | null;
    start_time: string | null;
    source: string | null;
    source_other: string | null;
    volunteering_type: string | null;
    inclusion_agreed: boolean;

    // Personal contact
    phone: string | null;
    whatsapp_option: string | null;
    whatsapp_number: string | null;
    contact_mode: string | null;
    newsletter: boolean;
    linkedin_url: string | null;
    pronouns: string | null;

    // Education
    education_degree: string | null;
    education_institution: string | null;
    education_year: string | null;

    // Professional
    resume_url: string | null;
    years_of_experience: number | null;
    months_of_experience: number | null;
    job_title: string | null;
    employer: string | null;
    industry_vertical: string | null;
    experience_description: string | null;

    // Skills
    primary_skill_category: string | null;
    secondary_skill_category: string | null;
    primary_skill_subcategories: string[] | null;
    secondary_skill_subcategories: string[] | null;

    // Availability / Commitment
    apply_project: string | null;
    commitment_type: string | null;
    hours_per_week: string | null;
    volunteer_mode: string | null;
    acknowledgement: boolean;
    availability_hours_per_week: number | null;
    preferred_days: string[] | null;

    // Alumni-specific
    alumni_verified: boolean;
    alumni_graduation_year: number | null;
    alumni_campus: string | null;
    corporate_company_name: string | null;

    // Platform meta
    onboarding_completed: boolean;
    onboarding_percentage: number | null;
    onboarding_status: "default" | "locked" | "unlocked";
    created_at: string;
    updated_at: string;
}


export interface SkillCategory {
    id: string;
    title: string;
    key: string;
    display_order: number;
    created_at: string;
}

export interface SkillSubcategory {
    id: string;
    category_id: string;
    name: string;
    created_at: string;
}

export interface SkillTag {
    id: string;
    name: string;
    subcategory_id: string | null;
    complexity_multiplier: number;
    created_at: string;
}

export interface VolunteerSkill {
    id: string;
    profile_id: string;
    skill_tag_id: string;
    proficiency_level: ProficiencyLevel;
}

export interface MarketRateLookup {
    id: string;
    industry_vertical: string;
    experience_band: ExperienceBand;
    base_rate_inr: number;
}

export interface Project {
    id: string;
    created_by_auth_id: string;
    title: string;
    description: string | null;
    department_id: string | null;
    team: string | null;
    required_skill_ids: string[] | null;
    volunteers_needed: number;
    estimated_hours_per_week: number | null;
    duration_weeks: number | null;
    start_date: string | null;
    end_date: string | null;
    approval_mode: ApprovalMode;
    screening_questions: string[];
    screening_criteria: any[] | null;
    screening_cutoff_score: number | null;
    impact_tier: ImpactTier;
    status: ProjectStatus;
    created_at: string;
}

export interface VolunteerApplication {
    id: string;
    project_id: string;
    profile_id: string;
    screening_answers: string[];
    screening_score: number | null;
    screening_results: any | null;
    status: ApplicationStatus;
    rejection_reason: string | null;
    applied_at: string;
    reviewed_at: string | null;
    reviewed_by: string | null;
}

export interface VolunteerContribution {
    id: string;
    project_id: string;
    profile_id: string;
    date_of_work: string;
    hours_logged: number;
    work_description: string | null;
    deliverable_url: string | null;
    pm_approved: boolean;
    approved_by: string | null;
    calculated_hourly_rate: number | null;
    calculated_value: number | null;
    created_at: string;
}

export interface OnboardingTask {
    id: string;
    title: string;
    description: string | null;
    type: 'essay' | 'mcq' | 'report' | 'upload' | 'video' | 'reading';
    status: 'draft' | 'published' | 'on-hold';
    required: boolean;
    options: string[] | null;
    created_at: string;
}

export interface TaskAssignment {
    id: string;
    task_id: string;
    subcategory_id: string;
}

export type ProjectOnboardingStepType = 'info' | 'form' | 'checkbox';

export interface ProjectOnboardingStep {
    id: string;
    project_id: string;
    step_order: number;
    title: string;
    description: string | null;
    type: ProjectOnboardingStepType;
    created_at: string;
    updated_at: string;
}

export interface VolunteerOnboardingProgress {
    id: string;
    application_id: string;
    step_id: string;
    completed: boolean;
    completed_at: string | null;
}

export type WebinarStatus = 'draft' | 'planned' | 'ongoing' | 'completed' | 'cancelled';
export type WebinarType = 'one_off' | 'recurring';

export interface Webinar {
    id: string;
    title: string;
    date: string;
    agenda: string | null;
    department: string | null;
    gmeet_link: string | null;
    is_open_to_all: boolean;
    type: WebinarType;
    status: WebinarStatus;
    created_at: string;
    updated_at: string;
}

export interface WebinarHost {
    webinar_id: string;
    profile_id: string;
}

export interface WebinarParticipant {
    webinar_id: string;
    profile_id: string;
}

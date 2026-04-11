"use server";

import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-server";
import { calculateImpact, getExperienceBand } from "@/lib/impact-engine";
import {
    Profile,
    VolunteerType,
    Project,
    VolunteerApplication,
    VolunteerContribution,
    SkillCategory,
    SkillSubcategory,
    SkillTag,
    ImpactTier,
    ApprovalMode,
    ApplicationStatus,
} from "@/lib/supabase";
import { revalidatePath } from "next/cache";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

async function requireAuth() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized — user not logged in");
    return userId;
}

// ─────────────────────────────────────────────────────────────────────────────
// F4: PROFILE SYNC
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a Supabase profile row for a user if one doesn't already exist.
 * Called on first sign-in / after registration.
 */
export async function syncProfileToSupabase(params: {
    authUserId: string;
    email: string;
    fullName: string;
}) {
    const supabase = createAdminClient();

    // Check if profile already exists
    const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", params.authUserId)
        .single();

    if (existing) return { success: true, created: false };

    const { error } = await supabase.from("profiles").insert({
        auth_user_id: params.authUserId,
        email: params.email,
        full_name: params.fullName,
        onboarding_completed: false,
    });

    if (error) {
        console.error("[syncProfileToSupabase] Error details:", JSON.stringify(error, null, 2));
        throw new Error(error.message || "Unknown Supabase error");
    }

    return { success: true, created: true };
}

/**
 * Fetches the current user's Supabase profile.
 * Returns null if not found (profile not yet created).
 */
export async function getMyProfile(): Promise<Profile | null> {
    const userId = await requireAuth();
    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("auth_user_id", userId)
        .single();

    if (error) {
        if (error.code === "PGRST116") return null; // Not found
        console.error("[getMyProfile] Error:", error);
        return null;
    }

    return data as Profile;
}

/**
 * Updates the current user's Supabase profile with the provided partial data.
 * Also syncs volunteer_type and onboarding_completed to Clerk publicMetadata.
 */
export async function updateMyProfile(updates: Partial<Profile>) {
    const userId = await requireAuth();
    const supabase = createAdminClient();

    const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("auth_user_id", userId);

    if (error) {
        console.error("[updateMyProfile] Error:", error);
        throw new Error(error.message);
    }

    // Sync key fields to Supabase app_metadata
    if (updates.volunteer_type || updates.onboarding_completed !== undefined) {
        const { data: { user } } = await supabase.auth.admin.getUserById(userId);
        await supabase.auth.admin.updateUserById(userId, {
            app_metadata: {
                ...user?.app_metadata,
                ...(updates.volunteer_type && { volunteer_type: updates.volunteer_type }),
                ...(updates.onboarding_completed !== undefined && {
                    onboarding_completed: updates.onboarding_completed,
                }),
            },
        });
    }

    revalidatePath("/");
    return { success: true };
}

/**
 * Sets the volunteer type for the current user.
 * Writes to both Supabase profiles and Clerk publicMetadata.
 */
export async function setVolunteerType(volunteerType: VolunteerType) {
    const userId = await requireAuth();
    const supabase = createAdminClient();

    // Update Supabase
    const { error } = await supabase
        .from("profiles")
        .update({ volunteer_type: volunteerType })
        .eq("auth_user_id", userId);

    if (error) throw new Error(error.message);

    // Sync to Supabase Admin App Metadata
    const { data: { user } } = await supabase.auth.admin.getUserById(userId);
    await supabase.auth.admin.updateUserById(userId, {
        app_metadata: {
            ...user?.app_metadata,
            volunteer_type: volunteerType
        },
    });

    return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// S1: SKILLS — Categories, Subcategories, Tags
// ─────────────────────────────────────────────────────────────────────────────

export async function getSkillCategories(): Promise<SkillCategory[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("skill_categories")
        .select("*")
        .order("display_order");
    if (error) throw new Error(error.message);
    return data as SkillCategory[];
}

export async function getSkillSubcategories(categoryId?: string): Promise<SkillSubcategory[]> {
    const supabase = createAdminClient();
    let query = supabase.from("skill_subcategories").select("*");
    if (categoryId) query = query.eq("category_id", categoryId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as SkillSubcategory[];
}

export async function getSkillTags(subcategoryId?: string): Promise<SkillTag[]> {
    const supabase = createAdminClient();
    let query = supabase.from("skill_tags").select("*").order("name");
    if (subcategoryId) query = query.eq("subcategory_id", subcategoryId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as SkillTag[];
}

/** Returns all skill data (categories → subcategories → tags) in one call */
export async function getFullSkillTree() {
    const supabase = createAdminClient();

    const [categoriesRes, subcategoriesRes, tagsRes] = await Promise.all([
        supabase.from("skill_categories").select("*").order("display_order"),
        supabase.from("skill_subcategories").select("*"),
        supabase.from("skill_tags").select("*").order("name"),
    ]);

    if (categoriesRes.error) throw new Error(categoriesRes.error.message);
    if (subcategoriesRes.error) throw new Error(subcategoriesRes.error.message);
    if (tagsRes.error) throw new Error(tagsRes.error.message);

    return {
        categories: categoriesRes.data as SkillCategory[],
        subcategories: subcategoriesRes.data as SkillSubcategory[],
        tags: tagsRes.data as SkillTag[],
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// S2: VOLUNTEER SKILL TAGS
// ─────────────────────────────────────────────────────────────────────────────

/** Get the current user's selected skill tags */
export async function getMySkills() {
    const userId = await requireAuth();
    const supabase = createAdminClient();

    const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", userId)
        .single();

    if (!profile) return [];

    const { data, error } = await supabase
        .from("volunteer_skills")
        .select("*, skill_tags(*)")
        .eq("profile_id", profile.id);

    if (error) throw new Error(error.message);
    return data;
}

/** Save skill tag selections for the current user */
export async function saveMySkills(
    skills: { skillTagId: string; proficiencyLevel: "beginner" | "intermediate" | "expert" }[]
) {
    const userId = await requireAuth();
    const supabase = createAdminClient();

    const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", userId)
        .single();

    if (!profile) throw new Error("Profile not found");

    // Delete existing skills and replace with new set
    await supabase.from("volunteer_skills").delete().eq("profile_id", profile.id);

    if (skills.length > 0) {
        const { error } = await supabase.from("volunteer_skills").insert(
            skills.map((s) => ({
                profile_id: profile.id,
                skill_tag_id: s.skillTagId,
                proficiency_level: s.proficiencyLevel,
            }))
        );
        if (error) throw new Error(error.message);
    }

    return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// P1: PROJECTS — CRUD for Program Managers
// ─────────────────────────────────────────────────────────────────────────────

export async function getProjects(status?: string): Promise<Project[]> {
    const supabase = createAdminClient();
    let query = supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as Project[];
}

export async function getProjectById(projectId: string): Promise<Project | null> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
    if (error) return null;
    return data as Project;
}

export async function createProject(params: {
    title: string;
    description?: string;
    team?: string;
    requiredSkillIds?: string[];
    volunteersNeeded?: number;
    estimatedHoursPerWeek?: number;
    durationWeeks?: number;
    approvalMode?: ApprovalMode;
    screeningQuestions?: string[];
    impactTier?: ImpactTier;
}): Promise<Project> {
    const userId = await requireAuth();
    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from("projects")
        .insert({
            created_by_auth_id: userId,
            title: params.title,
            description: params.description ?? null,
            team: params.team ?? null,
            required_skill_ids: params.requiredSkillIds ?? [],
            volunteers_needed: params.volunteersNeeded ?? 1,
            estimated_hours_per_week: params.estimatedHoursPerWeek ?? null,
            duration_weeks: params.durationWeeks ?? null,
            approval_mode: params.approvalMode ?? "open",
            screening_questions: params.screeningQuestions ?? [],
            impact_tier: params.impactTier ?? "Community",
            status: "draft",
        })
        .select()
        .single();

    if (error) throw new Error(error.message);
    revalidatePath("/projects");
    return data as Project;
}

export async function updateProject(
    projectId: string,
    updates: Partial<Omit<Project, "id" | "created_by_auth_id" | "created_at">>
) {
    const supabase = createAdminClient();
    const { error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", projectId);
    if (error) throw new Error(error.message);
    revalidatePath("/projects");
    return { success: true };
}

export async function publishProject(projectId: string) {
    return updateProject(projectId, { status: "published" });
}

// ─────────────────────────────────────────────────────────────────────────────
// P3: VOLUNTEER APPLICATIONS
// ─────────────────────────────────────────────────────────────────────────────

export async function applyToProject(params: {
    projectId: string;
    screeningAnswers: string[];
}) {
    const userId = await requireAuth();
    const supabase = createAdminClient();

    // Get profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", userId)
        .single();

    if (!profile) throw new Error("Please complete your profile before applying.");

    // Get project to check approval mode
    const { data: project } = await supabase
        .from("projects")
        .select("approval_mode")
        .eq("id", params.projectId)
        .single();

    if (!project) throw new Error("Project not found.");

    const initialStatus = project.approval_mode === "open" ? "approved" : "pending";

    const { error } = await supabase.from("volunteer_applications").insert({
        project_id: params.projectId,
        profile_id: profile.id,
        screening_answers: params.screeningAnswers,
        status: initialStatus,
    });

    if (error) {
        if (error.code === "23505") throw new Error("You have already applied to this project.");
        throw new Error(error.message);
    }

    revalidatePath(`/projects/${params.projectId}`);
    return { success: true, status: initialStatus };
}

export async function getMyApplications() {
    const userId = await requireAuth();
    const supabase = createAdminClient();

    const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", userId)
        .single();

    if (!profile) return [];

    const { data, error } = await supabase
        .from("volunteer_applications")
        .select("*, projects(*)")
        .eq("profile_id", profile.id)
        .order("applied_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// P4: PM APPLICATION REVIEW
// ─────────────────────────────────────────────────────────────────────────────

export async function getProjectApplications(projectId: string) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("volunteer_applications")
        .select("*, profiles(*)")
        .eq("project_id", projectId)
        .order("applied_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data;
}

export async function reviewApplication(params: {
    applicationId: string;
    status: ApplicationStatus;
}) {
    const userId = await requireAuth();
    const supabase = createAdminClient();

    const { error } = await supabase
        .from("volunteer_applications")
        .update({
            status: params.status,
            reviewed_at: new Date().toISOString(),
            reviewed_by: userId,
        })
        .eq("id", params.applicationId);

    if (error) throw new Error(error.message);
    revalidatePath("/projects");
    return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// P5: HOUR LOGGING
// ─────────────────────────────────────────────────────────────────────────────

export async function logHours(params: {
    projectId: string;
    dateOfWork: string;
    hoursLogged: number;
    workDescription?: string;
    deliverableUrl?: string;
}) {
    const userId = await requireAuth();
    const supabase = createAdminClient();

    const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", userId)
        .single();

    if (!profile) throw new Error("Profile not found.");

    const { error } = await supabase.from("volunteer_contributions").insert({
        project_id: params.projectId,
        profile_id: profile.id,
        date_of_work: params.dateOfWork,
        hours_logged: params.hoursLogged,
        work_description: params.workDescription ?? null,
        deliverable_url: params.deliverableUrl ?? null,
        pm_approved: false,
    });

    if (error) throw new Error(error.message);
    revalidatePath(`/projects/${params.projectId}`);
    return { success: true };
}

export async function getMyContributions(projectId?: string) {
    const userId = await requireAuth();
    const supabase = createAdminClient();

    const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", userId)
        .single();

    if (!profile) return [];

    let query = supabase
        .from("volunteer_contributions")
        .select("*, projects(title, team)")
        .eq("profile_id", profile.id)
        .order("date_of_work", { ascending: false });

    if (projectId) query = query.eq("project_id", projectId);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// I2: PM HOUR APPROVAL — triggers impact calculation
// ─────────────────────────────────────────────────────────────────────────────

export async function approveContribution(contributionId: string) {
    const userId = await requireAuth();
    const supabase = createAdminClient();

    // Fetch contribution + profile data for calculations
    const { data: contribution, error: contribError } = await supabase
        .from("volunteer_contributions")
        .select("*, profiles(*), projects(*)")
        .eq("id", contributionId)
        .single();

    if (contribError || !contribution) throw new Error("Contribution not found.");

    const profile = contribution.profiles as Profile;
    const project = contribution.projects as Project;

    if (!profile) throw new Error("Volunteer profile not found.");

    // Get volunteer's skill tags to calculate average complexity multiplier
    const { data: volunteerSkills } = await supabase
        .from("volunteer_skills")
        .select("skill_tags(complexity_multiplier)")
        .eq("profile_id", profile.id);

    const multipliers = (volunteerSkills || [])
        .map((vs: any) => vs.skill_tags?.complexity_multiplier ?? 1.0)
        .filter((m: number) => m > 0);

    const avgSkillMultiplier =
        multipliers.length > 0
            ? multipliers.reduce((a: number, b: number) => a + b, 0) / multipliers.length
            : 1.0;

    // Fetch base rate from market_rate_lookup
    const industryVertical = profile.industry_vertical ?? "General / Other";
    const yearsExp = profile.years_of_experience ?? 0;
    const experienceBand = getExperienceBand(yearsExp);

    const { data: rateRow } = await supabase
        .from("market_rate_lookup")
        .select("base_rate_inr")
        .eq("industry_vertical", industryVertical)
        .eq("experience_band", experienceBand)
        .single();

    // Fallback to General / Other if specific vertical not configured
    const { data: fallbackRate } = rateRow
        ? { data: rateRow }
        : await supabase
            .from("market_rate_lookup")
            .select("base_rate_inr")
            .eq("industry_vertical", "General / Other")
            .eq("experience_band", experienceBand)
            .single();

    const baseRate = (fallbackRate as any)?.base_rate_inr ?? 500;

    // Calculate impact
    const result = calculateImpact({
        baseRateInr: baseRate,
        skillComplexityMultiplier: avgSkillMultiplier,
        projectImpactTier: (project?.impact_tier ?? "Community") as ImpactTier,
        yearsOfExperience: yearsExp,
        volunteerType: (profile.volunteer_type ?? "external_individual") as any,
        hoursLogged: contribution.hours_logged,
    });

    // Write results back to the contribution row
    const { error: updateError } = await supabase
        .from("volunteer_contributions")
        .update({
            pm_approved: true,
            approved_by: userId,
            calculated_hourly_rate: result.calculatedHourlyRate,
            calculated_value: result.calculatedValue,
        })
        .eq("id", contributionId);

    if (updateError) throw new Error(updateError.message);

    revalidatePath("/projects");
    return { success: true, result };
}

// ─────────────────────────────────────────────────────────────────────────────
// I3: IMPACT SUMMARY — aggregate stats for a volunteer
// ─────────────────────────────────────────────────────────────────────────────

export async function getMyImpactSummary() {
    const userId = await requireAuth();
    const supabase = createAdminClient();

    const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", userId)
        .single();

    if (!profile) return null;

    const { data, error } = await supabase
        .from("volunteer_contributions")
        .select("hours_logged, calculated_value, pm_approved, projects(title, team)")
        .eq("profile_id", profile.id);

    if (error) throw new Error(error.message);

    const totalHoursLogged = data.reduce((sum, r) => sum + (r.hours_logged ?? 0), 0);
    const approvedContributions = data.filter((r) => r.pm_approved);
    const totalApprovedHours = approvedContributions.reduce(
        (sum, r) => sum + (r.hours_logged ?? 0),
        0
    );
    const totalValue = approvedContributions.reduce(
        (sum, r) => sum + (r.calculated_value ?? 0),
        0
    );

    return {
        totalHoursLogged,
        totalApprovedHours,
        totalValue,
        contributionCount: data.length,
        approvedCount: approvedContributions.length,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// D2: ADMIN — All volunteer profiles (for users table)
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllProfiles() {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data as Profile[];
}

export async function getVolunteerImpactSummaries() {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("volunteer_contributions")
        .select("profile_id, hours_logged, calculated_value, pm_approved")
        .eq("pm_approved", true);

    if (error) throw new Error(error.message);

    // Group by profile_id
    const summaries: Record<string, { totalHours: number; totalValue: number }> = {};
    for (const row of data) {
        if (!summaries[row.profile_id]) {
            summaries[row.profile_id] = { totalHours: 0, totalValue: 0 };
        }
        summaries[row.profile_id].totalHours += row.hours_logged ?? 0;
        summaries[row.profile_id].totalValue += row.calculated_value ?? 0;
    }
    return summaries;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUPPORT HUB
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a new support ticket linked to the authenticated user's profile.
 */
export async function createTicket(params: {
    title: string;
    description: string;
    category: string;
    priority: string;
}) {
    const userId = await requireAuth();
    const supabase = createAdminClient();

    // 1. Get profile UUID
    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", userId)
        .single();

    if (profileError || !profile) {
        throw new Error("You must complete your profile sync before raising a ticket.");
    }

    // 2. Insert ticket
    const { data, error } = await supabase
        .from("tickets")
        .insert({
            title: params.title,
            description: params.description,
            category: params.category,
            priority: params.priority,
            created_by: profile.id,
            status: "Open"
        })
        .select()
        .single();

    if (error) {
        console.error("[createTicket] Supabase Error:", error);
        throw new Error(error.message);
    }

    return data;
}

/**
 * Adds a new FAQ entry to the database.
 */
export async function createFAQ(params: { question: string; answer: string; orderIndex: number }) {
    await requireAuth();
    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from("faqs")
        .insert({
            question: params.question,
            answer: params.answer,
            order_index: params.orderIndex,
            is_published: true
        })
        .select()
        .single();

    if (error) {
        console.error("[createFAQ] Supabase Error:", error);
        throw new Error(error.message);
    }

    return data;
}

/**
 * Removes an FAQ entry.
 */
export async function deleteFAQ(id: string) {
    await requireAuth();
    const supabase = createAdminClient();

    const { error } = await supabase.from("faqs").delete().eq("id", id);
    if (error) {
        console.error("[deleteFAQ] Supabase Error:", error);
        throw new Error(error.message);
    }
    return true;
}

/**
 * Adds a new entry to the contact directory.
 */
export async function createDirectoryNode(params: { type: string; title: string; value: string; icon: string; orderIndex: number }) {
    await requireAuth();
    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from("contact_directory")
        .insert({
            type: params.type,
            title: params.title,
            value: params.value,
            icon: params.icon,
            order_index: params.orderIndex
        })
        .select()
        .single();

    if (error) {
        console.error("[createDirectoryNode] Supabase Error:", error);
        throw new Error(error.message);
    }

    return data;
}

/**
 * Removes a node from the directory.
 */
export async function deleteDirectoryNode(id: string) {
    await requireAuth();
    const supabase = createAdminClient();

    const { error } = await supabase.from("contact_directory").delete().eq("id", id);
    if (error) {
        console.error("[deleteDirectoryNode] Supabase Error:", error);
        throw new Error(error.message);
    }
    return true;
}

/**
 * Staff-only: Update a ticket's status or assignment.
 */
export async function updateTicketInternal(ticketId: string, updates: any) {
    await requireAuth();
    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from("tickets")
        .update(updates)
        .eq("id", ticketId)
        .select()
        .single();

    if (error) {
        console.error("[updateTicket] Supabase Error:", error);
        throw new Error(error.message);
    }

    return data;
}

/**
 * Staff-only: Add a message to a ticket timeline.
 */
export async function addTicketResponse(params: { ticketId: string; authorName: string; content: string; authorRole?: string }) {
    await requireAuth();
    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from("ticket_timeline")
        .insert({
            ticket_id: params.ticketId,
            type: "message",
            author_name: params.authorName,
            author_role: params.authorRole || "Staff",
            text_content: params.content
        })
        .select()
        .single();

    if (error) {
        console.error("[addTicketResponse] Supabase Error:", error);
        throw new Error(error.message);
    }

    return data;
}

/**
 * Fetches all FAQs.
 */
export async function getFAQs() {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .eq("is_published", true)
        .order("order_index", { ascending: true });

    if (error) throw new Error(error.message);
    return data;
}

/**
 * Fetches all directory entries.
 */
export async function getDirectory() {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("contact_directory")
        .select("*")
        .order("order_index", { ascending: true });

    if (error) throw new Error(error.message);
    return data;
}

/**
 * Fetches ticketing dropdown configuration.
 */
export async function getTicketingConfig() {
    const supabase = createAdminClient();
    const { data: cats } = await supabase.from('ticket_categories').select('name').order('name');
    const { data: pris } = await supabase.from('ticket_priorities').select('name').order('name');
    
    return {
        categories: cats?.map(c => c.name) || [],
        priorities: pris?.map(p => p.name) || []
    };
}

/**
 * Fetches tickets belonging to the authenticated volunteer.
 */
export async function getMyTickets() {
    const userId = await requireAuth();
    const supabase = createAdminClient();

    const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", userId)
        .single();

    if (!profile) return [];

    const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("created_by", profile.id)
        .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data;
}

/**
 * Staff-only: Fetches ALL tickets with profile information.
 */
export async function getAllTickets() {
    await requireAuth();
    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from("tickets")
        .select("*, profiles(full_name, email)")
        .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data;
}

/**
 * Fetches the timeline for a specific ticket.
 */
export async function getTicketTimeline(ticketId: string) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("ticket_timeline")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
}

/**
 * For the SETTINGS PAGE: lists all non-volunteer users from Supabase Auth.
 */
export async function getAllNonVolunteers() {
    const supabase = createAdminClient();

    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (authError) throw new Error(authError.message);

    const staffAuthIds = users
        .filter(u => u.app_metadata?.role && u.app_metadata.role !== "Volunteer")
        .map(u => u.id);

    if (staffAuthIds.length === 0) return [];

    const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, auth_user_id")
        .in("auth_user_id", staffAuthIds)
        .order("full_name");

    if (profilesError) throw new Error(profilesError.message);

    return (profiles || []).map(p => {
        const authUser = users.find(u => u.id === p.auth_user_id);
        return { ...p, role: authUser?.app_metadata?.role || "Staff" };
    });
}

/**
 * For the MANAGE TICKET dropdown: returns only curated assignees from ticket_assignees table.
 */
export async function getEligibleStaff() {
    const supabase = createAdminClient();

    const { data: assignees, error: assigneesError } = await supabase
        .from("ticket_assignees")
        .select("profile_id, profiles(id, full_name, email)")
        .order("created_at");

    if (assigneesError) throw new Error(assigneesError.message);

    return (assignees || []).map((row: any) => row.profiles).filter(Boolean);
}

/**
 * Adds a user to the curated ticket assignees list.
 */
export async function addTicketAssignee(profileId: string) {
    await requireAuth();
    const supabase = createAdminClient();

    const { error } = await supabase
        .from("ticket_assignees")
        .insert({ profile_id: profileId });

    if (error && error.code !== "23505") throw new Error(error.message); // ignore duplicate
    return true;
}

/**
 * Removes a user from the curated ticket assignees list.
 */
export async function removeTicketAssignee(profileId: string) {
    await requireAuth();
    const supabase = createAdminClient();

    const { error } = await supabase
        .from("ticket_assignees")
        .delete()
        .eq("profile_id", profileId);

    if (error) throw new Error(error.message);
    return true;
}

/**
 * Full update for a ticket including metadata and timeline log.
 */
export async function updateTicketFull(ticketId: string, updates: any, authorName: string) {
    const supabase = createAdminClient();
    
    // 0. Fetch old ticket for delta
    const { data: oldTicket } = await supabase.from('tickets').select('*').eq('id', ticketId).single();

    // 1. Update the ticket
    const { data: ticket, error: ticketError } = await supabase
        .from("tickets")
        .update(updates)
        .eq("id", ticketId)
        .select()
        .single();

    if (ticketError) throw new Error(ticketError.message);

    // 2. Add specific timeline entries if needed
    if (oldTicket) {
        const events = [];
        
        if (oldTicket.status !== updates.status) {
            events.push({
                ticket_id: ticketId,
                type: "status",
                author_name: authorName,
                author_role: "Staff",
                text_content: `changed status from ${oldTicket.status} to ${updates.status}`
            });
        }
        
        if (oldTicket.priority !== updates.priority) {
            events.push({
                ticket_id: ticketId,
                type: "assignment",
                author_name: authorName,
                author_role: "Staff",
                text_content: `changed priority from ${oldTicket.priority || 'N/A'} to ${updates.priority}`
            });
        }

        const oldAssigned = oldTicket.assigned_users || [];
        const newAssigned = updates.assigned_users || [];
        if (oldAssigned.length !== newAssigned.length || !oldAssigned.every((u: string) => newAssigned.includes(u))) {
            // Resolve UUIDs to names
            let assigneeNames = "no one";
            if (newAssigned.length > 0) {
                const { data: profiles } = await supabase
                    .from("profiles")
                    .select("full_name")
                    .in("id", newAssigned);
                if (profiles && profiles.length > 0) {
                    assigneeNames = profiles.map((p: any) => p.full_name).join(", ");
                }
            }

            events.push({
                ticket_id: ticketId,
                type: "assignment",
                author_name: authorName,
                author_role: "Staff",
                text_content: newAssigned.length > 0
                    ? `assigned this ticket to ${assigneeNames}`
                    : `cleared all assignments`
            });
        }

        if (events.length > 0) {
            await supabase.from('ticket_timeline').insert(events);
        }
    }

    return ticket;
}

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

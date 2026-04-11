"use server";

import { createAdminClient, createServerClient } from "@/lib/supabase-server";
import { getUserRole, isTrueAdmin } from "@/lib/roles";
import { revalidatePath } from "next/cache";

/**
 * Projects CRUD
 */
export async function getProjects() {
    const supabase = await createServerClient();
    const role = await getUserRole();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return [];

    let query = supabase.from("projects").select("*, department:departments(id, name)");

    // Volunteers and Operations can only see published projects
    if (role === "Volunteer" || role === "Operations") {
        query = query.eq("status", "published");
    } else if (role === "Program") {
        // Enforce department scoping for program managers
        const adminSupabase = createAdminClient();
        const { data: adminUser } = await adminSupabase.auth.admin.getUserById(user.id);
        const userDepts = (adminUser.user?.app_metadata?.departments as string[]) || [];

        if (userDepts.length > 0) {
            const { data: deptData } = await supabase.from("departments").select("id").in("name", userDepts);
            if (deptData && deptData.length > 0) {
                query = query.in("department_id", deptData.map((d) => d.id));
            } else {
                return []; // Unmatched department
            }
        }
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error && error.code !== "42P01") throw new Error(error.message);
    return data || [];
}

export async function getProjectById(projectId: string) {
    const supabase = await createServerClient();
    const { data, error } = await supabase
        .from("projects")
        .select("*, department:departments(id, name)")
        .eq("id", projectId)
        .single();
        
    if (error) throw new Error(error.message);
    return data;
}

export async function upsertProject(payload: any) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const fullPayload = {
        ...payload,
        created_by_auth_id: user.id,
    };

    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
        .from("projects")
        .upsert(fullPayload)
        .select()
        .single();

    if (error) throw new Error(error.message);

    revalidatePath("/projects");
    revalidatePath("/management/projects");
    return data;
}

export async function deleteProject(id: string) {
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase.from("projects").delete().eq("id", id);
    if (error) throw new Error(error.message);
    
    revalidatePath("/projects");
    revalidatePath("/management/projects");
}

/**
 * Project Onboarding Steps
 */
export async function getProjectOnboardingSteps(projectId: string) {
    const supabase = await createServerClient();
    const { data, error } = await supabase
        .from("project_onboarding_steps")
        .select("*")
        .eq("project_id", projectId)
        .order("step_order", { ascending: true });

    if (error && error.code !== "42P01") throw new Error(error.message);
    return data || [];
}

export async function upsertProjectOnboardingStep(payload: any) {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
        .from("project_onboarding_steps")
        .upsert(payload)
        .select()
        .single();

    if (error) throw new Error(error.message);
    
    revalidatePath("/projects");
    revalidatePath("/management/projects");
    return data;
}

export async function deleteProjectOnboardingStep(id: string) {
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase.from("project_onboarding_steps").delete().eq("id", id);
    if (error) throw new Error(error.message);
    
    revalidatePath("/projects");
    revalidatePath("/management/projects");
}

export async function reorderProjectOnboardingSteps(orderedIds: string[]) {
    const adminSupabase = createAdminClient();
    for (let i = 0; i < orderedIds.length; i++) {
        const id = orderedIds[i];
        const { error } = await adminSupabase
            .from("project_onboarding_steps")
            .update({ step_order: i + 1 })
            .eq("id", id);
        if (error) throw new Error(`Failed to reorder: ${error.message}`);
    }
    revalidatePath("/projects");
    revalidatePath("/management/projects");
}

/**
 * Volunteer Applications
 */
export async function getApplicationsForProject(projectId: string) {
    const supabase = await createServerClient();
    const { data, error } = await supabase
        .from("volunteer_applications")
        .select(`
            *,
            profile:profiles(full_name, email, phone, city, state, country)
        `)
        .eq("project_id", projectId)
        .order("applied_at", { ascending: false });

    if (error && error.code !== "42P01") throw new Error(error.message);
    return data || [];
}

export async function getMyApplications() {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase.from("profiles").select("id").eq("auth_user_id", user.id).single();
    if (!profile) return [];

    const { data, error } = await supabase
        .from("volunteer_applications")
        .select(`
            *,
            project:projects(title, description, department:departments(name), start_date, end_date)
        `)
        .eq("profile_id", profile.id)
        .order("applied_at", { ascending: false });

    if (error && error.code !== "42P01") throw new Error(error.message);
    return data || [];
}

export async function applyToProject(projectId: string) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase.from("profiles").select("id").eq("auth_user_id", user.id).single();
    if (!profile) throw new Error("Profile not found");

    const { data, error } = await supabase
        .from("volunteer_applications")
        .insert({
            project_id: projectId,
            profile_id: profile.id,
            status: "pending"
        })
        .select()
        .single();

    if (error) throw new Error(error.message);
    
    revalidatePath("/projects");
    return data;
}

export async function updateApplicationStatus(appId: string, status: "approved" | "rejected" | "pending", reason?: string) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const adminSupabase = createAdminClient();
    
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("auth_user_id", user.id).single();

    const { data, error } = await adminSupabase
        .from("volunteer_applications")
        .update({
            status,
            rejection_reason: reason || null,
            reviewed_at: new Date().toISOString(),
            reviewed_by: profile?.full_name || user.email
        })
        .eq("id", appId)
        .select()
        .single();

    if (error) throw new Error(error.message);
    
    revalidatePath("/projects");
    revalidatePath("/management/projects");
    return data;
}

/**
 * Volunteer Onboarding Progress
 */
export async function getVolunteerOnboardingProgress(applicationId: string) {
    const supabase = await createServerClient();
    const { data, error } = await supabase
        .from("volunteer_onboarding_progress")
        .select("*")
        .eq("application_id", applicationId);

    if (error && error.code !== "42P01") throw new Error(error.message);
    return data || [];
}

export async function upsertVolunteerOnboardingProgress(applicationId: string, stepId: string, completed: boolean) {
    const supabase = await createServerClient();
    const { data, error } = await supabase
        .from("volunteer_onboarding_progress")
        .upsert({
            application_id: applicationId,
            step_id: stepId,
            completed,
            completed_at: completed ? new Date().toISOString() : null
        }, { onConflict: "application_id, step_id" })
        .select()
        .single();

    if (error) throw new Error(error.message);
    
    revalidatePath("/projects");
    return data;
}

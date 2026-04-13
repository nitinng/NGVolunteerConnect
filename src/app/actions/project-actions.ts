"use server";

import { createAdminClient, createServerClient } from "@/lib/supabase-server";
import { getUserRole, isTrueAdmin } from "@/lib/roles";
import { revalidatePath } from "next/cache";

/**
 * Internal helper to evaluate screening criteria against a profile and manual answers
 */
async function evaluateScreeningInternal(profile: any, criteria: any[], manualAnswers: string[]) {
    if (!criteria || criteria.length === 0) return { score: 100, results: [] };

    let totalScore = 0;
    const results: any[] = [];
    let manualIdx = 0;

    criteria.forEach((criterion) => {
        let passed = false;
        let actualValue: any = null;
        let impact = 0;

        if (criterion.type === 'manual') {
            actualValue = manualAnswers[manualIdx] || "";
            manualIdx++;

            if (criterion.format === 'text') {
                // Text responses are NOT auto-graded. 
                // We mark them as "passed" for the automated flow so they don't trigger rejection,
                // but their weighted impact is 0.
                passed = true;
                impact = 0;
            } else {
                // Dropdown auto-grading
                passed = String(actualValue).toLowerCase() === String(criterion.expectedValue).toLowerCase();
                impact = passed ? criterion.weight : 0;
            }

            totalScore += impact;
            
            results.push({
                label: criterion.label,
                type: criterion.type,
                format: criterion.format || 'dropdown',
                passed,
                actualValue,
                expectedValue: criterion.expectedValue,
                weight: criterion.weight,
                impact
            });
        }
    });

    return { score: totalScore, results };
}

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

export async function duplicateProject(projectId: string) {
    const supabase = await createServerClient();
    const { data: sourceProject, error: fetchError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
    
    if (fetchError) throw new Error(`Source project not found: ${fetchError.message}`);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // 1. Duplicate Project
    const newProjectPayload = {
        ...sourceProject,
        id: undefined, // Let DB generate new ID
        title: `${sourceProject.title} (Copy)`,
        status: "draft",
        created_by_auth_id: user.id,
        created_at: undefined // Let DB generate
    };

    const adminSupabase = createAdminClient();
    const { data: newProject, error: insertError } = await adminSupabase
        .from("projects")
        .insert(newProjectPayload)
        .select()
        .single();

    if (insertError) throw new Error(`Failed to duplicate project: ${insertError.message}`);

    // 2. Duplicate Onboarding Steps if any
    const { data: steps, error: stepsError } = await supabase
        .from("project_onboarding_steps")
        .select("*")
        .eq("project_id", projectId);

    if (steps && steps.length > 0) {
        const newSteps = steps.map(s => ({
            ...s,
            id: undefined,
            project_id: newProject.id,
            created_at: undefined,
            updated_at: undefined
        }));
        const { error: stepsInsertError } = await adminSupabase
            .from("project_onboarding_steps")
            .insert(newSteps);
        
        if (stepsInsertError) console.error("Failed to duplicate onboarding steps:", stepsInsertError.message);
    }

    revalidatePath("/projects");
    revalidatePath("/management/projects");
    return newProject;
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
            profile:profiles(*)
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

export async function applyToProject(projectId: string, screeningAnswers: string[] = []) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase.from("profiles").select("id").eq("auth_user_id", user.id).single();
    if (!profile) throw new Error("Profile not found");

    // Check if project has any onboarding steps
    const { data: steps } = await supabase.from("project_onboarding_steps").select("id").eq("project_id", projectId);
    const { data: project } = await supabase.from("projects").select("*").eq("id", projectId).single();
    if (!project) throw new Error("Project not found");

    // Perform Automated Screening
    const { data: fullProfile } = await supabase.from("profiles").select("*").eq("id", profile.id).single();
    const { score, results } = await evaluateScreeningInternal(fullProfile, project.screening_criteria, screeningAnswers);
    
    const cutoff = project.screening_cutoff_score || 75;
    const passedScreening = score >= cutoff;

    let initialStatus: string = "pending_screening";
    if (!passedScreening) {
        initialStatus = "rejected";
    }

    const { data, error } = await supabase
        .from("volunteer_applications")
        .insert({
            project_id: projectId,
            profile_id: profile.id,
            status: initialStatus,
            screening_answers: screeningAnswers,
            screening_score: score,
            screening_results: results,
            rejection_reason: passedScreening ? null : `Automated Screening Score: ${score}/${cutoff}. Did not meet project criteria.`
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
    const { data: currentApp } = await adminSupabase.from("volunteer_applications").select("status, project_id").eq("id", appId).single();
    
    let finalStatus: string = status;
    if (currentApp?.status === 'pending_screening' && status === 'approved') {
        // Approving screening: move to onboarding if tasks exist, else move to final review (pending)
        const { count } = await adminSupabase.from("onboarding_modules").select("id", { count: 'exact', head: true }).eq("project_id", currentApp.project_id);
        finalStatus = (count && count > 0) ? "onboarding" : "pending";
    }

    const { data: profile } = await supabase.from("profiles").select("full_name").eq("auth_user_id", user.id).single();

    const { data, error } = await adminSupabase
        .from("volunteer_applications")
        .update({
            status: finalStatus,
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

export async function withdrawApplication(appId: string, feedback: string) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
        .from("volunteer_applications")
        .update({
            status: "withdrawn",
            withdrawal_feedback: feedback
        })
        .eq("id", appId);

    if (error) throw new Error(error.message);
    
    revalidatePath("/projects");
    revalidatePath("/management/projects");
}

export async function removeVolunteer(appId: string, reason: string) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const adminSupabase = createAdminClient();
    
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("auth_user_id", user.id).single();

    const { error } = await adminSupabase
        .from("volunteer_applications")
        .update({
            status: "removed",
            removal_reason: reason,
            removed_at: new Date().toISOString(),
            reviewed_by: profile?.full_name || user.email
        })
        .eq("id", appId);

    if (error) throw new Error(error.message);
    
    revalidatePath("/projects");
    revalidatePath("/management/projects");
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
    
    // Check if all steps are completed to move to 'pending' review status
    if (completed) {
        const adminSupabase = createAdminClient();
        const { data: app } = await adminSupabase.from("volunteer_applications").select("id, project_id, status").eq("id", applicationId).single();
        
        if (app && app.status === 'onboarding') {
            const { data: allSteps } = await adminSupabase.from("project_onboarding_steps").select("id").eq("project_id", app.project_id);
            const { data: completedSteps } = await adminSupabase.from("volunteer_onboarding_progress").select("step_id").eq("application_id", applicationId).eq("completed", true);
            
            if (allSteps && completedSteps && completedSteps.length >= allSteps.length) {
                await adminSupabase.from("volunteer_applications").update({ status: 'pending' }).eq("id", applicationId);
            }
        }
    }

    revalidatePath("/projects");
    revalidatePath("/management/projects");
    return data;
}
export async function manualAssignVolunteer(projectId: string, profileId: string) {
    const adminSupabase = createAdminClient();
    
    // Create an approved application directly
    const { data, error } = await adminSupabase
        .from("volunteer_applications")
        .upsert({
            project_id: projectId,
            profile_id: profileId,
            status: "approved",
            reviewed_at: new Date().toISOString(),
            reviewed_by: "Manual Assignment"
        }, { onConflict: "project_id, profile_id" })
        .select()
        .single();

    if (error) throw new Error(error.message);
    
    revalidatePath("/projects");
    revalidatePath("/management/projects");
    return data;
}

/**
 * Retrieves modular onboarding responses for a specific application review
 */
export async function getOnboardingResponsesByApplication(applicationId: string) {
    const adminSupabase = createAdminClient();
    
    const { data: app, error } = await adminSupabase
        .from("volunteer_applications")
        .select(`
            *,
            profile:profiles(auth_user_id),
            project:projects(id)
        `)
        .eq("id", applicationId)
        .single();
    
    if (error || !app) throw new Error("Application not found");
    const authUserId = app.profile?.auth_user_id;
    if (!authUserId) return [];

    // Get all modules and tasks for this project
    const { data: modules } = await adminSupabase
        .from("onboarding_modules")
        .select(`
            id, title, description, order_index,
            tasks:onboarding_tasks(
                id, title, description, order_index,
                blocks:onboarding_content_blocks(*)
            )
        `)
        .eq("project_id", app.project_id)
        .order("order_index", { ascending: true });

    if (!modules) return [];

    // Get all responses for this volunteer
    const { data: responses } = await adminSupabase
        .from("onboarding_user_responses")
        .select("*")
        .eq("user_id", authUserId);

    // Map responses to blocks
    return modules.map(m => ({
        ...m,
        tasks: (m as any).tasks.map((t: any) => ({
            ...t,
            blocks: t.blocks.map((b: any) => ({
                ...b,
                response: responses?.find(r => r.block_id === b.id)?.response_value
            })).filter((b: any) => ['reflection_question', 'quiz_mcq', 'feedback_form', 'consent_form'].includes(b.type))
        })).filter((t: any) => t.blocks.length > 0)
    })).filter(m => m.tasks.length > 0);
}

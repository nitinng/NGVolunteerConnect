"use server";
import { createAdminClient, createServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export type Department = {
    id: string;
    name: string;
    description: string | null;
};

export type GeneralModule = {
    id: string;
    title: string;
    description: string;
    icon: string;
    color: string;
    order_index: number;
    type: 'General' | 'Specific';
    department_id: string | null;
    created_at?: string;
    updated_at?: string;
};

export type ContentBlock = {
    id: string;
    task_id: string;
    type: string;
    title: string | null;
    content: string | null;
    order_index: number;
    layout: string;
    page_behavior: string;
    metadata: any;
    created_at?: string;
    updated_at?: string;
};

export type UserResponse = {
    id: string;
    user_id: string;
    block_id: string;
    task_id: string;
    response_value: any;
    created_at?: string;
    updated_at?: string;
};

export type TaskProgress = {
    id?: string;
    user_id?: string;
    task_id: string;
    completed_pages: number[];
    is_completed: boolean;
    completed_at?: string;
    created_at?: string;
    updated_at?: string;
};

export type GeneralTask = {
    id: string;
    module_id: string;
    title: string;
    description: string;
    icon: string;
    content_type: string;
    content_url: string | null;
    content_body: string | null;
    order_index: number;
    created_at?: string;
    updated_at?: string;
};

export async function getDepartments(): Promise<Department[]> {
    const supabase = await createServerClient();
    const { data, error } = await supabase.from('departments').select('*').order('name', { ascending: true });
    if (error && error.code === '42P01') return [];
    if (error) throw new Error(error.message);
    return data || [];
}

export async function upsertDepartment(payload: Partial<Department>) {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('departments').upsert(payload).select().single();
    if (error) throw new Error(error.message);
    revalidatePath("/management/departments");
    revalidatePath("/management/onboarding");
    return data;
}

export async function deleteDepartment(id: string) {
    const supabase = createAdminClient();
    const { error } = await supabase.from('departments').delete().eq('id', id);
    if (error) throw new Error(error.message);
    revalidatePath("/management/departments");
    revalidatePath("/management/onboarding");
}

export async function getGeneralOnboardingModules(): Promise<GeneralModule[]> {
    const supabase = await createServerClient();
    const { data, error } = await supabase.from('onboarding_modules').select('*').order('order_index', { ascending: true });
    
    // For now, fail gracefully if table doesn't exist yet (before user runs the SQL)
    if (error && error.code === '42P01') return [];
    if (error) throw new Error(error.message);
    
    return data || [];
}

export async function getGeneralOnboardingTasks(): Promise<GeneralTask[]> {
    const supabase = await createServerClient();
    const { data, error } = await supabase.from('onboarding_tasks').select('*').order('order_index', { ascending: true });
    
    if (error && error.code === '42P01') return [];
    if (error) throw new Error(error.message);
    
    return data || [];
}

export async function upsertModule(payload: Partial<GeneralModule>) {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('onboarding_modules').upsert(payload).select().single();
    if (error) throw new Error(error.message);
    revalidatePath("/management/onboarding");
    revalidatePath("/onboarding");
    return data;
}

export async function deleteModule(id: string) {
    const supabase = createAdminClient();
    const { error } = await supabase.from('onboarding_modules').delete().eq('id', id);
    if (error) throw new Error(error.message);
    revalidatePath("/management/onboarding");
    revalidatePath("/onboarding");
}

export async function reorderModules(orderedIds: string[]) {
    const supabase = createAdminClient();
    for (let i = 0; i < orderedIds.length; i++) {
        const id = orderedIds[i];
        const { error } = await supabase.from('onboarding_modules').update({ order_index: i + 1 }).eq('id', id);
        if (error) throw new Error(`Failed to reorder: ${error.message}`);
    }
    revalidatePath("/management/onboarding");
    revalidatePath("/onboarding");
}

export async function reorderTasks(orderedIds: string[]) {
    const supabase = createAdminClient();
    for (let i = 0; i < orderedIds.length; i++) {
        const id = orderedIds[i];
        const { error } = await supabase.from('onboarding_tasks').update({ order_index: i + 1 }).eq('id', id);
        if (error) throw new Error(`Failed to reorder: ${error.message}`);
    }
    revalidatePath("/management/onboarding");
    revalidatePath("/onboarding");
}

export async function upsertTask(payload: Partial<GeneralTask>) {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('onboarding_tasks').upsert(payload).select().single();
    if (error) throw new Error(error.message);
    revalidatePath("/management/onboarding");
    revalidatePath("/onboarding");
    return data;
}

export async function deleteTask(id: string) {
    const supabase = createAdminClient();
    const { error } = await supabase.from('onboarding_tasks').delete().eq('id', id);
    if (error) throw new Error(error.message);
    revalidatePath("/management/onboarding");
    revalidatePath("/onboarding");
}

export async function getContentBlocks(taskId: string): Promise<ContentBlock[]> {
    const supabase = await createServerClient();
    const { data, error } = await supabase.from('onboarding_content_blocks')
        .select('*')
        .eq('task_id', taskId)
        .order('order_index', { ascending: true });
    
    if (error && error.code === '42P01') return [];
    if (error) throw new Error(error.message);
    
    return data || [];
}

export async function getAllContentBlocks(): Promise<ContentBlock[]> {
    const supabase = await createServerClient();
    const { data, error } = await supabase.from('onboarding_content_blocks')
        .select('*')
        .order('order_index', { ascending: true });
    
    if (error && error.code === '42P01') return [];
    if (error) throw new Error(error.message);
    
    return data || [];
}

export async function upsertContentBlock(payload: Partial<ContentBlock>) {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('onboarding_content_blocks').upsert(payload).select().single();
    if (error) throw new Error(error.message);
    revalidatePath("/management/onboarding");
    revalidatePath("/onboarding");
    return data;
}

export async function deleteContentBlock(id: string) {
    const supabase = createAdminClient();
    const { error } = await supabase.from('onboarding_content_blocks').delete().eq('id', id);
    if (error) throw new Error(error.message);
    revalidatePath("/management/onboarding");
    revalidatePath("/onboarding");
}

export async function reorderContentBlocks(orderedIds: string[]) {
    const supabase = createAdminClient();
    for (let i = 0; i < orderedIds.length; i++) {
        const id = orderedIds[i];
        const { error } = await supabase.from('onboarding_content_blocks').update({ order_index: i + 1 }).eq('id', id);
        if (error) throw new Error(`Failed to reorder: ${error.message}`);
    }
    revalidatePath("/management/onboarding");
    revalidatePath("/onboarding");
}

export async function getUserResponses(taskId: string): Promise<UserResponse[]> {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('onboarding_user_responses')
        .select('*')
        .eq('task_id', taskId)
        .eq('user_id', user.id);
    
    if (error && error.code === '42P01') return [];
    if (error) throw new Error(error.message);
    
    return data || [];
}

export async function upsertUserResponse(payload: Partial<UserResponse>) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const fullPayload = {
        ...payload,
        user_id: user.id
    };

    // We can't use generic upsert easily if there's no unique constraint without ON CONFLICT statement,
    // but the SQL table HAS a UNIQUE(user_id, block_id). So upsert will work.
    const { data, error } = await supabase
        .from('onboarding_user_responses')
        .upsert(fullPayload, { onConflict: 'user_id, block_id' })
        .select()
        .single();
    
    if (error) throw new Error(error.message);
    revalidatePath("/onboarding");
    return data;
}

export async function getUserTaskProgress(): Promise<TaskProgress[]> {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('onboarding_task_progress')
        .select('*')
        .eq('user_id', user.id);
    
    if (error && error.code === '42P01') return [];
    if (error) throw new Error(error.message);
    
    return data || [];
}

export async function upsertUserTaskProgress(payload: Partial<TaskProgress>) {
    const supabase = await createServerClient();
    const adminSupabase = createAdminClient(); // Use admin for profile update
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const fullPayload = {
        ...payload,
        user_id: user.id
    };

    const { data, error } = await supabase
        .from('onboarding_task_progress')
        .upsert(fullPayload, { onConflict: 'user_id, task_id' })
        .select()
        .single();
    
    if (error) throw new Error(error.message);

    // RECALCULATE AGGREGATE PERCENTAGE
    // 1. Get total tasks
    const { count: totalTasks } = await adminSupabase
        .from('onboarding_tasks')
        .select('*', { count: 'exact', head: true });

    // 2. Get completed tasks for this user
    const { count: completedTasks } = await adminSupabase
        .from('onboarding_task_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_completed', true);

    const percentage = totalTasks && totalTasks > 0 
        ? Math.round(((completedTasks || 0) / totalTasks) * 100) 
        : 0;

    // 3. Update profile
    await adminSupabase
        .from('profiles')
        .update({ 
            onboarding_percentage: percentage,
            onboarding_completed: percentage === 100 
        })
        .eq('auth_user_id', user.id);

    revalidatePath("/onboarding");
    revalidatePath("/admin");
    return data;
}


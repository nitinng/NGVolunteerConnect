"use server";

import { createServerClient } from "@/lib/supabase-server";
import { SkillCategory, SkillSubcategory } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

// --- Categories ---

export async function getSkillCategories() {
    const supabase = await createServerClient();
    const { data, error } = await supabase
        .from("skill_categories")
        .select("*")
        .order("display_order", { ascending: true });

    if (error) {
        console.error("Error fetching skill categories:", error);
        return [];
    }
    return data as SkillCategory[];
}

export async function createSkillCategory(category: Omit<SkillCategory, "id" | "created_at">) {
    const supabase = await createServerClient();
    const { data, error } = await supabase
        .from("skill_categories")
        .insert(category)
        .select()
        .single();

    if (error) throw error;
    revalidatePath("/skills");
    return data as SkillCategory;
}

export async function updateSkillCategory(id: string, updates: Partial<SkillCategory>) {
    const supabase = await createServerClient();
    const { data, error } = await supabase
        .from("skill_categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;
    revalidatePath("/skills");
    return data as SkillCategory;
}

export async function deleteSkillCategory(id: string) {
    const supabase = await createServerClient();
    const { error } = await supabase
        .from("skill_categories")
        .delete()
        .eq("id", id);

    if (error) throw error;
    revalidatePath("/skills");
    return true;
}

// --- Subcategories ---

export async function getSkillSubcategories() {
    const supabase = await createServerClient();
    const { data, error } = await supabase
        .from("skill_subcategories")
        .select("*, skill_categories(title)")
        .order("name", { ascending: true });

    if (error) {
        console.error("Error fetching skill subcategories:", error);
        return [];
    }
    return data as (SkillSubcategory & { skill_categories: { title: string } })[];
}

export async function createSkillSubcategory(subcategory: Omit<SkillSubcategory, "id" | "created_at">) {
    const supabase = await createServerClient();
    const { data, error } = await supabase
        .from("skill_subcategories")
        .insert(subcategory)
        .select()
        .single();

    if (error) throw error;
    revalidatePath("/skills");
    return data as SkillSubcategory;
}

export async function updateSkillSubcategory(id: string, updates: Partial<SkillSubcategory>) {
    const supabase = await createServerClient();
    const { data, error } = await supabase
        .from("skill_subcategories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;
    revalidatePath("/skills");
    return data as SkillSubcategory;
}

export async function deleteSkillSubcategory(id: string) {
    const supabase = await createServerClient();
    const { error } = await supabase
        .from("skill_subcategories")
        .delete()
        .eq("id", id);

    if (error) throw error;
    revalidatePath("/skills");
    return true;
}

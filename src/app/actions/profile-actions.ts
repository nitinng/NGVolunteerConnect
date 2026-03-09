"use server";
import { auth, clerkClient } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-server";
import { Profile } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

/**
 * Upserts the current user's Supabase profile.
 * Uses upsert so it creates the row if it doesn't exist yet,
 * or updates it if it does. Only writes to Supabase — Clerk is NOT touched.
 */
export async function updateProfile(updates: Partial<Omit<Profile, "id" | "auth_user_id" | "created_at">>) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Fetch name + email from Clerk to satisfy NOT NULL constraints
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);
    const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
    const fullName =
        `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || email;

    const supabase = createAdminClient();

    const payload = {
        auth_user_id: userId,
        full_name: fullName,
        email,
        ...updates,
        updated_at: new Date().toISOString(),
    };

    console.log("[updateProfile] Upserting payload keys:", Object.keys(payload));

    const { data, error, status, statusText } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "auth_user_id" })
        .select();

    if (error) {
        console.error("[updateProfile] Supabase error:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            status,
            statusText,
        });
        throw new Error(`Supabase: ${error.message}${error.hint ? ` — ${error.hint}` : ""}`);
    }

    console.log("[updateProfile] Success:", data);
    revalidatePath("/profile");
}

/**
 * Fetches the current user's full Supabase profile.
 */
export async function getMyProfile(): Promise<Profile | null> {
    const { userId } = await auth();
    if (!userId) return null;

    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("auth_user_id", userId)
        .single();

    if (error) {
        if (error.code === "PGRST116") return null; // no row yet — not an error
        console.error("[getMyProfile] Supabase error:", error.message, error.details);
        return null;
    }

    return data as Profile;
}

/**
 * Quick connectivity test — call from /api/db-check.
 */
export async function testSupabaseConnection() {
    const supabase = createAdminClient();
    const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

    if (error) return { ok: false, error: error.message, code: error.code };
    return { ok: true, rowCount: count };
}


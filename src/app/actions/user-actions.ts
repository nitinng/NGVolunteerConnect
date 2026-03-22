"use server";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

/**
 * Called by /register/complete after Google OAuth completes.
 * 
 * What goes to Supabase: ALL form data collected during registration steps 1–7
 */
export async function completeRegistration(userData: {
    fullName: string;
    city: string;
    state: string;
    country: string;
    description: string;
    experienceYears: string;
    startTime: string;
    source: string;
    sourceOther: string;
    volunteeringType: string;
    phone: string;
    linkedin: string;
    resumeUrl: string;
    inclusionAgreed: boolean;
}) {
    const { userId } = await auth();
    if (!userId) return;

    const supabase = createAdminClient();

    // 1. Check if profile already exists to avoid overriding data
    const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", userId)
        .maybeSingle();

    if (existingProfile) {
        console.log(`[completeRegistration] Profile already exists for user ${userId}, skipping updates.`);
        return { error: "USER_ALREADY_EXISTS" };
    }

    // 2. Get auth user's email and fallback name
    const { data: { user } } = await supabase.auth.admin.getUserById(userId);
    const email = user?.email ?? "";
    const fullName = userData.fullName || user?.user_metadata?.full_name || email;

    // 3. Update the auth user's metadata to include role and full_name
    await supabase.auth.admin.updateUserById(userId, {
        app_metadata: {
            ...user?.app_metadata,
            role: "Volunteer"
        },
        user_metadata: {
            ...user?.user_metadata,
            full_name: fullName
        }
    });

    // 4. Upsert the Supabase profile with ALL registration form data
    const { error } = await supabase
        .from("profiles")
        .upsert({
            auth_user_id: userId,
            full_name: fullName,
            email,
            // Registration form fields → all go to Supabase, NOT Clerk
            city: userData.city || null,
            state: userData.state || null,
            country: userData.country || null,
            description: userData.description || null,
            experience_years_label: userData.experienceYears || null,
            start_time: userData.startTime || null,
            source: userData.source || null,
            source_other: userData.sourceOther || null,
            volunteering_type: userData.volunteeringType || null,
            inclusion_agreed: userData.inclusionAgreed,
            linkedin_url: userData.linkedin || null,
            resume_url: userData.resumeUrl || null,
            phone: userData.phone || null,
            onboarding_completed: false,
        }, { onConflict: "auth_user_id" });

    if (error) {
        console.error("[completeRegistration] Supabase error:", error);
        throw new Error(error.message);
    }

    revalidatePath("/");
}

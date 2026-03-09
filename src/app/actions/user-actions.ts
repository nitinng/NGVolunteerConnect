"use server";
import { auth, clerkClient } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

/**
 * Called by /register/complete after Google OAuth completes.
 * 
 * What goes to Clerk:  role only (fullName is already on the Clerk user from Google)
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

    // 1. Set ONLY role in Clerk (fullName is already set by Google OAuth)
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
        publicMetadata: {
            role: "Volunteer",
        },
    });

    // 2. Get the user's email from Clerk to create the Supabase profile
    const clerkUser = await client.users.getUser(userId);
    const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
    const fullName = userData.fullName ||
        `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() ||
        email;

    const supabase = createAdminClient();

    // 3. Upsert the Supabase profile with ALL registration form data
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

import { createServerClient, createAdminClient } from "@/lib/supabase-server";

export async function auth() {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    return {
        userId: user?.id || null,
        sessionClaims: user ? ({
            metadata: {
                ...user.user_metadata,
                ...user.app_metadata,
                ...(user.email === 'nitin@navgurukul.org' ? { role: 'Admin' } : {})
            },
            role: user.email === 'nitin@navgurukul.org' ? 'Admin' : (user.app_metadata?.role || "Volunteer")
        } as any) : null
    };
}

export async function currentUser() {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Load full name from profile table fallback
    let fullName = user.user_metadata?.full_name;
    if (!fullName) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("auth_user_id", user.id)
            .maybeSingle();
        if (profile?.full_name) {
            fullName = profile.full_name;
        }
    }

    return {
        id: user.id,
        emailAddresses: [{ emailAddress: user.email || "" }],
        primaryEmailAddress: { emailAddress: user.email || "" },
        firstName: fullName?.split(" ")[0] || "",
        lastName: fullName?.split(" ").slice(1).join(" ") || "",
        fullName: fullName || "",
        imageUrl: user.user_metadata?.avatar_url || "",
        publicMetadata: {
            ...user.user_metadata,
            ...user.app_metadata,
            ...(user.email === 'nitin@navgurukul.org' ? { role: 'Admin' } : {})
        }
    };
}

export const supabaseAdmin = createAdminClient;


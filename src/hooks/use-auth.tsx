"use client";

import { createBrowserClient } from "@/lib/supabase";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";


export function useUser() {
    const [user, setUser] = useState<any>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    // useMemo ensures we always use the same client instance across renders.
    // Without this, each render creates/fetches a new instance reference, causing
    // stale closures in useEffect and broken auth state subscriptions.
    const supabase = useMemo(() => createBrowserClient(), []);

    useEffect(() => {
        let mounted = true;
        const getUser = async () => {
            try {
                // Use getSession instead of getUser for Client components. 
                // getUser() strictly forces a network request. This causes 4-8 concurrent HTTP requests on page reload!
                // getSession() resolves instantly from localStorage, and the onAuthStateChange handles renewals.
                const { data: { session }, error } = await supabase.auth.getSession();
                if (!mounted) return;

                const user = session?.user || null;

                if (error || !user) {
                    if (error) console.error("useUser hook session error:", error);
                    setUser(null);
                } else if (user) {
                    // Initialize from window object if possible to prevent simultaneous 
                    // extra DB hits from VolunteerDashboard and AppSidebar racing.
                    let dbName = (window as any)[`__ng_profile_cache_${user.id}`] || "";

                    if (mounted && !dbName) {
                        const { data: profile } = await supabase
                            .from("profiles")
                            .select("full_name")
                            .eq("auth_user_id", user.id)
                            .maybeSingle();

                        if (profile && profile.full_name) {
                            dbName = profile.full_name;
                            (window as any)[`__ng_profile_cache_${user.id}`] = dbName;
                        }
                    }

                    // Build the base user object from auth metadata.
                    // Check multiple sources for full_name, in order of preference:
                    // 1. Database profile (most accurate)
                    // 2. user_metadata.full_name (set by Supabase from Google OAuth)
                    // 3. identity_data.full_name (Google identity provider data)
                    // 4. identity_data.name (alternate Google field)
                    const googleIdentity = user.identities?.find((id: any) => id.provider === 'google');
                    const metaName = dbName
                        || user.user_metadata?.full_name
                        || googleIdentity?.identity_data?.full_name
                        || googleIdentity?.identity_data?.name
                        || "";
                    const metaAvatar = user.user_metadata?.avatar_url
                        || googleIdentity?.identity_data?.avatar_url
                        || googleIdentity?.identity_data?.picture
                        || "";

                    console.log("[useUser Auth Debug] Raw Auth Data:", {
                        authUserId: user.id,
                        dbName,
                        userMetadataName: user.user_metadata?.full_name,
                        googleIdentityName: googleIdentity?.identity_data?.full_name || googleIdentity?.identity_data?.name,
                        resolvedMetaName: metaName
                    });

                    setUser({
                        id: user.id,
                        emailAddresses: [{ emailAddress: user.email || "" }],
                        primaryEmailAddress: { emailAddress: user.email || "" },
                        firstName: metaName.split(" ")[0] || "",
                        lastName: metaName.split(" ").slice(1).join(" ") || "",
                        fullName: metaName,
                        imageUrl: metaAvatar,
                        publicMetadata: {
                            ...(user.user_metadata || {}),
                            ...(user.app_metadata || {}),
                            ...(user.email === 'nitin@navgurukul.org' ? { role: 'Admin' } : {})
                        },
                        update: async (updates: any) => {
                            let full_name = undefined;
                            if (updates.firstName || updates.lastName) {
                                full_name = `${updates.firstName || ""} ${updates.lastName || ""}`.trim();
                            }
                            await supabase.auth.updateUser({
                                data: {
                                    ...(full_name ? { full_name } : {})
                                }
                            });
                        }
                    });
                } else {
                    setUser(null);
                }
            } catch (err) {
                console.error("Critical error fetching user:", err);
                if (mounted) setUser(null);
            } finally {
                if (mounted) setIsLoaded(true);
            }
        };

        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
            if (event === 'SIGNED_OUT') {
                if (mounted) {
                    setUser(null);
                    setIsLoaded(true);
                }
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                // Re-fetch user on any auth state change that gives us a session
                if (session?.user) {
                    await getUser();
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [supabase]);

    return { user, isLoaded };
}

export function useAuthActions() {
    const supabase = createBrowserClient();
    const router = useRouter();

    return {
        signOut: async ({ redirectUrl }: { redirectUrl?: string } = {}) => {
            await supabase.auth.signOut();
            router.push(redirectUrl || "/login");
            router.refresh();
        }
    };
}

export function useSignIn() {
    const supabase = createBrowserClient();
    return {
        isLoaded: true,
        signIn: {
            authenticateWithRedirect: async ({ strategy, redirectUrl, redirectUrlComplete }: any) => {
                const baseUrl = window.location.origin;
                // Redirect to our server callback which exchanges the code securely, then forwards appropriately
                const nextPath = redirectUrlComplete || '/';
                const redirectTo = `${baseUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`;

                await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo,
                    }
                });
            }
        }
    };
}

export function useSignUp() {
    const signInHook = useSignIn();
    return {
        isLoaded: true,
        signUp: signInHook.signIn
    };
}



export function AuthenticateWithRedirectCallback(props: any) {
    const router = useRouter();
    useEffect(() => {
        // With Supabase OAuth, the redirect is handled automatically.
        // Once the user lands here, we should immediately redirect them to /register/complete
        // to finish the database sync.
        router.replace('/register/complete');
    }, [router]);
    return null;
}

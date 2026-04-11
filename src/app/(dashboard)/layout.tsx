import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"

import { getUserRole, isTrueAdmin } from "@/lib/roles"
import { cookies } from "next/headers"
import { auth, currentUser } from "@/lib/auth"
import { syncProfileToSupabase } from "@/app/actions/supabase-actions"
import { UserProvider } from "@/contexts/user-context"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const adminMode = await isTrueAdmin()

    // Read the dev override from cookies directly so the RoleSwitcher can track the "System" tab
    const cookieStore = await cookies()
    const rawDevOverride = cookieStore.get('dev-role-override')?.value
    const user = await currentUser();
    const currentRole = await getUserRole(user)

    const { sessionClaims } = await auth();
    const freshRole = user?.publicMetadata?.role as string | undefined;
    const baseRole = freshRole || (sessionClaims?.metadata?.role as string) || ((sessionClaims as any)?.role as string) || "Volunteer";
    const freshVolunteerEnabled = (user?.publicMetadata as any)?.volunteerEnabled === true;
    const volunteerEnabled = freshVolunteerEnabled || sessionClaims?.metadata?.volunteerEnabled === true || ((sessionClaims as any)?.volunteerEnabled === true);

    // F4: Ensure every authenticated user has a Supabase profile row.
    // This is a no-op if the profile already exists — safe to call on every load.
    let isLocked = false;
    try {
        if (user) {
            await syncProfileToSupabase({
                authUserId: user.id,
                email: user.emailAddresses[0]?.emailAddress ?? "",
                fullName: (`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.emailAddresses[0]?.emailAddress) ?? "Unknown",
            });
            
            const { getMyProfile } = await import("@/app/actions/profile-actions");
            const { isOnboardingLockedForUser } = await import("@/app/actions/general-onboarding-actions");
            const profile = await getMyProfile();
            if (profile) {
                isLocked = await isOnboardingLockedForUser(profile.id);
            }
        }
    } catch (e) {
        console.error("DashboardLayout context error:", e);
    }

    return (
        <UserProvider user={user ? {
            id: user.id,
            fullName: user.fullName || "",
            email: user.emailAddresses[0]?.emailAddress || "",
            imageUrl: user.imageUrl || "",
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            role: baseRole,
            volunteerEnabled: volunteerEnabled,
            isOnboardingLocked: isLocked,
            publicMetadata: user.publicMetadata || {},
        } : null}>
            <div className="[--header-height:calc(--spacing(14))]">
                <SidebarProvider className="flex flex-col">
                    <SiteHeader
                        isTrueAdmin={adminMode}
                        activeRole={rawDevOverride || "System"}
                        baseRole={baseRole}
                        volunteerEnabled={volunteerEnabled}
                    />
                    <div className="flex flex-1">
                        <AppSidebar role={currentRole} devOverride={rawDevOverride} isLocked={isLocked} />
                        <SidebarInset>
                            {children}
                        </SidebarInset>
                    </div>
                </SidebarProvider>
            </div>
        </UserProvider>
    )
}

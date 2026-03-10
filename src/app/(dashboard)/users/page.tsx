import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { UsersClient } from "./client-page";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function UsersPage() {
    const supabase = createAdminClient();
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const usersList = users || [];

    const { sessionClaims, userId } = await auth();
    if (!userId) {
        redirect("/sign-in");
    }

    // Get the properly simulated/resolved user role
    const { getUserRole } = await import("@/lib/roles");
    const activeRole = await getUserRole();

    // Fetch fresh actor data (needed for email + permissions)
    const { data: { user: freshUser } } = await supabase.auth.admin.getUserById(userId);

    // Check actor's true (non-simulated) role and email for security controls
    const actorEmail: string =
        (sessionClaims as any)?.email ||
        freshUser?.email ||
        "";
    const actorRole: string =
        (sessionClaims?.metadata?.role as string) ||
        (sessionClaims as any)?.role ||
        "Volunteer";
    const isRootActor = actorEmail === 'nitin@navgurukul.org' || userId === process.env.MASTER_USER_ID;

    // Only Admins or explicitly enabled Program/Ops can see the users management module
    const userManagementEnabled = freshUser?.app_metadata?.userManagementEnabled === true;
    const canSeeUsers = activeRole === "Admin" || (['Program', 'Operations'].includes(activeRole) && userManagementEnabled);

    if (!canSeeUsers) {
        redirect("/");
    }

    const serializedUsers = usersList.map((user) => {
        const email = user.email || "N/A";
        const isMaster = user.id === process.env.MASTER_USER_ID || email === 'nitin@navgurukul.org';
        const fullName = user.user_metadata?.full_name || "";
        return {
            id: user.id,
            firstName: fullName.split(" ")[0] || "",
            lastName: fullName.split(" ").slice(1).join(" ") || "",
            emailAddress: email,
            createdAt: new Date(user.created_at).getTime(),
            lastSignInAt: new Date(user.last_sign_in_at || user.created_at).getTime(),
            role: isMaster ? "Admin" : ((user.app_metadata?.role as string) || "Volunteer"),
            volunteerEnabled: user.app_metadata?.volunteerEnabled === true,
            userManagementEnabled: user.app_metadata?.userManagementEnabled === true,
            imageUrl: user.user_metadata?.avatar_url || "",
            isMaster,
        }
    });

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 pt-0">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your organization's members, assign roles, and visualize metrics.
                </p>
            </div>

            <UsersClient
                initialUsers={serializedUsers}
                currentUserId={userId!}
                actorRole={actorRole}
                isRootActor={isRootActor}
            />
        </div>
    );
}

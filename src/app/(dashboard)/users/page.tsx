import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { UsersClient } from "./client-page";

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Users2 } from "lucide-react";

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
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <div className="relative overflow-hidden rounded-lg bg-slate-50 dark:bg-zinc-900/50 p-4 md:p-6 border border-slate-200 dark:border-zinc-800 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-amber-500 text-white shadow-lg shadow-amber-500/20">
                            <Users2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Users Management</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                                Manage your organization's members, assign roles, and visualize metrics.
                            </p>
                        </div>
                    </div>
                </div>
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

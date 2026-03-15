import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { UsersRegistryClient } from "@/components/users/UsersRegistryClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function UsersRegistryPage() {
    const supabase = createAdminClient();
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const usersList = users || [];

    const { sessionClaims, userId } = await auth();
    if (!userId) {
        redirect("/sign-in");
    }

    const { getUserRole } = await import("@/lib/roles");
    const activeRole = await getUserRole();

    const { data: { user: freshUser } } = await supabase.auth.admin.getUserById(userId);

    const actorEmail: string =
        (sessionClaims as any)?.email ||
        freshUser?.email ||
        "";
    const actorRole: string =
        (sessionClaims?.metadata?.role as string) ||
        (sessionClaims as any)?.role ||
        "Volunteer";
    const actorDepartments: string[] = (freshUser?.app_metadata?.departments as string[]) || [];
    const isRootActor = actorEmail === 'nitin@navgurukul.org' || userId === process.env.MASTER_USER_ID;

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
            departments: (user.app_metadata?.departments as string[]) || [],
            volunteerEnabled: user.app_metadata?.volunteerEnabled === true,
            userManagementEnabled: user.app_metadata?.userManagementEnabled === true,
            imageUrl: user.user_metadata?.avatar_url || "",
            isMaster,
        }
    });

    return (
        <UsersRegistryClient
            initialUsers={serializedUsers}
            currentUserId={userId!}
            actorRole={activeRole}
            actorDepartments={actorDepartments}
            isRootActor={isRootActor}
        />
    );
}

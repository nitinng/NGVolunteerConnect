import { auth, clerkClient } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UsersClient } from "./client-page";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function UsersPage() {
    const client = await clerkClient();
    const usersResponse = await client.users.getUserList({
        limit: 100,
        orderBy: "-created_at",
    });

    const { sessionClaims, userId } = await auth();
    if (!userId) {
        redirect("/sign-in");
    }

    // Get the properly simulated/resolved user role
    const { getUserRole } = await import("@/lib/roles");
    const activeRole = await getUserRole();

    // Fetch fresh actor data (needed for email + permissions)
    const freshUser = await client.users.getUser(userId!);

    // Check actor's true (non-simulated) role and email for security controls
    const actorEmail: string =
        (sessionClaims as any)?.email ||
        freshUser.primaryEmailAddress?.emailAddress ||
        "";
    const actorRole: string =
        (sessionClaims?.metadata?.role as string) ||
        (sessionClaims as any)?.role ||
        "Volunteer";
    const isRootActor = actorEmail === 'nitin@navgurukul.org' || userId === process.env.MASTER_USER_ID;

    // Only Admins or explicitly enabled Program/Ops can see the users management module
    const userManagementEnabled = freshUser.publicMetadata?.userManagementEnabled === true;
    const canSeeUsers = activeRole === "Admin" || (['Program', 'Operations'].includes(activeRole) && userManagementEnabled);

    if (!canSeeUsers) {
        redirect("/");
    }

    const serializedUsers = usersResponse.data.map((user) => {
        const email = user.emailAddresses[0]?.emailAddress || "N/A";
        const isMaster = user.id === process.env.MASTER_USER_ID || email === 'nitin@navgurukul.org';
        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            emailAddress: email,
            createdAt: user.createdAt,
            lastSignInAt: user.lastSignInAt,
            role: isMaster ? "Admin" : ((user.publicMetadata?.role as string) || "Volunteer"),
            volunteerEnabled: user.publicMetadata?.volunteerEnabled === true,
            userManagementEnabled: user.publicMetadata?.userManagementEnabled === true,
            imageUrl: user.imageUrl,
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

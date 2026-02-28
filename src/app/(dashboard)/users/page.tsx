import { clerkClient } from "@clerk/nextjs/server";
import { UsersClient } from "./client-page";

export default async function UsersPage() {
    const client = await clerkClient();
    const usersResponse = await client.users.getUserList({
        limit: 100,
        orderBy: "-created_at",
    });

    const serializedUsers = usersResponse.data.map((user) => {
        const isMaster = user.id === process.env.MASTER_USER_ID;
        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            emailAddress: user.emailAddresses[0]?.emailAddress || "N/A",
            createdAt: user.createdAt,
            lastSignInAt: user.lastSignInAt,
            role: isMaster ? "Admin" : ((user.publicMetadata?.role as string) || "Volunteer"),
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

            <UsersClient initialUsers={serializedUsers} />
        </div>
    );
}

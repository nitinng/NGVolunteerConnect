"use server";

import { auth, clerkClient } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const ROOT_ADMIN_EMAIL = 'nitin@navgurukul.org';

// ─── helpers ────────────────────────────────────────────────────────────────

type Client = Awaited<ReturnType<typeof clerkClient>>;

/** True when the userId is the protected root admin (by ID or email). */
async function isRootAdmin(userId: string, client: Client): Promise<boolean> {
    if (userId === process.env.MASTER_USER_ID) return true;
    try {
        const user = await client.users.getUser(userId);
        return user.primaryEmailAddress?.emailAddress === ROOT_ADMIN_EMAIL;
    } catch {
        return false;
    }
}

/** Resolve the acting (currently-logged-in) user's email and role. */
async function getActor(client: Client) {
    const { userId, sessionClaims } = await auth();
    if (!userId) throw new Error("Unauthenticated");

    const email: string =
        (sessionClaims as any)?.email ||
        (await client.users.getUser(userId)).primaryEmailAddress?.emailAddress ||
        "";
    const role: string =
        (sessionClaims?.metadata?.role as string) ||
        (sessionClaims as any)?.role ||
        "Volunteer";

    const isRoot = email === ROOT_ADMIN_EMAIL || userId === process.env.MASTER_USER_ID;
    return { userId, email, role, isRoot };
}

// ─── actions ────────────────────────────────────────────────────────────────

export async function deleteUserAction(userId: string) {
    const client = await clerkClient();
    const actor = await getActor(client);

    // Root admin is indestructible
    if (await isRootAdmin(userId, client)) {
        return { success: false, error: "Cannot delete the root admin." };
    }

    // No self-delete
    if (actor.userId === userId) {
        return { success: false, error: "You cannot delete your own account." };
    }

    // Only root admin or other Admins can delete users
    if (!actor.isRoot && actor.role !== "Admin") {
        return { success: false, error: "Only admins can delete users." };
    }

    // Non-root admins cannot delete other admins; only root admin can
    const targetUser = await client.users.getUser(userId);
    const targetRole: string = (targetUser.publicMetadata?.role as string) || "Volunteer";
    if (!actor.isRoot && targetRole === "Admin") {
        return { success: false, error: "Only the root admin can delete another admin." };
    }

    try {
        await client.users.deleteUser(userId);
        revalidatePath("/", "layout");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateUserRoleAction(userId: string, role: string) {
    const client = await clerkClient();
    const actor = await getActor(client);

    // Root admin's role is immutable
    if (await isRootAdmin(userId, client)) {
        return { success: false, error: "Cannot modify the root admin's role." };
    }

    const targetUser = await client.users.getUser(userId);
    const targetRole: string = (targetUser.publicMetadata?.role as string) || "Volunteer";

    if (actor.isRoot) {
        // Root admin: unrestricted
    } else if (actor.role === "Admin") {
        // Regular admins: can set any role except they cannot promote to / demote from Admin
        // (only root admin can touch Admin role)
        if (role === "Admin" || targetRole === "Admin") {
            return { success: false, error: "Only the root admin can add or remove admins." };
        }
    } else if (actor.role === "Program") {
        // Program: can only change Volunteers → Program or Operations (not Admin, not touching existing Admins/Program actors)
        if (targetRole !== "Volunteer") {
            return { success: false, error: "Program managers can only change the role of Volunteers." };
        }
        if (!["Program", "Operations"].includes(role)) {
            return { success: false, error: "Program managers can only assign Program or Operations roles." };
        }
    } else {
        // Operations, Volunteer: no role changes at all
        return { success: false, error: "You do not have permission to change user roles." };
    }

    try {
        await client.users.updateUserMetadata(userId, {
            publicMetadata: { role },
        });
        revalidatePath("/", "layout");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function inviteUserAction(emailAddress: string, role: string) {
    const client = await clerkClient();
    const actor = await getActor(client);

    // Only root admin can send an Admin invite
    if (role === "Admin" && !actor.isRoot) {
        return { success: false, error: "Only the root admin can invite admins." };
    }

    // Operations and Volunteer cannot invite anyone
    if (!actor.isRoot && !["Admin", "Program"].includes(actor.role)) {
        return { success: false, error: "You do not have permission to invite users." };
    }

    // Program can only invite Volunteers
    if (actor.role === "Program" && !["Volunteer"].includes(role)) {
        return { success: false, error: "Program managers can only invite Volunteers." };
    }

    try {
        await client.invitations.createInvitation({
            emailAddress,
            publicMetadata: { role },
        });
        revalidatePath("/", "layout");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function toggleVolunteeringProfileAction(userId: string, enabled: boolean) {
    const client = await clerkClient();
    if (await isRootAdmin(userId, client)) {
        return { success: false, error: "Cannot modify the root admin." };
    }

    const actor = await getActor(client);
    if (!actor.isRoot && actor.role !== "Admin") {
        return { success: false, error: "Only admins can toggle volunteer profiles." };
    }

    try {
        await client.users.updateUserMetadata(userId, {
            publicMetadata: { volunteerEnabled: enabled },
        });
        revalidatePath("/", "layout");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function toggleUserManagementAction(userId: string, enabled: boolean) {
    const client = await clerkClient();
    if (await isRootAdmin(userId, client)) {
        return { success: false, error: "Cannot modify the root admin." };
    }

    const actor = await getActor(client);
    if (!actor.isRoot && actor.role !== "Admin") {
        return { success: false, error: "Only admins can toggle user management." };
    }

    try {
        await client.users.updateUserMetadata(userId, {
            publicMetadata: { userManagementEnabled: enabled },
        });
        revalidatePath("/", "layout");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

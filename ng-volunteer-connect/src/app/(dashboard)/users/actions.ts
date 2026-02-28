"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function deleteUserAction(userId: string) {
    if (userId === process.env.MASTER_USER_ID) {
        return { success: false, error: "Cannot delete the Master Admin." };
    }

    try {
        const client = await clerkClient();
        await client.users.deleteUser(userId);
        revalidatePath("/dashboard/users");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateUserRoleAction(userId: string, role: string) {
    if (userId === process.env.MASTER_USER_ID) {
        return { success: false, error: "Cannot modify the Master Admin." };
    }

    try {
        const client = await clerkClient();
        await client.users.updateUserMetadata(userId, {
            publicMetadata: {
                role,
            },
        });
        revalidatePath("/dashboard/users");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function inviteUserAction(emailAddress: string, role: string) {
    try {
        const client = await clerkClient();
        await client.invitations.createInvitation({
            emailAddress,
            publicMetadata: {
                role,
            },
        });
        revalidatePath("/dashboard/users");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

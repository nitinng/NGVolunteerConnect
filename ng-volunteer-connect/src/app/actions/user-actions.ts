"use server"
import { auth, clerkClient } from "@clerk/nextjs/server"

export async function completeRegistration(userData: any) {
    const { userId } = await auth();
    if (!userId) return;

    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
        publicMetadata: {
            ...userData,
            role: "Volunteer" // Default starting role
        }
    });
}

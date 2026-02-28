import { auth, clerkClient } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';

export type UserRole = "Admin" | "Program" | "Operations" | "Volunteer";

/**
 * Checks if the currently authenticated user has the specified role.
 * Role check resolves true if the session claims public metadata contains the desired role.
 * 
 * Master User Bypass: If the current user's ID matches process.env.MASTER_USER_ID,
 * they automatically pass ALL role checks, making them omnipresent.
 */
export const checkRole = async (role: UserRole) => {
    // Check developer override first
    if (process.env.NODE_ENV === 'development') {
        const cookieStore = await cookies();
        const devRole = cookieStore.get('dev-role-override')?.value as UserRole;
        if (devRole) return devRole === role;
    }

    const { sessionClaims, userId } = await auth();

    // Master User Omnipresence Check
    if (userId && userId === process.env.MASTER_USER_ID) {
        return true;
    }

    return sessionClaims?.metadata?.role === role;
};

/**
 * Returns the active role of the current user.
 * If the user is the MASTER_USER_ID, forcefully identifies them as "Admin".
 * If no role is found on the user's claims, forcefully sets it to 'Volunteer' 
 * in the Clerk publicMetadata.
 */
export const getUserRole = async (): Promise<UserRole> => {
    // Check developer override first
    if (process.env.NODE_ENV === 'development') {
        const cookieStore = await cookies();
        const devRole = cookieStore.get('dev-role-override')?.value as UserRole;
        if (devRole) return devRole;
    }

    const { sessionClaims, userId } = await auth();

    // Master User Override
    if (userId && userId === process.env.MASTER_USER_ID) {
        return "Admin";
    }

    let role = sessionClaims?.metadata?.role as UserRole | undefined;

    // Persist default "Volunteer" role to Clerk if not set
    if (!role && userId) {
        try {
            const client = await clerkClient();
            await client.users.updateUserMetadata(userId, {
                publicMetadata: {
                    role: "Volunteer",
                },
            });
            role = "Volunteer";
        } catch (error) {
            console.error("Error setting default role in Clerk:", error);
        }
    }

    return role || "Volunteer";
};

/**
 * Validates if the user is truly an Admin without looking at dev overrides
 */
export const isTrueAdmin = async (): Promise<boolean> => {
    const { sessionClaims, userId } = await auth();
    if (userId && userId === process.env.MASTER_USER_ID) return true;
    return sessionClaims?.metadata?.role === "Admin";
};

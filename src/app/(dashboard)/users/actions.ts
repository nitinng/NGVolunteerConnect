"use server";

import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

const ROOT_ADMIN_EMAIL = 'nitin@navgurukul.org';

// ─── helpers ────────────────────────────────────────────────────────────────

type Client = any;

/** True when the userId is the protected root admin (by ID or email). */
async function isRootAdmin(userId: string, supabase: Client): Promise<boolean> {
    if (userId === process.env.MASTER_USER_ID) return true;
    try {
        const { data: { user } } = await supabase.auth.admin.getUserById(userId);
        return user?.email === ROOT_ADMIN_EMAIL;
    } catch {
        return false;
    }
}

/** Resolve the acting (currently-logged-in) user's email and role. */
async function getActor(supabase: Client) {
    const { userId, sessionClaims } = await auth();
    if (!userId) throw new Error("Unauthenticated");

    const email: string =
        (sessionClaims as any)?.email ||
        (await supabase.auth.admin.getUserById(userId)).data.user?.email ||
        "";
    const role: string =
        (sessionClaims?.metadata?.role as string) ||
        (sessionClaims as any)?.role ||
        "Volunteer";
    
    const departments: string[] = (sessionClaims?.metadata?.departments as string[]) || [];

    const isRoot = email === ROOT_ADMIN_EMAIL || userId === process.env.MASTER_USER_ID;
    return { userId, email, role, isRoot, departments };
}

// ─── actions ────────────────────────────────────────────────────────────────

export async function deleteUserAction(userId: string) {
    const supabase = createAdminClient();
    const actor = await getActor(supabase);

    // Root admin is indestructible
    if (await isRootAdmin(userId, supabase)) {
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
    const { data: { user: targetUser } } = await supabase.auth.admin.getUserById(userId);
    const targetRole: string = (targetUser?.app_metadata?.role as string) || "Volunteer";
    if (!actor.isRoot && targetRole === "Admin") {
        return { success: false, error: "Only the root admin can delete another admin." };
    }

    try {
        await supabase.auth.admin.deleteUser(userId);
        revalidatePath("/", "layout");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateUserRoleAction(userId: string, role: string, departments?: string[]) {
    const supabase = createAdminClient();
    const actor = await getActor(supabase);

    // Root admin's role is immutable
    if (await isRootAdmin(userId, supabase)) {
        return { success: false, error: "Cannot modify the root admin's role." };
    }

    const { data: { user: targetUser } } = await supabase.auth.admin.getUserById(userId);
    const targetRole: string = (targetUser?.app_metadata?.role as string) || "Volunteer";
    const targetEmail: string = targetUser?.email || "";

    // Validation: Program/Operations MUST have at least one department
    if (["Program", "Operations"].includes(role)) {
        if (!departments || departments.length === 0) {
            return { success: false, error: "Program and Operations roles must have at least one department assigned." };
        }
    }

    const isActorOrgManager = actor.role === "Program" && actor.departments.includes("ORG");

    if (actor.isRoot) {
        // Root admin: unrestricted
    } else if (actor.role === "Admin") {
        // Regular admins: can set any role except they cannot promote to / demote from Admin
        // (only root admin can touch Admin role)
        if (role === "Admin" || targetRole === "Admin") {
            return { success: false, error: "Only the root admin can add or remove admins." };
        }
    } else if (isActorOrgManager) {
        // Program manager in ORG department: can change any role for ALL EXCEPT Nitro
        if (targetEmail === ROOT_ADMIN_EMAIL) {
            return { success: false, error: "You cannot change the role of the root admin." };
        }
        // "all roles except the department - ORG" 
        // Interpretation: They can assign ANY role, but they cannot assign anyone to the "ORG" department.
        if (departments?.includes("ORG")) {
             return { success: false, error: "You do not have permission to assign the ORG department." };
        }
    } else if (actor.role === "Program") {
        // Regular Program: can only change Volunteers → Program or Operations (not Admin, not touching existing Admins/Program actors)
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
        await supabase.auth.admin.updateUserById(userId, {
            app_metadata: { ...targetUser?.app_metadata, role, departments: departments || [] },
        });
        revalidatePath("/", "layout");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function inviteUserAction(emailAddress: string, role: string) {
    const supabase = createAdminClient();
    const actor = await getActor(supabase);

    const isActorOrgManager = actor.role === "Program" && actor.departments.includes("ORG");

    // Only root admin can send an Admin invite
    if (role === "Admin" && !actor.isRoot) {
        return { success: false, error: "Only the root admin can invite admins." };
    }

    // Operations and Volunteer cannot invite anyone
    if (!actor.isRoot && !["Admin", "Program"].includes(actor.role)) {
        return { success: false, error: "You do not have permission to invite users." };
    }

    // Program can only invite Volunteers (unless they are ORG managers)
    if (actor.role === "Program" && !isActorOrgManager && !["Volunteer"].includes(role)) {
        return { success: false, error: "Program managers can only invite Volunteers." };
    }

    try {
        await supabase.auth.admin.inviteUserByEmail(emailAddress, {
            data: { role },
        });
        revalidatePath("/", "layout");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function toggleVolunteeringProfileAction(userId: string, enabled: boolean) {
    const supabase = createAdminClient();
    if (await isRootAdmin(userId, supabase)) {
        return { success: false, error: "Cannot modify the root admin." };
    }

    const actor = await getActor(supabase);
    if (!actor.isRoot && actor.role !== "Admin") {
        return { success: false, error: "Only admins can toggle volunteer profiles." };
    }

    try {
        const { data: { user } } = await supabase.auth.admin.getUserById(userId);
        await supabase.auth.admin.updateUserById(userId, {
            app_metadata: { ...user?.app_metadata, volunteerEnabled: enabled },
        });
        revalidatePath("/", "layout");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function toggleUserManagementAction(userId: string, enabled: boolean) {
    const supabase = createAdminClient();
    if (await isRootAdmin(userId, supabase)) {
        return { success: false, error: "Cannot modify the root admin." };
    }

    const actor = await getActor(supabase);
    if (!actor.isRoot && actor.role !== "Admin") {
        return { success: false, error: "Only admins can toggle user management." };
    }

    try {
        const { data: { user } } = await supabase.auth.admin.getUserById(userId);
        await supabase.auth.admin.updateUserById(userId, {
            app_metadata: { ...user?.app_metadata, userManagementEnabled: enabled },
        });
        revalidatePath("/", "layout");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

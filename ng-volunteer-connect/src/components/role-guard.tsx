import { ReactNode } from "react";
import { getUserRole, type UserRole } from "@/lib/roles";

interface RoleGuardProps {
    children: ReactNode;
    allowedRoles: UserRole[];
    fallback?: ReactNode;
}

/**
 * A server component that only renders its children if the current user
 * has one of the allowed roles. Otherwise, renders an optional fallback or nothing.
 */
export async function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
    const currentRole = await getUserRole();

    if (!allowedRoles.includes(currentRole)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

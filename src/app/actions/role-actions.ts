"use server"

import { cookies } from "next/headers"
import { UserRole } from "@/lib/roles"

export async function setDevRoleOverride(role: UserRole | "System") {
    if (process.env.NODE_ENV !== "development") return;

    const cookieStore = await cookies()
    if (role === "System") {
        cookieStore.delete("dev-role-override")
    } else {
        cookieStore.set("dev-role-override", role, { path: '/' })
    }
}

import { getUserRole } from "@/lib/roles"
import { redirect } from "next/navigation"
import DepartmentsManagementView from "./DepartmentsManagementView"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Departments Management | NavGurukul",
    description: "Create and manage organizational departments.",
}

export default async function DepartmentsManagementPage() {
    const role = await getUserRole();
    if (role === "Volunteer") {
        redirect("/dashboard");
    }

    return <DepartmentsManagementView />
}

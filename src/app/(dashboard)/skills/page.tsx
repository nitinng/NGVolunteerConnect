import { Metadata } from "next"
import SkillsManagementView from "./SkillsManagementView"
import { getUserRole } from "@/lib/roles"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
    title: "Skills Management CMS | NavGurukul",
    description: "Manage skill categories and onboarding content.",
}

export default async function SkillsManagementPage() {
    const role = await getUserRole();
    // Volunteers are NOT allowed to access the CMS
    if (role === "Volunteer") {
        redirect("/");
    }

    return <SkillsManagementView />
}

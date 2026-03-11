import { getUserRole } from "@/lib/roles"
import { redirect } from "next/navigation"
import OnboardingAdminView from "./OnboardingAdminView"

export default async function OnboardingManagementPage() {
    const role = await getUserRole();
    if (role === "Volunteer") {
        redirect("/dashboard");
    }

    return <OnboardingAdminView />
}

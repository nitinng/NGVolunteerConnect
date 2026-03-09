import { Metadata } from "next"
import OnboardingView from "./OnboardingView"
import { getUserRole } from "@/lib/roles"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
    title: "Onboarding | NavGurukul Volunteer Connect",
    description: "Complete your onboarding and learn about NavGurukul.",
}

export default async function OnboardingPage() {
    // Only allow volunteers to access this route. Others get kicked back to dashboard
    const role = await getUserRole();
    if (role !== "Volunteer") {
        redirect("/");
    }

    return <OnboardingView />
}

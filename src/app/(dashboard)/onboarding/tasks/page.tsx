import { checkRole } from "@/lib/roles";
import { redirect } from "next/navigation";
import TasksView from "./TasksView";

export default async function OnboardingTasksPage() {
    // Only allow Volunteers or non-Admin roles to access this if standard onboarding
    // However, for testing let's allow everyone to view the tasks page
    //const activeRole = await getUserRole();
    //if (activeRole !== "Volunteer") {
    //    redirect("/dashboard");
    //}

    return <TasksView />;
}

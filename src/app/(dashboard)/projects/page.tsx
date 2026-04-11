import BrowseProjectsView from "./BrowseProjectsView";
import { getUserRole } from "@/lib/roles";

export default async function ProjectsPage() {
    const role = await getUserRole();
    const isVolunteer = role === "Volunteer";

    return <BrowseProjectsView isVolunteer={isVolunteer} />;
}

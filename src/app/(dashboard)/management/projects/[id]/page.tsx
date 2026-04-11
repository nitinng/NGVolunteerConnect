import ProjectDetailsManagementView from "./ProjectDetailsManagementView";

export default async function ProjectDetailsPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    return <ProjectDetailsManagementView projectId={params.id} />;
}

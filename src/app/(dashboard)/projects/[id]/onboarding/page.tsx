import VolunteerProjectOnboardingView from "./VolunteerProjectOnboardingView";

export default async function ProjectOnboardingPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    return <VolunteerProjectOnboardingView projectId={params.id} />;
}

import ModuleTasksView from "@/components/onboarding/ModuleTasksView";

export default async function ModuleTasksPage({ params }: { params: Promise<{ moduleSlug: string }> }) {
    const { moduleSlug } = await params;

    return (
        <ModuleTasksView 
            moduleSlug={moduleSlug} 
            backHref="/onboarding#tasks" 
            taskHrefPrefix="/onboarding/tasks/content" 
        />
    );
}

import React, { use } from "react";
import ModuleTasksView from "@/components/onboarding/ModuleTasksView";

export default function ProjectModuleTasksPage({ params }: { params: Promise<{ id: string; moduleSlug: string }> }) {
    const { id: projectId, moduleSlug } = use(params);

    return (
        <ModuleTasksView 
            moduleSlug={moduleSlug} 
            projectId={projectId}
            backHref={`/projects/${projectId}/onboarding`} 
            taskHrefPrefix={`/projects/${projectId}/onboarding/tasks/content`} 
        />
    );
}

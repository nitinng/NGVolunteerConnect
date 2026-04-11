"use client";

import React, { use } from "react";
import TaskRunner from "@/components/onboarding/TaskRunner";

export default function ProjectTaskRunnerPage({ params }: { params: Promise<{ id: string; taskId: string }> }) {
    const { id: projectId, taskId: taskSlug } = use(params);

    return (
        <TaskRunner 
            taskSlug={taskSlug} 
            projectId={projectId}
            backHref={`/projects/${projectId}/onboarding`} 
        />
    );
}

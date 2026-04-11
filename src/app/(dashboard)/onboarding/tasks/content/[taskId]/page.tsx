"use client";

import React, { use } from "react";
import TaskRunner from "@/components/onboarding/TaskRunner";

export default function ContentBlockPage({ params }: { params: Promise<{ taskId: string }> }) {
    const { taskId: taskSlug } = use(params);

    return (
        <TaskRunner 
            taskSlug={taskSlug} 
            backHref="/onboarding" 
        />
    );
}

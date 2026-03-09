export type TaskType = "essay" | "mcq" | "report" | "upload" | "video" | "reading";
export type TaskStatus = "draft" | "published" | "on-hold";

export interface OnboardingTask {
    id: string;
    title: string;
    description: string;
    type: TaskType;
    status: TaskStatus;
    options?: string[]; // for MCQ
    required?: boolean;
}

export interface SkillRole {
    id: string;
    name: string;
    tasks: OnboardingTask[];
}

export interface SkillCategory {
    id: string;
    title: string;
    key: string;
    roles: SkillRole[];
}

export const SKILLS_CONFIG: Record<string, SkillCategory> = {
    "Technical": {
        id: "cat_tech",
        key: "techSkills",
        title: "Technical (Build. Debug. Empower.)",
        roles: [
            {
                id: "role_prog", name: "Programming", tasks: [
                    { id: "t1", title: "Complete coding challenge", description: "Submit your solution for the assessment.", type: "report", status: "published", required: true },
                    { id: "t2", title: "Review tech stack", description: "Read about our internal tools.", type: "reading", status: "published", required: true }
                ]
            },
            {
                id: "role_devops", name: "DevOps", tasks: [
                    { id: "t3", title: "Setup local environment", description: "Follow the guide to install tools.", type: "reading", status: "published", required: true },
                    { id: "t4", title: "CI/CD Pipeline Intro", description: "Understand our deployment flow.", type: "video", status: "published", required: true }
                ]
            },
            {
                id: "role_mentorship", name: "Tech Mentorship", tasks: [
                    { id: "t5", title: "Review guidelines", description: "Mentorship code of conduct.", type: "reading", status: "published", required: true }
                ]
            },
            { id: "role_interviews", name: "Coding Interviews", tasks: [] }
        ]
    },
    "Non-Technical/Professional": {
        id: "cat_nontech",
        key: "nonTechSkills",
        title: "Non-Technical / Professional",
        roles: [
            {
                id: "role_facilitation", name: "Teaching & Facilitation", tasks: [
                    { id: "t10", title: "Watch facilitation video", description: "Learn how we teach at NG.", type: "video", status: "published", required: true }
                ]
            }
        ]
    }
};

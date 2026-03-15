import { redirect } from "next/navigation";
import { 
    getGeneralOnboardingModules, 
    getGeneralOnboardingTasks, 
    getUserTaskProgress 
} from "@/app/actions/general-onboarding-actions";
import { slugify } from "@/lib/utils";
import { Target, ArrowLeft } from "lucide-react";
import { JourneyModuleCard } from "@/components/journey-module-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function ModuleTasksPage({ params }: { params: Promise<{ moduleSlug: string }> }) {
    const { moduleSlug } = await params;

    const [modules, allTasks, progress] = await Promise.all([
        getGeneralOnboardingModules(),
        getGeneralOnboardingTasks(),
        getUserTaskProgress()
    ]);

    // Find the module that matches the slug
    const module = modules.find(m => slugify(m.title) === moduleSlug);

    if (!module) {
        redirect("/onboarding");
    }

    const moduleTasks = allTasks.filter(t => t.module_id === module.id).sort((a,b) => a.order_index - b.order_index);
    const completedTaskIds = progress.filter(p => p.is_completed).map(p => p.task_id);

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Link href="/onboarding#tasks">
                    <Button variant="ghost" size="sm" className="w-fit -ml-2 text-slate-500">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Journey
                    </Button>
                </Link>
                
                <div className="relative overflow-hidden rounded-lg bg-white dark:bg-zinc-900/30 p-4 md:p-6 border border-slate-200 dark:border-zinc-800 shadow-sm">
                    <div className="relative flex items-start gap-4">
                        <div className={`p-3 rounded-lg bg-indigo-500 text-white shadow-lg shrink-0`}>
                            <Target className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                                {module.title}
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">
                                {module.description}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Task Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-12">
                {moduleTasks.map((task, idx) => {
                    const isCompleted = completedTaskIds.includes(task.id);
                    // Determine if unlocked (first task or previous task completed)
                    const isUnlocked = idx === 0 || completedTaskIds.includes(moduleTasks[idx - 1].id);
                    
                    // Adapt task to JourneyModuleCard format
                    const cardData = {
                        id: task.id,
                        title: task.title,
                        description: task.description,
                        icon: task.icon,
                        color: module.color // Tasks inherit module color
                    };

                    return (
                        <JourneyModuleCard 
                            key={task.id}
                            mod={cardData}
                            isCompleted={isCompleted}
                            isUnlocked={isUnlocked}
                            href={`/onboarding/tasks/content/${slugify(task.title)}`}
                        />
                    );
                })}
            </div>
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import { getProjectById, getMyApplications } from "@/app/actions/project-actions";
import { 
    getGeneralOnboardingModules, 
    getGeneralOnboardingTasks, 
    getAllContentBlocks, 
    getUserTaskProgress,
    GeneralModule 
} from "@/app/actions/general-onboarding-actions";
import { Loader2, ArrowLeft, Target, Award, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { JourneyModuleCard } from "@/components/journey-module-card";
import { slugify } from "@/lib/utils";

export default function VolunteerProjectOnboardingView({ projectId }: { projectId: string }) {
    const [project, setProject] = useState<any>(null);
    const [application, setApplication] = useState<any>(null);
    const [modules, setModules] = useState<GeneralModule[]>([]);
    const [completedModules, setCompletedModules] = useState<string[]>([]);
    const [stats, setStats] = useState({ totalPages: 0, completedPages: 0, percentage: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [projectId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [proj, apps, loadedModules, loadedTasks, loadedBlocks, loadedProgress] = await Promise.all([
                getProjectById(projectId),
                getMyApplications(),
                getGeneralOnboardingModules(projectId),
                getGeneralOnboardingTasks(projectId),
                getAllContentBlocks(),
                getUserTaskProgress()
            ]);
            
            const app = apps.find(a => a.project_id === projectId && a.status === 'approved');
            setProject(proj);
            setApplication(app);

            // Sort modules
            const sortedModules = loadedModules.sort((a,b) => a.order_index - b.order_index);
            setModules(sortedModules);

            // Calculate progress (mirroring logic from general-onboarding-page)
            let tPages = 0;
            let cPages = 0;
            const completed: string[] = [];

            sortedModules.forEach(m => {
                const mTasks = loadedTasks.filter(t => t.module_id === m.id);
                let mTotal = 0;
                let mComp = 0;

                mTasks.forEach(t => {
                    const tBlocks = loadedBlocks.filter(b => b.task_id === t.id).sort((a,b) => (a.order_index ?? 0) - (b.order_index ?? 0));
                    let pagesForTask = 0;
                    if (tBlocks.length === 0) {
                        pagesForTask = 1;
                    } else {
                        pagesForTask = 1; 
                        tBlocks.forEach((tb, i) => { if (i > 0 && tb.page_behavior === 'new_page') pagesForTask++; });
                    }
                    mTotal += pagesForTask;
                    tPages += pagesForTask;

                    const prog = loadedProgress.find(p => p.task_id === t.id);
                    if (prog) {
                        if (prog.is_completed) {
                            mComp += pagesForTask;
                            cPages += pagesForTask;
                        } else if (prog.completed_pages) {
                            mComp += prog.completed_pages.length;
                            cPages += prog.completed_pages.length;
                        }
                    }
                });

                if (mTotal > 0 && mComp >= mTotal) {
                    completed.push(m.id);
                }
            });

            setCompletedModules(completed);
            setStats({
                totalPages: tPages,
                completedPages: cPages,
                percentage: tPages > 0 ? Math.round((cPages / tPages) * 100) : 0
            });

        } catch (error: any) {
            toast.error("Failed to load project onboarding", { description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Loading project modules...</p>
            </div>
        );
    }

    if (!project || !application) {
        return (
            <div className="p-12 text-center">
                <h2 className="text-xl font-bold text-slate-800">Cannot access onboarding</h2>
                <p className="text-slate-500 mt-2">You must have an approved application to view this page.</p>
                <Button asChild className="mt-6"><Link href="/projects">Back to Projects</Link></Button>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
            <Link href="/projects" className="flex items-center text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors w-fit">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Projects
            </Link>
            
            {/* Header / Project Progress Card */}
            <div className="relative overflow-hidden rounded-xl bg-indigo-600 text-white p-6 shadow-lg">
                <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150">
                    <Target className="w-32 h-32" />
                </div>
                
                <div className="relative flex flex-col md:flex-row justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">{project.title}</h1>
                        <p className="text-indigo-100 mt-2 font-medium max-w-xl">
                            Welcome to the team! Complete these onboarding modules to familiarize yourself with the project goals, tools, and workflows.
                        </p>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20 min-w-[240px]">
                        <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-2 opacity-80">
                            <span>Project Progress</span>
                            <span>{stats.percentage}%</span>
                        </div>
                        <Progress value={stats.percentage} className="h-2 bg-white/20" indicatorClassName="bg-white" />
                        <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Award className="w-4 h-4" />
                                <span className="text-sm font-bold">{completedModules.length} / {modules.length} Modules</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 mt-4 px-1">
                <Compass className="w-5 h-5 text-indigo-500" />
                <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-200">
                    Onboarding Journey
                </h2>
            </div>

            {modules.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-12">
                    {modules.map((mod, idx) => {
                        const isCompleted = completedModules.includes(mod.id);
                        // Unlocked if first module or previous module is completed
                        const isUnlocked = idx === 0 || completedModules.includes(modules[idx - 1].id);

                        return (
                            <JourneyModuleCard 
                                key={mod.id}
                                mod={mod}
                                isCompleted={isCompleted}
                                isUnlocked={isUnlocked}
                                href={`/projects/${projectId}/onboarding/tasks/${slugify(mod.title)}`}
                            />
                        );
                    })}
                </div>
            ) : (
                <div className="py-20 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center bg-slate-50/50 text-center">
                    <div className="p-4 rounded-full bg-slate-100 text-slate-400 mb-4">
                        <Target className="w-10 h-10" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">No modular onboarding assigned</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-2">
                        The project leads haven't configured modular onboarding for this project yet. Please check back later or contact your program manager.
                    </p>
                </div>
            )}
        </div>
    );
}

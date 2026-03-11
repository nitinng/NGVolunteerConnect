"use client";

import { useRouter } from "next/navigation";
import { use } from "react";

export default function TaskDetailPage({ params }: { params: Promise<{ taskId: string }> }) {
    const { taskId } = use(params);
    return <TaskDetailView taskId={taskId} />;
}

import { 
    Building2, 
    Target, 
    GraduationCap, 
    Heart, 
    Puzzle, 
    ListTodo, 
    ShieldCheck,
    ArrowLeft,
    PlayCircle,
    BookOpen,
    CheckCircle2,
    Lock,
    ArrowRight,
    FileText
} from "lucide-react";
import { useState, useEffect } from "react";
import { useUserContext } from "@/contexts/user-context";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getGeneralOnboardingModules, getGeneralOnboardingTasks, GeneralModule, GeneralTask, getAllContentBlocks, getUserTaskProgress } from "@/app/actions/general-onboarding-actions";
import * as Icons from "lucide-react";

function TaskDetailView({ taskId }: { taskId: string }) {
    const router = useRouter();
    const user = useUserContext();
    const [targetModule, setTargetModule] = useState<GeneralModule | null>(null);
    const [moduleTasks, setModuleTasks] = useState<GeneralTask[]>([]);
    const [progressStats, setProgressStats] = useState({ totalPages: 0, completedPages: 0 });
    const [tasksCompleted, setTasksCompleted] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [mods, tsks, blocks, progresses] = await Promise.all([
                    getGeneralOnboardingModules(),
                    getGeneralOnboardingTasks(),
                    getAllContentBlocks(),
                    getUserTaskProgress()
                ]);
                const mod = mods.find(m => m.id === taskId);
                setTargetModule(mod || null);
                const subTasks = tsks.filter(t => t.module_id === taskId).sort((a,b) => a.order_index - b.order_index);
                setModuleTasks(subTasks);

                // calculate explicit page-level stats correctly
                let total = 0;
                let completed = 0;
                const completedTaskIds: string[] = [];

                subTasks.forEach(t => {
                    const tBlocks = blocks.filter(b => b.task_id === t.id).sort((a,b) => (a.order_index ?? 0) - (b.order_index ?? 0));
                    
                    let pagesForTask = 0;
                    if (tBlocks.length === 0) {
                        pagesForTask = 1;
                    } else {
                        pagesForTask = 1; 
                        tBlocks.forEach((tb, i) => { if (i > 0 && tb.page_behavior === 'new_page') pagesForTask++ });
                    }
                    total += pagesForTask;

                    const prog = progresses.find(p => p.task_id === t.id);
                    if (prog) {
                        if (prog.is_completed) {
                            completed += pagesForTask;
                            completedTaskIds.push(t.id);
                        } else if (prog.completed_pages) {
                            completed += prog.completed_pages.length;
                        }
                    }
                });

                setProgressStats({ totalPages: total, completedPages: completed });
                setTasksCompleted(completedTaskIds);

            } catch (err) {
                console.error("Failed to load module details", err);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [taskId]);

    if (!user || isLoading) return <div className="p-8 text-center text-slate-500">Loading module details...</div>;
    if (!targetModule) return <div className="p-8 text-center text-slate-500">Module not found</div>;

    // Data for the specific modules
    const Icon = (Icons as any)[targetModule.icon || "BookOpen"] || Icons.BookOpen;
    const color = targetModule.color || "indigo";

    const bgColors: Record<string, string> = {
        indigo: "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
        rose: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400",
        amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
        emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        blue: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
        violet: "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400",
        orange: "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400",
    };

    const hoverBorderColors: Record<string, string> = {
        indigo: "hover:border-indigo-500/50",
        rose: "hover:border-rose-500/50",
        amber: "hover:border-amber-500/50",
        emerald: "hover:border-emerald-500/50",
        blue: "hover:border-blue-500/50",
        violet: "hover:border-violet-500/50",
        orange: "hover:border-orange-500/50",
    };

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
            {/* Back Button and Breadcrumb */}
            <div className="flex items-center gap-2">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => router.push('/onboarding/tasks')}
                    className="h-8 px-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Tasks
                </Button>
            </div>

            {/* Header Card matching TasksView style */}
            <div className="relative overflow-hidden rounded-[12px] bg-white dark:bg-zinc-900/30 p-5 md:p-7 border border-slate-200 dark:border-zinc-800 shadow-sm transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="relative flex items-center gap-5 flex-1 w-full">
                    <div className={`p-3.5 rounded-xl ${bgColors[color] || bgColors.indigo} shrink-0`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 max-w-xl">
                        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                            {targetModule.title}
                        </h1>
                        {moduleTasks.length > 0 ? (
                            <div className="mt-2 text-sm text-slate-500 font-medium leading-relaxed">
                                <Progress value={Math.round((progressStats.completedPages / progressStats.totalPages) * 100) || 0} className="h-1.5 mt-2 bg-slate-100 dark:bg-zinc-800 indicator-emerald-500 [&>div]:bg-emerald-500" />
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium leading-relaxed">
                                {targetModule.description}
                            </p>
                        )}
                    </div>
                </div>
                
                {moduleTasks.length > 0 && (
                    <div className="shrink-0 flex items-center md:ml-4">
                        <span className="bg-[#e6fbf2] dark:bg-emerald-500/10 text-[#0ab385] dark:text-emerald-400 font-extrabold text-[15px] px-4 py-2 rounded-lg tracking-wide">
                            {Math.round((progressStats.completedPages / progressStats.totalPages) * 100) || 0}%
                        </span>
                    </div>
                )}
            </div>

            {/* Sub-Tasks Grid matching TasksView */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {moduleTasks.map((subTask, idx) => {
                    const isCompleted = tasksCompleted.includes(subTask.id);
                    const isUnlocked = idx === 0 || tasksCompleted.includes(moduleTasks[idx - 1].id);
                    const SubIcon = (Icons as any)[subTask.icon || "ListTodo"] || Icons.ListTodo;

                    return (
                        <Card
                            key={subTask.id}
                            className={`p-0 gap-4 relative group cursor-pointer border-slate-200 dark:border-zinc-800 transition-all shadow-sm hover:shadow-md overflow-hidden flex flex-col ${isUnlocked
                                ? `bg-white dark:bg-zinc-950/50 ${hoverBorderColors[color] || hoverBorderColors.indigo}`
                                : "bg-slate-50/50 dark:bg-zinc-900/20 opacity-60 grayscale-[0.5]"
                                }`}
                            onClick={() => isUnlocked && router.push(`/onboarding/tasks/content/${subTask.id}`)}
                        >
                            {/* Background Decorative Icon */}
                            <div className="absolute top-0 right-0 p-4 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                                <SubIcon className="w-16 h-16" />
                            </div>

                            <CardHeader className="px-4 md:px-6 pt-5 pb-0">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${isCompleted
                                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    : isUnlocked
                                        ? (bgColors[color] || bgColors.indigo)
                                        : "bg-slate-100 dark:bg-zinc-800 text-slate-400"
                                    }`}>
                                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : isUnlocked ? (subTask.content_type === 'video' ? <PlayCircle className="w-5 h-5" /> : <SubIcon className="w-5 h-5" />) : <Lock className="w-5 h-5" />}
                                </div>
                                <CardTitle className="text-[17px] font-bold text-slate-900 dark:text-slate-100">
                                    {subTask.title}
                                </CardTitle>
                                <CardDescription className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-2 line-clamp-2">
                                    {subTask.description}
                                </CardDescription>
                            </CardHeader>

                            <CardFooter className="px-4 md:px-6 pb-5 pt-0 mt-auto flex items-center justify-between">
                                {isUnlocked ? (
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm font-bold ${isCompleted ? "text-emerald-600" : "text-indigo-600"
                                            }`}>
                                            {isCompleted ? "Completed" : "Start now"}
                                        </span>
                                        {!isCompleted && <ArrowRight className="w-4 h-4 text-indigo-600 transition-transform group-hover:translate-x-1" />}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                        <Lock className="w-3.5 h-3.5" />
                                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Locked</span>
                                    </div>
                                )}
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    UserCircle, 
    ArrowRight, 
    Target, 
    CheckCircle2, 
    Lock, 
    Building2, 
    GraduationCap, 
    Heart, 
    Puzzle, 
    ListTodo, 
    ShieldCheck, 
    PlayCircle,
    BookOpen
} from "lucide-react";
import { useState, useEffect } from "react";
import { getMyProfile } from "@/app/actions/profile-actions";
import { getSkillCategories } from "@/app/actions/skills-actions";
import { calculateProfileCompletion } from "@/lib/profile-utils";
import { Profile, SkillCategory } from "@/lib/supabase";
import { Progress } from "@/components/ui/progress";
import { useUserContext } from "@/contexts/user-context";
import { getGeneralOnboardingModules, GeneralModule, getGeneralOnboardingTasks, getAllContentBlocks, getUserTaskProgress } from "@/app/actions/general-onboarding-actions";
import * as Icons from "lucide-react";

export default function OnboardingView() {
    const router = useRouter();
    const user = useUserContext();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [completion, setCompletion] = useState(0);

    const [dbCategories, setDbCategories] = useState<SkillCategory[]>([]);
    const [modules, setModules] = useState<GeneralModule[]>([]);
    const [stats, setStats] = useState({ totalPages: 0, completedPages: 0, percentage: 0 });
    const [completedModules, setCompletedModules] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!user?.id) return;
            try {
                const [p, cats, loadedModules, loadedTasks, loadedBlocks, loadedProgress] = await Promise.all([
                    getMyProfile(),
                    getSkillCategories(),
                    getGeneralOnboardingModules(),
                    getGeneralOnboardingTasks(),
                    getAllContentBlocks(),
                    getUserTaskProgress()
                ]);
                setProfile(p);
                setDbCategories(cats);
                
                const sortedModules = loadedModules.sort((a,b) => a.order_index - b.order_index);
                setModules(sortedModules);
                
                if (p) {
                    setCompletion(calculateProfileCompletion(p, user?.publicMetadata || {}, cats.map(c => c.key)));
                }

                // Granular calculation across everything!
                let tPages = 0;
                let cPages = 0;
                const cModules: string[] = [];

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

                    // Module counts as officially cleared if all internal page shards are read/checked off
                    if (mTotal > 0 && mComp >= mTotal) {
                        cModules.push(m.id);
                    }
                });
                
                setStats({ 
                    totalPages: tPages, 
                    completedPages: cPages, 
                    percentage: tPages > 0 ? Math.round((cPages / tPages) * 100) : 0 
                });
                setCompletedModules(cModules);

            } catch (err) {
                console.error("Failed to load onboarding data:", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [user?.id]);



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
        <div className="flex flex-1 flex-col p-2 md:p-4">
            <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 max-w-7xl mx-auto w-full">
                {/* Header / Onboarding Lead Card */}
                <div className="relative overflow-hidden rounded-[12px] bg-slate-50 dark:bg-zinc-900/50 p-4 md:p-6 border border-slate-200 dark:border-zinc-800 shadow-sm group transition-all hover:bg-slate-100 dark:hover:bg-zinc-900/80">
                    <div className="relative flex items-center gap-4">
                        <div className="p-3 rounded-[10px] bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                            <Target className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                                Onboarding Hub
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium ">
                                Welcome to NavGurukul! Complete your profile and explore our modules to understand our mission and how you can make an impact.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div
                        onClick={() => router.push('/profile')}
                        className="group flex flex-col justify-between p-4 md:p-6 rounded-[12px] border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50 shadow-sm hover:shadow-md hover:border-indigo-500/50 transition-all cursor-pointer"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                <UserCircle className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-[15px]">
                                    {completion === 100 ? "Profile complete" : "Complete your profile"}
                                </h3>
                                <Progress value={completion} className="h-1 mt-2" indicatorClassName="bg-emerald-500" />
                            </div>
                            <div className="p-2.5 rounded-[10px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold text-sm min-w-[56px] flex items-center justify-center">
                                {completion}%
                            </div>
                        </div>
                    </div>

                    <div
                        className="group flex flex-col justify-between p-4 md:p-6 rounded-[12px] border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50 shadow-sm hover:shadow-md hover:border-emerald-500/50 transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-[10px] bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-[15px]">
                                    {stats.percentage === 100 ? "Onboarding complete!" : "Complete your onboarding"}
                                </h3>
                                <Progress value={stats.percentage} className="h-1 mt-2 bg-emerald-200/50" indicatorClassName="bg-emerald-600" />
                            </div>
                            <div className="p-2.5 rounded-[10px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold text-sm min-w-[56px] flex items-center justify-center">
                                {stats.percentage}%
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sub-Section Title */}
                <div className="flex items-center gap-2 mt-4 px-1" id="tasks">
                    <Target className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-200">
                        Journey Tasks
                    </h2>
                </div>

                {/* Foundational Tasks - Compact Grid matching Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-12">
                    {modules.map((mod, idx) => {
                        const isCompleted = completedModules.includes(mod.id);
                        const isUnlocked = idx === 0 || completedModules.includes(modules[idx - 1].id);
                        const Icon = (Icons as any)[mod.icon || "BookOpen"] || Icons.BookOpen;
                        const cardColor = mod.color || "indigo";

                        return (
                            <Card
                                key={mod.id}
                                className={`p-0 gap-4 relative group cursor-pointer border-slate-200 dark:border-zinc-800 transition-all shadow-sm hover:shadow-md overflow-hidden flex flex-col ${isUnlocked
                                    ? `bg-white dark:bg-zinc-950/50 ${hoverBorderColors[cardColor] || hoverBorderColors.indigo}`
                                    : "bg-slate-50/50 dark:bg-zinc-900/20 opacity-60 grayscale-[0.5]"
                                    }`}
                                onClick={() => isUnlocked && router.push(`/onboarding/tasks/${mod.id}`)}
                            >
                                {/* Background Decorative Icon */}
                                <div className="absolute top-0 right-0 p-4 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                                    <Icon className="w-16 h-16" />
                                </div>

                                <CardHeader className="px-4 md:px-6 pt-5 pb-0   ">
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${isCompleted
                                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        : isUnlocked
                                            ? (bgColors[cardColor] || bgColors.indigo)
                                            : "bg-slate-100 dark:bg-zinc-800 text-slate-400"
                                        }`}>
                                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : isUnlocked ? <Icon className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                                    </div>
                                    <CardTitle className="text-[17px] font-bold text-slate-900 dark:text-slate-100">
                                        {mod.title}
                                    </CardTitle>
                                    <CardDescription className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-2 line-clamp-2">
                                        {mod.description}
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
        </div>
    );
}


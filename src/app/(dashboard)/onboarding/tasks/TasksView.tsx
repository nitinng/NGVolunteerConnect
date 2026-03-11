"use client";

import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    Target,
    CheckCircle2,
    Lock,
    ArrowRight,
    Building2,
    GraduationCap,
    Heart,
    Puzzle,
    ListTodo,
    ShieldCheck,
    PlayCircle,
    BookOpen,
    Sparkles
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { SKILLS_CONFIG } from "@/lib/skills-config";
import { useUserContext } from "@/contexts/user-context";
import { getGeneralOnboardingModules, GeneralModule } from "@/app/actions/general-onboarding-actions";
import * as Icons from "lucide-react";

export default function TasksView() {
    const router = useRouter();
    const user = useUserContext();
    const [completedTasks, setCompletedTasks] = useState<string[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem("foundational_tasks_completed");
        if (saved) {
            try {
                setCompletedTasks(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse completed tasks", e);
            }
        }
    }, []);

    const [modules, setModules] = useState<GeneralModule[]>([]);

    useEffect(() => {
        const load = async () => {
            try {
                const mods = await getGeneralOnboardingModules();
                setModules(mods.sort((a,b) => a.order_index - b.order_index));
            } catch (err) {
                console.error("Failed to fetch modules", err);
            }
        };
        load();
    }, []);

    const toggleTask = (taskId: string) => {
        const newCompleted = completedTasks.includes(taskId)
            ? completedTasks.filter(id => id !== taskId)
            : [...completedTasks, taskId];

        setCompletedTasks(newCompleted);
        localStorage.setItem("foundational_tasks_completed", JSON.stringify(newCompleted));
    };

    if (!user) return null;

    const metadata = user?.publicMetadata || {};
    const primaryCategory = metadata.primarySkill as string;
    const secondaryCategory = metadata.secondarySkillCategory as string;



    const getTasksForCategory = (categoryName: string) => {
        if (!categoryName || categoryName === "None") return [];
        const config = SKILLS_CONFIG[categoryName];
        if (!config) return [];

        const selectedSubSkills = (metadata[config.key] as string[]) || [];
        return config.roles
            .filter(role => selectedSubSkills.includes(role.name))
            .map(role => ({
                ...role,
                tasks: role.tasks.filter(t => t.status === "published")
            }))
            .filter(role => role.tasks.length > 0);
    };

    const primaryTasks = getTasksForCategory(primaryCategory);
    const secondaryTasks = getTasksForCategory(secondaryCategory);
    const allMatchingRoles = [...primaryTasks, ...secondaryTasks];
    const uniqRoles = Array.from(new Map(allMatchingRoles.map(r => [r.name, r])).values());

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
            {/* Header Card matching Dashboard style */}
            <div className="relative overflow-hidden rounded-[12px] bg-white dark:bg-zinc-900/30 p-4 md:p-6 border border-slate-200 dark:border-zinc-800 shadow-sm group transition-all">
                <div className="relative flex items-center gap-4">
                    <div className="p-3 rounded-[10px] bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 shrink-0">
                        <Target className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                            Onboarding Journey
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium leading-relaxed">
                            Complete your foundational modules to unlock specialized role-specific training. Explore our mission and how you can make an impact.
                        </p>
                    </div>
                </div>
            </div>

            {/* Foundational Tasks - Compact Grid matching Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {modules.map((mod, idx) => {
                    const isCompleted = completedTasks.includes(mod.id);
                    const isUnlocked = idx === 0 || completedTasks.includes(modules[idx - 1].id);
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
    );
}

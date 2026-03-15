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
    Sparkles,
    Compass,
    Briefcase
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { SKILLS_CONFIG } from "@/lib/skills-config";
import { useUserContext } from "@/contexts/user-context";
import { getGeneralOnboardingModules, GeneralModule } from "@/app/actions/general-onboarding-actions";
import * as Icons from "lucide-react";
import { JourneyModuleCard } from "@/components/journey-module-card";
import { slugify } from "@/lib/utils";

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

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
            {/* Header Card matching Dashboard style */}
            <div className="relative overflow-hidden rounded-lg bg-white dark:bg-zinc-900/30 p-4 md:p-6 border border-slate-200 dark:border-zinc-800 shadow-sm group transition-all">
                <div className="relative flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 shrink-0">
                        <Compass className="w-6 h-6" />
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

            <hr className="border-slate-200 dark:border-zinc-800 my-4" />

            {/* General Onboarding Section */}
            <div className="flex items-center gap-2 mt-2 px-1">
                <Compass className="w-5 h-5 text-indigo-500" />
                <h2 className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-200">
                    General Onboarding
                </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {modules.filter(m => m.type?.toLowerCase() === 'general' || !m.type).map((mod, idx, arr) => {
                    const idxInFullList = modules.findIndex(m => m.id === mod.id);
                    const isCompleted = completedTasks.includes(mod.id);
                    const isUnlocked = idxInFullList === 0 || completedTasks.includes(modules[idxInFullList - 1].id);

                    return (
                        <JourneyModuleCard 
                            key={mod.id}
                            mod={mod}
                            isCompleted={isCompleted}
                            isUnlocked={isUnlocked}
                            href={`/onboarding/tasks/${slugify(mod.title)}`}
                        />
                    );
                })}
            </div>

            <hr className="border-slate-200 dark:border-zinc-800 my-4" />

            {/* Role Specific Onboarding Section */}
            <div className="flex items-center gap-2 mt-6 px-1">
                <Briefcase className="w-5 h-5 text-indigo-500" />
                <h2 className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-200">
                    Role Specific Onboarding
                </h2>
            </div>

            {modules.some(m => m.type?.toLowerCase() === 'specific') ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-12">
                    {modules.filter(m => m.type?.toLowerCase() === 'specific').map((mod) => {
                        const idxInFullList = modules.findIndex(m => m.id === mod.id);
                        const isCompleted = completedTasks.includes(mod.id);
                        const isUnlocked = idxInFullList === 0 || completedTasks.includes(modules[idxInFullList - 1].id);

                        return (
                            <JourneyModuleCard 
                                key={mod.id}
                                mod={mod}
                                isCompleted={isCompleted}
                                isUnlocked={isUnlocked}
                                href={`/onboarding/tasks/${slugify(mod.title)}`}
                            />
                        );
                    })}
                </div>
            ) : (
                <div className="pb-12 mt-4">
                    <div className="flex flex-col items-center justify-center p-8 rounded-lg border border-dashed border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20 text-center">
                        <div className="p-3 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-400 mb-3">
                            <Lock className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 italic">No specific role modules assigned yet</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
                            Once you clear the foundational modules, your role-specific tracks will appear here.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

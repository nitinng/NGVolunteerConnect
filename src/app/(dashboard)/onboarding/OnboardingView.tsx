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
    BookOpen,
    Compass,
    Briefcase
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { type GeneralModule } from "@/app/actions/general-onboarding-actions";
import * as Icons from "lucide-react";
import { JourneyModuleCard } from "@/components/journey-module-card";
import { slugify } from "@/lib/utils";

interface OnboardingViewProps {
    serverModules: GeneralModule[];
    serverCompletedModules: string[];
    serverStats: { totalPages: number; completedPages: number; percentage: number };
    serverCompletion: number;
    isLocked: boolean;
}

export default function OnboardingView({ serverModules, serverCompletedModules, serverStats, serverCompletion, isLocked }: OnboardingViewProps) {
    const router = useRouter();
    
    const modules = serverModules;
    const generalModules = modules.filter(m => m.type?.toLowerCase() === 'general' || !m.type);
    const roleModules = modules.filter(m => m.type?.toLowerCase() === 'specific');
    
    const completedModules = serverCompletedModules;
    const stats = serverStats;
    const completion = serverCompletion;

    return (
        <div className="flex flex-1 flex-col p-2 md:p-4">
            <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 max-w-7xl mx-auto w-full">
                {/* Header / Onboarding Lead Card */}
                <div className="relative overflow-hidden rounded-lg bg-slate-50 dark:bg-zinc-900/50 p-4 md:p-6 border border-slate-200 dark:border-zinc-800 shadow-sm group transition-all hover:bg-slate-100 dark:hover:bg-zinc-900/80">
                    <div className="relative flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
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
                        className="group flex flex-col justify-between p-4 md:p-6 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900/40 backdrop-blur-md shadow-sm hover:shadow-md hover:border-indigo-500/50 transition-all cursor-pointer"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                <UserCircle className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-[15px]">
                                    {completion === 100 ? "Profile complete" : "Complete your profile"}
                                </h3>
                                <Progress value={completion} className="h-1 mt-2" indicatorClassName="bg-emerald-500" />
                            </div>
                            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold text-sm min-w-[56px] flex items-center justify-center">
                                {completion}%
                            </div>
                        </div>
                    </div>

                    <div
                        className={`group flex flex-col justify-between p-4 md:p-6 rounded-lg border border-slate-200 dark:border-white/10 ${isLocked ? "bg-slate-50 dark:bg-zinc-900/10 grayscale border-dashed" : "bg-white dark:bg-zinc-900/40"} backdrop-blur-md shadow-sm transition-all`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${isLocked ? "bg-slate-200 text-slate-400" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50"}`}>
                                {isLocked ? <Lock className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                            </div>
                            <div className="flex-1">
                                <h3 className={`font-bold text-slate-900 dark:text-slate-100 text-[15px] ${isLocked ? "italic" : ""}`}>
                                    {isLocked ? "Onboarding is locked" : stats.percentage === 100 ? "General Onboarding complete!" : "Complete your General Onboarding"}
                                </h3>
                                {isLocked ? (
                                    <p className="text-[10px] text-slate-400 mt-1">Will be unlocked for you soon</p>
                                ) : (
                                    <Progress value={stats.percentage} className="h-1 mt-2 bg-emerald-200/50" indicatorClassName="bg-emerald-600" />
                                )}
                            </div>
                            {!isLocked && (
                                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold text-sm min-w-[56px] flex items-center justify-center">
                                    {stats.percentage}%
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                <hr className="border-slate-200 dark:border-zinc-800 my-4" />

                {/* General Onboarding Section */}
                <div className="flex items-center gap-2 mt-4 px-1" id="tasks">
                    <Compass className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-200">
                        General Onboarding
                    </h2>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${isLocked ? "opacity-50 pointer-events-none" : ""}`}>
                    {isLocked ? (
                        <div className="md:col-span-2 lg:col-span-4 p-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50/50 dark:bg-zinc-900/20 text-center">
                             <div className="p-4 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 mb-4 shadow-inner">
                                <Lock className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Onboarding Modules are Hidden</h3>
                            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed">
                                Your general onboarding is currently locked. It will be unlocked by the administrator once your initial verification is complete.
                            </p>
                        </div>
                    ) : generalModules.map((mod) => {
                        const idxInFullList = modules.findIndex(m => m.id === mod.id);
                        const isCompleted = completedModules.includes(mod.id);
                        const isUnlocked = idxInFullList === 0 || completedModules.includes(modules[idxInFullList - 1].id);

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
                <div className="flex items-center gap-2 mt-8 px-1">
                    <Briefcase className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-200">
                        Role Specific Onboarding
                    </h2>
                </div>

                {roleModules.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-12">
                        {roleModules.map((mod) => {
                            const idxInFullList = modules.findIndex(m => m.id === mod.id);
                            const isCompleted = completedModules.includes(mod.id);
                            const isUnlocked = idxInFullList === 0 || completedModules.includes(modules[idxInFullList - 1].id);

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
                        <div className="flex flex-col items-center justify-center p-8 rounded-lg border border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/20 text-center">
                            <div className="p-3 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-400 mb-3">
                                <Lock className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 italic">No role-specific modules assigned yet</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
                                Complete your general onboarding first. Your program lead will assign specialized training based on your department.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

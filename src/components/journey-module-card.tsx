"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, Lock, ArrowRight } from "lucide-react";
import * as Icons from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

interface JourneyModuleCardProps {
    mod: {
        id: string;
        title: string;
        description: string;
        icon?: string;
        color?: string;
    };
    isCompleted: boolean;
    isUnlocked: boolean;
    onToggle?: (id: string) => void;
    href?: string;
}

const bgColors: Record<string, string> = {
    indigo: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border-indigo-100 dark:border-indigo-500/20",
    rose: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-100 dark:border-rose-500/20",
    amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-100 dark:border-amber-500/20",
    emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-100 dark:border-emerald-500/20",
    blue: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-100 dark:border-blue-500/20",
    violet: "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-100 dark:border-violet-500/20",
    orange: "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-300 border-orange-100 dark:border-orange-500/20",
};

const glowColors: Record<string, string> = {
    indigo: "from-indigo-500/20 to-blue-500/20",
    rose: "from-rose-500/20 to-pink-500/20",
    amber: "from-amber-500/20 to-orange-500/20",
    emerald: "from-emerald-500/20 to-teal-500/20",
    blue: "from-blue-500/20 to-cyan-500/20",
    violet: "from-violet-500/20 to-purple-500/20",
    orange: "from-orange-500/20 to-red-500/20",
};

const hoverBorderColors: Record<string, string> = {
    indigo: "hover:border-indigo-500/50 dark:hover:border-indigo-400/50",
    rose: "hover:border-rose-500/50 dark:hover:border-rose-400/50",
    amber: "hover:border-amber-500/50 dark:hover:border-amber-400/50",
    emerald: "hover:border-emerald-500/50 dark:hover:border-emerald-400/50",
    blue: "hover:border-blue-500/50 dark:hover:border-blue-400/50",
    violet: "hover:border-violet-500/50 dark:hover:border-violet-400/50",
    orange: "hover:border-orange-500/50 dark:hover:border-orange-400/50",
};

export function JourneyModuleCard({ mod, isCompleted, isUnlocked, href }: JourneyModuleCardProps) {
    const router = useRouter();
    const Icon = (Icons as any)[mod.icon || "BookOpen"] || Icons.BookOpen;
    const cardColor = mod.color || "indigo";

    return (
        <Card
            className={`group relative overflow-hidden flex flex-col transition-all duration-300 border cursor-pointer rounded-lg ${isUnlocked
                ? `bg-white dark:bg-zinc-900/40 backdrop-blur-md border-slate-200 dark:border-white/10 shadow-sm hover:shadow-xl hover:-translate-y-1 ${hoverBorderColors[cardColor] || hoverBorderColors.indigo}`
                : "bg-slate-50/50 dark:bg-white/5 border-slate-100 dark:border-white/5 opacity-60 grayscale-[0.8] cursor-not-allowed"
                }`}
            onClick={() => isUnlocked && router.push(href || `/onboarding/tasks/${mod.id}`)}
        >
            {/* Hover Glow Effect */}
            {isUnlocked && (
                <div className={`absolute -inset-px bg-gradient-to-br ${glowColors[cardColor] || glowColors.indigo} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl`} />
            )}

            {/* Card Content Container */}
            <div className="relative flex flex-col flex-1 z-10">
                {/* Decorative Background Icon */}
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] dark:opacity-[0.05] group-hover:opacity-[0.08] dark:group-hover:opacity-[0.1] transition-all duration-500 group-hover:scale-110 group-hover:-rotate-12 pointer-events-none">
                    <Icon className="w-20 h-20" />
                </div>

                <CardHeader className="px-5 py-1">
                    <div className={`w-11 h-11 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 border shadow-inner ${isCompleted
                        ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-100 dark:border-emerald-500/20"
                        : isUnlocked
                            ? (bgColors[cardColor] || bgColors.indigo)
                            : "bg-slate-100 dark:bg-zinc-800 text-slate-400 border-slate-200 dark:border-zinc-700"
                        } ${isUnlocked ? 'group-hover:scale-110 group-hover:rotate-3 shadow-lg' : ''}`}>
                        {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : isUnlocked ? <Icon className="w-6 h-6" /> : <Lock className="w-5 h-5" />}
                    </div>
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-50 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {mod.title}
                    </CardTitle>
                    <CardDescription className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed mt-2 line-clamp-3 font-medium">
                        {mod.description}
                    </CardDescription>
                </CardHeader>

                <CardFooter className="px-5 py-2 mt-auto">
                    {isUnlocked ? (
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                                {isCompleted && (
                                    <div className="px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                        Completed
                                    </div>
                                )}
                            </div>
                            <div className={`flex items-center gap-1.5 text-sm font-bold transition-all duration-300 ${isCompleted ? "text-emerald-600 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-400 group-hover:gap-2.5"}`}>
                                <span>{isCompleted ? "Review" : "Start now"}</span>
                                <ArrowRight className={`w-4 h-4 transition-transform ${!isCompleted ? "group-hover:translate-x-1" : ""}`} />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 bg-slate-100/50 dark:bg-black/20 px-3 py-1.5 rounded-lg w-fit">
                            <Lock className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.15em]">Module Locked</span>
                        </div>
                    )}
                </CardFooter>
            </div>
        </Card>
    );
}

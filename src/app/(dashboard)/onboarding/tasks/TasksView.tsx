"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Target } from "lucide-react";
import { SKILLS_CONFIG } from "@/lib/skills-config";
import { useUser } from "@/hooks/use-auth";

export default function TasksView() {
    const router = useRouter();
    const { user, isLoaded } = useUser();

    if (!isLoaded) return null;

    // Collect all selected sub-skills from metadata
    const metadata = user?.publicMetadata || {};
    const primaryCategory = metadata.primarySkill as string;
    const secondaryCategory = metadata.secondarySkillCategory as string;

    const getTasksForCategory = (categoryName: string) => {
        if (!categoryName || categoryName === "None") return [];
        const config = SKILLS_CONFIG[categoryName];
        if (!config) return [];

        const selectedSubSkills = (metadata[config.key] as string[]) || [];
        // Filter roles selected by user, then filter only published tasks
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

    // Remove duplicates if primary and secondary have same assignments
    const uniqRoles = Array.from(new Map(allMatchingRoles.map(r => [r.name, r])).values());

    return (
        <div className="flex flex-1 flex-col gap-8 p-4 md:p-8 max-w-4xl mx-auto w-full animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/onboarding')} className="rounded-full">
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Target className="w-6 h-6 text-emerald-500" />
                        Role Specific Tasks
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Tailored modules for {primaryCategory}{secondaryCategory && secondaryCategory !== 'None' ? ` & ${secondaryCategory}` : ''}.
                    </p>
                </div>
            </div>

            {uniqRoles.length > 0 ? (
                <div className="space-y-8">
                    {uniqRoles.map((role, idx) => (
                        <div key={idx} className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-1 bg-emerald-500 rounded-full" />
                                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                                    {role.name}
                                </h2>
                            </div>

                            <div className="grid gap-4">
                                {role.tasks.map((task, tIdx) => (
                                    <div key={task.id} className="group relative flex items-start gap-4 p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-emerald-500 hover:shadow-md transition-all">
                                        <div className="mt-1 w-5 h-5 rounded-full border-2 border-slate-300 dark:border-zinc-700 shrink-0 flex items-center justify-center group-hover:border-emerald-500">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{task.type}</p>
                                                {task.required && <span className="w-1 h-1 rounded-full bg-emerald-500" />}
                                            </div>
                                            <p className="text-[15px] font-bold text-slate-900 dark:text-white mb-1">
                                                {task.title}
                                            </p>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
                                                "{task.description}"
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-slate-50 dark:bg-zinc-900/30 rounded-3xl border-2 border-dashed border-slate-200 dark:border-zinc-800">
                    <div className="p-4 bg-white dark:bg-zinc-950 rounded-2xl shadow-sm">
                        <Target className="w-8 h-8 text-slate-300" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">No tasks unlocked yet</h3>
                        <p className="text-sm text-slate-500 max-w-xs mx-auto">
                            Complete your skills selection in the profile section to see your specific onboarding modules.
                        </p>
                    </div>
                    <Button onClick={() => router.push('/profile')} variant="outline" className="mt-2">
                        Go to Profile
                    </Button>
                </div>
            )}
        </div>
    );
}

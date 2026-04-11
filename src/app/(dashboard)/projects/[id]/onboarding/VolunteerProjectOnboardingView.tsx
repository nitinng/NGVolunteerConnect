"use client";

import { useEffect, useState } from "react";
import { getProjectById, getProjectOnboardingSteps, getVolunteerOnboardingProgress, upsertVolunteerOnboardingProgress, getMyApplications } from "@/app/actions/project-actions";
import { Loader2, ArrowLeft, CheckCircle2, Circle, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default function VolunteerProjectOnboardingView({ projectId }: { projectId: string }) {
    const [project, setProject] = useState<any>(null);
    const [application, setApplication] = useState<any>(null);
    const [steps, setSteps] = useState<any[]>([]);
    const [progress, setProgress] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        loadData();
    }, [projectId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [proj, apps, onboardingSteps] = await Promise.all([
                getProjectById(projectId),
                getMyApplications(),
                getProjectOnboardingSteps(projectId)
            ]);
            
            const app = apps.find(a => a.project_id === projectId && a.status === 'approved');
            setProject(proj);
            setApplication(app);
            setSteps(onboardingSteps);

            if (app) {
                const prog = await getVolunteerOnboardingProgress(app.id);
                setProgress(prog);
            }
        } catch (error: any) {
            toast.error("Failed to load onboarding", { description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkComplete = async (stepId: string, currentStatus: boolean) => {
        if (!application) return;
        setIsUpdating(true);
        try {
            await upsertVolunteerOnboardingProgress(application.id, stepId, !currentStatus);
            toast.success(!currentStatus ? "Step marked as complete!" : "Step marked as incomplete");
            
            // Optimistic update
            setProgress(prev => {
                const existing = prev.find(p => p.step_id === stepId);
                if (existing) {
                    return prev.map(p => p.step_id === stepId ? { ...p, completed: !currentStatus } : p);
                }
                return [...prev, { step_id: stepId, completed: !currentStatus }];
            });
            
        } catch (e: any) {
            toast.error("Error updating progress", { description: e.message });
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Loading onboarding...</p>
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

    const completedCount = progress.filter(p => p.completed).length;
    const isFullyCompleted = steps.length > 0 && completedCount === steps.length;

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-4xl mx-auto w-full">
            <Link href="/projects" className="flex items-center text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors w-fit">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Projects
            </Link>
            
            <div className="relative overflow-hidden rounded-lg bg-indigo-600 text-white p-6 shadow-sm">
                <h1 className="text-2xl font-bold tracking-tight">Onboarding: {project.title}</h1>
                <p className="text-indigo-100 mt-1 font-medium">Complete these steps to formally begin your contribution.</p>
                
                <div className="mt-6 bg-white/20 p-4 rounded-lg flex items-center justify-between">
                    <span className="font-bold">Your Progress</span>
                    <span className="font-black">{completedCount} / {steps.length} Steps</span>
                </div>
            </div>

            {isFullyCompleted && (
                <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800/30">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 text-emerald-600 dark:bg-emerald-800 dark:text-emerald-300 rounded-full">
                            <PartyPopper className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-emerald-800 dark:text-emerald-300 text-lg">You are all set!</h3>
                            <p className="text-emerald-600 dark:text-emerald-400 text-sm">You have completed all project requirements. Connect with your PM to get started!</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-4">
                {steps.map((step, index) => {
                    const isCompleted = progress.find(p => p.step_id === step.id)?.completed || false;
                    
                    return (
                        <Card key={step.id} className={`transition-all ${isCompleted ? 'border-emerald-200 bg-slate-50/50' : 'border-slate-200 hover:border-indigo-200'}`}>
                            <CardContent className="p-5 flex flex-col md:flex-row gap-5 items-start">
                                <div className="mt-1">
                                    <button 
                                        onClick={() => handleMarkComplete(step.id, isCompleted)}
                                        disabled={isUpdating}
                                        className="focus:outline-none disabled:opacity-50"
                                    >
                                        {isCompleted ? (
                                            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                                        ) : (
                                            <Circle className="w-7 h-7 text-slate-300 hover:text-indigo-400 transition-colors" />
                                        )}
                                    </button>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Step {index + 1}</span>
                                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase font-semibold">{step.type}</span>
                                    </div>
                                    <h3 className={`text-lg font-bold ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-slate-100'}`}>
                                        {step.title}
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                                {!isCompleted && step.type === 'form' && (
                                    <Button variant="outline" className="w-full md:w-auto shrink-0 font-bold text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                                        Fill Form
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}

                {steps.length === 0 && (
                     <div className="py-12 border-2 border-dashed rounded-xl text-center bg-slate-50">
                        <p className="text-slate-500 font-medium">No strict onboarding steps required. You're ready to go!</p>
                    </div>
                )}
            </div>
        </div>
    );
}

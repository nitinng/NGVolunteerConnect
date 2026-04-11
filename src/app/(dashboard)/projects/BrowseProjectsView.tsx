"use client";

import { useEffect, useState } from "react";
import { getProjects, applyToProject, getMyApplications } from "@/app/actions/project-actions";
import { Loader2, Briefcase, Calendar, Users, Building2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function BrowseProjectsView({ isVolunteer }: { isVolunteer: boolean }) {
    const [projects, setProjects] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("browse");
    const [applyingObj, setApplyingObj] = useState<Record<string, boolean>>({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [projData, appData] = await Promise.all([
                getProjects(),
                isVolunteer ? getMyApplications() : Promise.resolve([])
            ]);
            setProjects(projData);
            setApplications(appData);
        } catch (error: any) {
            toast.error("Failed to load projects", { description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleApply = async (projectId: string) => {
        setApplyingObj(prev => ({ ...prev, [projectId]: true }));
        try {
            await applyToProject(projectId);
            toast.success("Application submitted successfully!");
            loadData(); // refresh lists
        } catch (error: any) {
            toast.error("Failed to apply", { description: error.message });
        } finally {
            setApplyingObj(prev => ({ ...prev, [projectId]: false }));
        }
    };

    const hasApplied = (projectId: string) => {
        return applications.some(app => app.project_id === projectId);
    };

    const ProjectCard = ({ project }: { project: any }) => {
        const applied = hasApplied(project.id);
        const remaining = project.volunteers_needed; 

        return (
            <div className="flex flex-col p-5 border rounded-xl bg-white dark:bg-zinc-950 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{project.title}</h3>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full border border-indigo-100 dark:border-indigo-800/50">
                        {project.impact_tier}
                    </span>
                </div>
                
                <p className="text-sm text-slate-600 dark:text-zinc-400 mb-4 line-clamp-2 min-h-[40px]">
                    {project.description || "No description provided."}
                </p>
                
                <div className="flex flex-col gap-2 text-xs text-slate-500 mb-5">
                    <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-500" />
                        <span>{project.department?.name || project.team || "General Department"}</span>
                    </div>
                    {project.duration_weeks && (
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-indigo-500" />
                            <span>Duration: {project.duration_weeks} weeks</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-rose-500" />
                        <span>{remaining} openings</span>
                    </div>
                </div>
                
                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-zinc-800">
                    {isVolunteer ? (
                        <Button 
                            className="w-full font-bold"
                            disabled={applied || applyingObj[project.id]}
                            onClick={() => handleApply(project.id)}
                            variant={applied ? "secondary" : "default"}
                        >
                            {applyingObj[project.id] ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            {applied ? "Already Applied" : "Apply to Project"}
                        </Button>
                    ) : (
                        <Button variant="outline" className="w-full font-bold disabled:opacity-100" disabled>
                            Read Only View
                        </Button>
                    )}
                </div>
            </div>
        );
    };

    const ApplicationCard = ({ app }: { app: any }) => {
        const p = app.project;
        if (!p) return null;

        const statusColors = {
            pending: "bg-amber-100 text-amber-700 border-amber-200",
            approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
            rejected: "bg-rose-100 text-rose-700 border-rose-200",
            withdrawn: "bg-slate-100 text-slate-700 border-slate-200",
        }[app.status as string] || "bg-slate-100 text-slate-700";

        const StatusIcon = {
            pending: Clock,
            approved: CheckCircle2,
            rejected: XCircle,
            withdrawn: XCircle,
        }[app.status as string] || Clock;

        return (
            <div className="flex flex-col p-5 border rounded-xl bg-white dark:bg-zinc-950 shadow-sm border-slate-200 dark:border-zinc-800">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100">{p.title}</h3>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold capitalize ${statusColors}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {app.status}
                    </div>
                </div>
                <div className="text-xs text-slate-500 mb-4">
                    <p>Applied on {new Date(app.applied_at).toLocaleDateString()}</p>
                    <p className="mt-1">Department: {p.department?.name || "General"}</p>
                </div>
                
                {app.status === 'rejected' && app.rejection_reason && (
                    <div className="mt-2 p-3 bg-rose-50 border border-rose-100 rounded-lg text-sm text-rose-800">
                        <span className="font-bold">Reason:</span> {app.rejection_reason}
                    </div>
                )}

                {app.status === 'approved' && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={() => window.location.href=`/projects/${app.project_id}/onboarding`}>
                            Complete Project Onboarding
                        </Button>
                    </div>
                )}
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Loading projects...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <div className="relative overflow-hidden rounded-lg bg-slate-50 dark:bg-zinc-900/50 p-6 border border-slate-200 dark:border-white/10 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                        <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                            Project Board
                        </h1>
                        <p className="text-sm text-slate-500 mt-1 font-medium">
                            Browse and apply to active projects that match your skills.
                        </p>
                    </div>
                </div>
            </div>

            {isVolunteer ? (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="inline-flex h-auto p-1 bg-slate-100 dark:bg-zinc-800 rounded-lg mb-6">
                        <TabsTrigger value="browse" className="rounded-md px-4 py-1.5 text-sm font-medium">
                            Explore Projects
                        </TabsTrigger>
                        <TabsTrigger value="applications" className="rounded-md px-4 py-1.5 text-sm font-medium">
                            My Applications 
                            {applications.length > 0 && <span className="ml-2 bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full text-[10px]">{applications.length}</span>}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="browse" className="focus-visible:outline-none">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projects.map(p => <ProjectCard key={p.id} project={p} />)}
                            {projects.length === 0 && (
                                <div className="col-span-full py-12 text-center border-2 border-dashed rounded-lg bg-white dark:bg-zinc-950">
                                    <p className="text-slate-500 font-medium">No active projects available right now.</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="applications" className="focus-visible:outline-none">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {applications.map(app => <ApplicationCard key={app.id} app={app} />)}
                            {applications.length === 0 && (
                                <div className="col-span-full py-12 text-center border-2 border-dashed rounded-lg bg-white dark:bg-zinc-950">
                                    <p className="text-slate-500 font-medium">You haven't applied to any projects yet.</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map(p => <ProjectCard key={p.id} project={p} />)}
                    {projects.length === 0 && (
                        <div className="col-span-full py-12 text-center border-2 border-dashed rounded-lg bg-white dark:bg-zinc-950">
                            <p className="text-slate-500 font-medium">No active projects available right now.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

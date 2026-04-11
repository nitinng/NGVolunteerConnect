"use client";

import { useEffect, useState } from "react";
import { getProjectById, getApplicationsForProject, updateApplicationStatus, manualAssignVolunteer } from "@/app/actions/project-actions";
import { getAllProfiles } from "@/app/actions/supabase-actions";
import { Loader2, ArrowLeft, Settings, Users, BookOpenCheck, CheckCircle2, XCircle, Plus, Trash2 } from "lucide-react";
import OnboardingFlowBuilder from "@/components/onboarding-flow-builder";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUserContext } from "@/contexts/user-context";

export default function ProjectDetailsManagementView({ projectId }: { projectId: string }) {
    const [project, setProject] = useState<any>(null);
    const [applications, setApplications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("applications");
    
    const [allProfiles, setAllProfiles] = useState<any[]>([]);
    const [assignSearch, setAssignSearch] = useState("");
    const [isAssigning, setIsAssigning] = useState(false);
    const user = useUserContext();
    const isReadOnly = user?.role === "Operations";

    useEffect(() => {
        loadData();
    }, [projectId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [proj, apps, profiles] = await Promise.all([
                getProjectById(projectId),
                getApplicationsForProject(projectId),
                getAllProfiles()
            ]);
            setProject(proj);
            setApplications(apps);
            setAllProfiles(profiles || []);
        } catch (error: any) {
            toast.error("Failed to load project details", { description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async (appId: string, status: "approved" | "rejected", isRejecting?: boolean) => {
        let reason = "";
        if (isRejecting) {
            reason = prompt("Please provide a reason for rejection (optional):") || "";
        }
        
        try {
            await updateApplicationStatus(appId, status, reason);
            toast.success(`Application marked as ${status}`);
            loadData();
        } catch (e: any) {
            toast.error("Failed to update status", { description: e.message });
        }
    };

    const handleManualAssign = async (profileId: string) => {
        setIsAssigning(true);
        try {
            await manualAssignVolunteer(projectId, profileId);
            toast.success("Volunteer assigned successfully");
            setAssignSearch("");
            loadData();
        } catch (e: any) {
            toast.error("Failed to assign", { description: e.message });
        } finally {
            setIsAssigning(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Loading details...</p>
            </div>
        );
    }

    if (!project) return <div className="p-12 text-center">Project not found</div>;

    const pending = applications.filter(a => a.status === 'pending');
    const approved = applications.filter(a => a.status === 'approved');

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <Link href="/management/projects" className="flex items-center text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors w-fit">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Projects
            </Link>
            
            <div className="relative overflow-hidden rounded-lg bg-slate-50 dark:bg-zinc-900/50 p-6 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                        <Settings className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                            {project.title}
                        </h1>
                        <p className="text-sm text-slate-500 mt-1 font-medium">
                            {project.department?.name || "General"} · {project.volunteers_needed} positions
                        </p>
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="inline-flex h-auto p-1 bg-slate-100 dark:bg-zinc-800 rounded-lg mb-6">
                    <TabsTrigger value="applications" className="rounded-md px-4 py-1.5 text-sm font-medium gap-2">
                        <Users className="w-4 h-4" /> Applications 
                        {pending.length > 0 && <span className="bg-amber-100 text-amber-700 font-bold px-1.5 rounded-full text-xs">{pending.length}</span>}
                    </TabsTrigger>
                    <TabsTrigger value="onboarding" className="rounded-md px-4 py-1.5 text-sm font-medium gap-2">
                        <BookOpenCheck className="w-4 h-4" /> Onboarding Setup
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="applications" className="focus-visible:outline-none">
                    <div className="flex flex-col md:flex-row gap-6 items-start mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 w-full">
                            <Card className="border-indigo-100 bg-white shadow-sm">
                                <CardHeader className="py-4"><CardTitle className="text-sm font-medium text-slate-500">Total Applications</CardTitle></CardHeader>
                                <CardContent><p className="text-3xl font-black text-slate-800">{applications.length}</p></CardContent>
                            </Card>
                            <Card className="border-emerald-100 bg-white shadow-sm">
                                <CardHeader className="py-4"><CardTitle className="text-sm font-medium text-slate-500">Approved Volunteers</CardTitle></CardHeader>
                                <CardContent><p className="text-3xl font-black text-emerald-600">{approved.length} <span className="text-sm text-slate-400 font-normal">/ {project.volunteers_needed} needed</span></p></CardContent>
                            </Card>
                            <Card className="border-amber-100 bg-white shadow-sm">
                                <CardHeader className="py-4"><CardTitle className="text-sm font-medium text-slate-500">Pending Review</CardTitle></CardHeader>
                                <CardContent><p className="text-3xl font-black text-amber-600">{pending.length}</p></CardContent>
                            </Card>
                        </div>
                        
                        {!isReadOnly && (
                            <Card className="w-full md:w-80 shrink-0 border-indigo-200 bg-indigo-50/20">
                                <CardHeader className="py-3 px-4">
                                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-indigo-700">Manual Assign</CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 pt-0">
                                    <div className="space-y-2">
                                        <Input 
                                            placeholder="Search volunteer..." 
                                            className="h-8 text-xs bg-white" 
                                            value={assignSearch}
                                            onChange={e => setAssignSearch(e.target.value)}
                                        />
                                        {assignSearch.length > 2 && (
                                            <div className="border rounded bg-white max-h-40 overflow-y-auto shadow-lg">
                                                {allProfiles
                                                    .filter(p => !p.role || p.role === 'Volunteer') // Only assign volunteers
                                                    .filter(p => p.full_name.toLowerCase().includes(assignSearch.toLowerCase()) || (p.email && p.email.toLowerCase().includes(assignSearch.toLowerCase())))
                                                    .map(p => (
                                                        <button
                                                            key={p.id}
                                                            disabled={isAssigning || applications.some(a => a.profile_id === p.id)}
                                                            onClick={() => handleManualAssign(p.id)}
                                                            className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 border-b flex justify-between items-center group"
                                                        >
                                                            <div className="truncate pr-2">
                                                                <div className="font-bold">{p.full_name}</div>
                                                                <div className="text-slate-400">{p.email}</div>
                                                            </div>
                                                            {applications.some(a => a.profile_id === p.id) ? (
                                                                <span className="text-emerald-500 font-bold shrink-0">Assigned</span>
                                                            ) : (
                                                                <Plus className="w-3.5 h-3.5 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            )}
                                                        </button>
                                                    ))
                                                }
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div className="border rounded-md bg-white dark:bg-zinc-950 shadow-sm overflow-hidden line-clamp-none">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="px-6">Volunteer</TableHead>
                                    <TableHead>Contact Info</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right px-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {applications.length > 0 ? applications.map(app => (
                                    <TableRow key={app.id}>
                                        <TableCell className="px-6 font-bold">{app.profile?.full_name}</TableCell>
                                        <TableCell className="text-sm text-slate-500">
                                            {app.profile?.email} <br/> {app.profile?.phone}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`text-xs px-2 py-1 rounded-full font-bold capitalize ${
                                                app.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                                app.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                                {app.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            {app.status === 'pending' && !isReadOnly && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button size="sm" onClick={() => handleUpdateStatus(app.id, 'approved')} className="bg-emerald-600 hover:bg-emerald-700">Approve</Button>
                                                    <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(app.id, 'rejected', true)} className="border-rose-200 text-rose-600 hover:bg-rose-50">Reject</Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-12 text-slate-500">No applications found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="onboarding" className="focus-visible:outline-none">
                    <OnboardingFlowBuilder 
                        projectId={projectId} 
                        title="Project Onboarding Flow" 
                        description={`Manage the modular onboarding flow for ${project.title}. Volunteers will need to complete these tasks once approved.`} 
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}

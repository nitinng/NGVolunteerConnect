"use client";

import { useEffect, useState } from "react";
import { getProjectById, getApplicationsForProject, updateApplicationStatus, getProjectOnboardingSteps, upsertProjectOnboardingStep, deleteProjectOnboardingStep } from "@/app/actions/project-actions";
import { Loader2, ArrowLeft, Settings, Users, BookOpenCheck, CheckCircle2, XCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ProjectDetailsManagementView({ projectId }: { projectId: string }) {
    const [project, setProject] = useState<any>(null);
    const [applications, setApplications] = useState<any[]>([]);
    const [onboardingSteps, setOnboardingSteps] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("applications");
    const [editingStep, setEditingStep] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, [projectId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [proj, apps, steps] = await Promise.all([
                getProjectById(projectId),
                getApplicationsForProject(projectId),
                getProjectOnboardingSteps(projectId)
            ]);
            setProject(proj);
            setApplications(apps);
            setOnboardingSteps(steps);
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

    const handleSaveStep = async () => {
        if (!editingStep?.title) return toast.error("Title is required");
        try {
            await upsertProjectOnboardingStep({
                ...editingStep,
                project_id: projectId
            });
            toast.success("Step saved successfully");
            setEditingStep(null);
            loadData();
        } catch (e: any) {
            toast.error("Failed to save step", { description: e.message });
        }
    };

    const handleDeleteStep = async (id: string) => {
        toast("Delete onboarding step?", {
            action: {
                label: "Delete",
                onClick: async () => {
                    try {
                        await deleteProjectOnboardingStep(id);
                        toast.success("Step deleted");
                        loadData();
                    } catch (e: any) {
                        toast.error("Error", { description: e.message });
                    }
                }
            }
        });
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                                            {app.status === 'pending' && (
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
                     <div className="flex justify-between items-center mb-6 border-b pb-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Project Onboarding Flow</h3>
                            <p className="text-sm text-slate-500">These steps will be required for approved volunteers.</p>
                        </div>
                        <Button className="bg-indigo-600 font-bold" onClick={() => setEditingStep({ type: 'info', step_order: onboardingSteps.length + 1 })}>
                            <Plus className="w-4 h-4 mr-2" /> Add Step
                        </Button>
                    </div>

                    {editingStep && (
                        <Card className="mb-6 border-indigo-200 bg-indigo-50/10">
                            <CardHeader>
                                <CardTitle>{editingStep.id ? "Edit Step" : "New Onboarding Step"}</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700">Step Title</label>
                                    <Input value={editingStep.title || ''} onChange={e => setEditingStep({ ...editingStep, title: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700">Type</label>
                                    <select 
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 shadow-sm"
                                        value={editingStep.type || 'info'}
                                        onChange={e => setEditingStep({ ...editingStep, type: e.target.value })}
                                    >
                                        <option value="info">Information Only</option>
                                        <option value="checkbox">Checkbox Acknowledgement</option>
                                        <option value="form">Data Collection (Form)</option>
                                    </select>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-700">Description (Instructions)</label>
                                    <Textarea value={editingStep.description || ''} onChange={e => setEditingStep({ ...editingStep, description: e.target.value })} rows={3} />
                                </div>
                            </CardContent>
                            <CardFooter className="gap-2">
                                <Button onClick={handleSaveStep} className="bg-indigo-600">Save Step</Button>
                                <Button variant="ghost" onClick={() => setEditingStep(null)}>Cancel</Button>
                            </CardFooter>
                        </Card>
                    )}

                    <div className="space-y-3">
                        {onboardingSteps.map((step, idx) => (
                            <div key={step.id} className="flex gap-4 p-4 border rounded-xl bg-white shadow-sm hover:border-indigo-200 transition-colors">
                                <div className="flex items-center justify-center w-8 h-8 rounded bg-slate-100 font-black text-slate-500 shrink-0">
                                    {idx + 1}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-900">{step.title}</h4>
                                    <p className="text-sm text-slate-600 mt-1">{step.description}</p>
                                    <span className="inline-block mt-2 text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded uppercase tracking-wider">{step.type}</span>
                                </div>
                                <div className="flex items-start gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => setEditingStep(step)}><Settings className="w-4 h-4" /></Button>
                                    <Button variant="ghost" size="icon" className="text-rose-500" onClick={() => handleDeleteStep(step.id)}><Trash2 className="w-4 h-4" /></Button>
                                </div>
                            </div>
                        ))}
                        {onboardingSteps.length === 0 && (
                            <div className="py-12 border-2 border-dashed rounded-xl text-center">
                                <p className="text-slate-500 font-medium">No onboarding steps defined for this project.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

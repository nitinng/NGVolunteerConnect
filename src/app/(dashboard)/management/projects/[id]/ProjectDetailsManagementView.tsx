"use client";

import { useEffect, useState } from "react";
import { getProjectById, getApplicationsForProject, updateApplicationStatus, manualAssignVolunteer, removeVolunteer, getOnboardingResponsesByApplication } from "@/app/actions/project-actions";
import { getAllProfiles } from "@/app/actions/supabase-actions";
import { Loader2, ArrowLeft, Settings, Users, BookOpenCheck, CheckCircle2, XCircle, Plus, Trash2, UserX, BookOpen, Briefcase, GraduationCap, MapPin, ExternalLink, CalendarDays, Clock, ClipboardList, Mail, Phone, Linkedin, FileText, User, Target } from "lucide-react";
import OnboardingFlowBuilder from "@/components/onboarding-flow-builder";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useUserContext } from "@/contexts/user-context";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter, 
    DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProjectDetailsManagementView({ projectId }: { projectId: string }) {
    const [project, setProject] = useState<any>(null);
    const [applications, setApplications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("applications");
    
    const [allProfiles, setAllProfiles] = useState<any[]>([]);
    const [assignSearch, setAssignSearch] = useState("");
    const [isAssigning, setIsAssigning] = useState(false);
    
    // Removal state
    const [removingApp, setRemovingApp] = useState<any>(null);
    const [removalReason, setRemovalReason] = useState("");
    const [isRemoving, setIsRemoving] = useState(false);

    // Review state
    const [reviewingApp, setReviewingApp] = useState<any>(null);
    const [onboardingResponses, setOnboardingResponses] = useState<any[]>([]);
    const [isLoadingResponses, setIsLoadingResponses] = useState(false);

    const user = useUserContext();
    const isReadOnly = user?.role === "Operations";

    useEffect(() => {
        loadData();
    }, [projectId]);

    useEffect(() => {
        if (reviewingApp) {
            loadOnboardingResponses(reviewingApp.id);
        } else {
            setOnboardingResponses([]);
        }
    }, [reviewingApp?.id]);

    const loadOnboardingResponses = async (appId: string) => {
        setIsLoadingResponses(true);
        try {
            const data = await getOnboardingResponsesByApplication(appId);
            setOnboardingResponses(data);
        } catch (e: any) {
            console.error("Failed to load responses:", e);
        } finally {
            setIsLoadingResponses(false);
        }
    };

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

    const handleRemoveVolunteer = async () => {
        if (!removingApp || !removalReason.trim()) return;
        
        setIsRemoving(true);
        try {
            await removeVolunteer(removingApp.id, removalReason);
            toast.success("Volunteer removed from project");
            setRemovingApp(null);
            setRemovalReason("");
            loadData();
        } catch (e: any) {
            toast.error("Failed to remove volunteer", { description: e.message });
        } finally {
            setIsRemoving(false);
        }
    };

    const volunteerTypeBadge: Record<string, { label: string; color: string }> = {
        external_individual: { label: "Individual Contributor", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" },
        external_corporate: { label: "Corporate / CSR", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
        internal_alumni_ext: { label: "Alumni — External", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
        internal_alumni_staff: { label: "Alumni — Staff", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" },
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

    const pending = applications.filter(a => a.status === 'pending' || a.status === 'pending_screening');
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
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 w-full">
                            <Card className="border-slate-100 bg-white shadow-sm">
                                <CardHeader className="py-4"><CardTitle className="text-sm font-medium text-slate-500">Total Applications</CardTitle></CardHeader>
                                <CardContent><p className="text-3xl font-black text-slate-800">{applications.length}</p></CardContent>
                            </Card>
                            <Card className="border-indigo-100 bg-white shadow-sm">
                                <CardHeader className="py-4"><CardTitle className="text-sm font-medium text-slate-500">In Onboarding</CardTitle></CardHeader>
                                <CardContent><p className="text-3xl font-black text-indigo-600">{applications.filter(a => a.status === 'onboarding').length}</p></CardContent>
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
                                    <TableHead>Screening Score</TableHead>
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
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-black ${
                                                        (app.screening_score || 0) >= (project.screening_cutoff_score || 75) ? 'text-emerald-600' : 'text-rose-600'
                                                    }`}>
                                                        {app.screening_score || 0}%
                                                    </span>
                                                    <Progress value={app.screening_score || 0} className="h-1.5 w-16" indicatorClassName={(app.screening_score || 0) >= (project.screening_cutoff_score || 75) ? 'bg-emerald-500' : 'bg-rose-500'} />
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                    Cutoff: {project.screening_cutoff_score || 75}%
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`text-xs px-2 py-1 rounded-full font-bold capitalize ${
                                                app.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                                app.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                                                app.status === 'onboarding' ? 'bg-indigo-100 text-indigo-700' :
                                                app.status === 'pending_screening' ? 'bg-amber-100 text-amber-700' :
                                                app.status === 'pending' ? 'bg-blue-100 text-blue-700' :
                                                app.status === 'withdrawn' ? 'bg-slate-100 text-slate-700' :
                                                app.status === 'removed' ? 'bg-zinc-100 text-zinc-700' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                                {app.status.replace('_', ' ')}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className="text-indigo-600 hover:bg-indigo-50 font-bold" 
                                                    onClick={() => setReviewingApp(app)}
                                                >
                                                    <BookOpen className="w-4 h-4 mr-2" /> View Details
                                                </Button>

                                                {(app.status === 'pending' || app.status === 'pending_screening') && !isReadOnly && (
                                                    <>
                                                        <Button size="sm" onClick={() => handleUpdateStatus(app.id, 'approved')} className="bg-emerald-600 hover:bg-emerald-700 font-bold px-4">
                                                            {app.status === 'pending_screening' ? "Approve Screening" : "Approve"}
                                                        </Button>
                                                        <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(app.id, 'rejected', true)} className="border-rose-200 text-rose-600 hover:bg-rose-50 font-bold px-4">Reject</Button>
                                                    </>
                                                )}

                                                {app.status === 'approved' && !isReadOnly && (
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 font-bold"
                                                        onClick={() => setRemovingApp(app)}
                                                    >
                                                        <UserX className="w-4 h-4 mr-2" /> Remove
                                                    </Button>
                                                )}
                                            </div>
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

            {/* Remove Volunteer Dialog */}
            <Dialog open={!!removingApp} onOpenChange={(open) => !open && setRemovingApp(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove Volunteer</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove <span className="font-bold text-slate-900">{removingApp?.profile?.full_name}</span> from <span className="font-bold text-slate-900">{project.title}</span>?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea 
                            placeholder="Reason for removal..." 
                            value={removalReason}
                            onChange={(e) => setRemovalReason(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setRemovingApp(null)}>Cancel</Button>
                        <Button 
                            variant="destructive" 
                            disabled={isRemoving || !removalReason.trim()} 
                            onClick={handleRemoveVolunteer}
                        >
                            {isRemoving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Confirm Removal
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Application Review Dialog */}
            <Dialog open={!!reviewingApp} onOpenChange={(open) => !open && setReviewingApp(null)}>
                <DialogContent 
                    showCloseButton={false}
                    className="fixed inset-0 top-0 left-0 translate-x-0 translate-y-0 sm:max-w-none w-screen h-screen m-0 p-0 rounded-none overflow-y-auto border-none bg-slate-50 dark:bg-zinc-950 block custom-scrollbar"
                >
                    <DialogHeader className="sr-only">
                        <DialogTitle>Application Review: {reviewingApp?.profile?.full_name}</DialogTitle>
                        <DialogDescription>Detailed volunteer profile and onboarding responses for {project.title}.</DialogDescription>
                    </DialogHeader>

                    {/* Header Replicating ProfileView */}
                    <div className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-white/10 p-6 md:p-8 flex-shrink-0">
                        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={reviewingApp?.profile?.avatar_url} />
                                    <AvatarFallback>{reviewingApp?.profile?.full_name?.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <DialogTitle className="text-xl font-bold tracking-tight text-slate-800">{reviewingApp?.profile?.full_name}</DialogTitle>
                                        {reviewingApp?.profile?.volunteer_type && volunteerTypeBadge[reviewingApp.profile.volunteer_type] && (
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${volunteerTypeBadge[reviewingApp.profile.volunteer_type].color}`}>
                                                {volunteerTypeBadge[reviewingApp.profile.volunteer_type].label}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500 font-medium">{reviewingApp?.profile?.email}</p>
                                    {reviewingApp?.profile?.description && (
                                        <p className="text-xs text-slate-400 mt-1 max-w-md line-clamp-1 italic">{reviewingApp.profile.description}</p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-zinc-800 rounded-lg border border-slate-100 dark:border-white/5 mr-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Status:</span>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                                        reviewingApp?.status === 'approved' ? 'text-emerald-600' :
                                        reviewingApp?.status === 'rejected' ? 'text-rose-600' :
                                        'text-amber-600'
                                    }`}>
                                        {reviewingApp?.status === 'pending' ? 'Pending Final Review' : 
                                         reviewingApp?.status === 'pending_screening' ? 'Screening Review' : 
                                         reviewingApp?.status?.replace('_', ' ')}
                                    </span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-9 w-9 bg-slate-100 dark:bg-zinc-800 rounded-lg" onClick={() => setReviewingApp(null)}>
                                    <XCircle className="w-5 h-5 text-slate-500" />
                                </Button>
                            </div>
                        </div>
                        
                        {/* Progress Bar Exactly like ProfileView */}
                        <div className="max-w-4xl mx-auto mt-6 space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Profile & Review Completion</span>
                                <span className="text-sm font-bold text-indigo-600">100%</span>
                            </div>
                            <Progress value={100} className="h-2" indicatorClassName="bg-emerald-500" />
                        </div>
                    </div>

                    <div className="max-w-4xl mx-auto w-full p-4 md:p-8">
                        <Tabs defaultValue="personal" className="w-full">
                            <TabsList className="bg-slate-100 dark:bg-zinc-800/50 p-1 rounded-xl mb-8 flex items-center w-full h-auto min-h-[44px] overflow-x-auto no-scrollbar border border-slate-200/50">
                                {/* Group 1: Profile */}
                                <div className="flex items-center flex-1 min-w-fit border-r border-slate-200 dark:border-zinc-700 pr-2 mr-2">
                                    <TabsTrigger value="personal" className="flex-1 rounded-lg font-black text-[10px] uppercase tracking-widest gap-2 py-2 h-8 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                        <User className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Personal</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="education" className="flex-1 rounded-lg font-black text-[10px] uppercase tracking-widest gap-2 py-2 h-8 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                        <GraduationCap className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Education</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="professional" className="flex-1 rounded-lg font-black text-[10px] uppercase tracking-widest gap-2 py-2 h-8 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                        <Briefcase className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Pro</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="availability" className="flex-1 rounded-lg font-black text-[10px] uppercase tracking-widest gap-2 py-2 h-8 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                        <Clock className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Commitment</span>
                                    </TabsTrigger>
                                </div>

                                {/* Group 2: Project Process */}
                                <div className="flex items-center gap-1 min-w-fit">
                                    <TabsTrigger value="screening" className="rounded-lg font-black text-[10px] uppercase tracking-widest gap-2 text-indigo-600 py-2 h-8 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                        <Target className="w-3.5 h-3.5" /> Screening
                                    </TabsTrigger>
                                    <TabsTrigger value="questionnaire" className="rounded-lg font-black text-[10px] uppercase tracking-widest gap-2 text-indigo-600 py-2 h-8 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                        <BookOpen className="w-3.5 h-3.5" /> Onboarding
                                    </TabsTrigger>
                                    <TabsTrigger value="decision" className="rounded-lg font-black text-[10px] uppercase tracking-widest gap-2 text-emerald-600 py-2 h-8 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Decision
                                    </TabsTrigger>
                                </div>
                            </TabsList>

                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                                {/* TAB: PERSONAL */}
                                <TabsContent value="personal" className="mt-0 outline-none">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Personal Information</CardTitle>
                                            <CardDescription>Contact details and location verification.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Full Name</Label>
                                                    <p className="text-sm font-semibold text-slate-700">{reviewingApp?.profile?.full_name}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Email Address</Label>
                                                    <p className="text-sm font-semibold text-slate-700">{reviewingApp?.profile?.email}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Phone Number</Label>
                                                    <p className="text-sm font-semibold text-slate-700">{reviewingApp?.profile?.phone || "Not Provided"}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Pronouns</Label>
                                                    <p className="text-sm font-semibold text-slate-700">{reviewingApp?.profile?.pronouns || "Not Provided"}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Country</Label>
                                                    <p className="text-sm font-semibold text-slate-700">{reviewingApp?.profile?.country || "Not Provided"}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">State / City</Label>
                                                    <p className="text-sm font-semibold text-slate-700">{reviewingApp?.profile?.state}, {reviewingApp?.profile?.city}</p>
                                                </div>
                                            </div>

                                            <div className="pt-6 border-t flex flex-wrap gap-4">
                                                {reviewingApp?.profile?.linkedin_url && (
                                                    <Button variant="outline" size="sm" className="rounded-lg" onClick={() => window.open(reviewingApp.profile.linkedin_url, '_blank')}>
                                                        <Linkedin className="w-4 h-4 mr-2 text-indigo-600" /> LinkedIn Profile
                                                    </Button>
                                                )}
                                                {reviewingApp?.profile?.resume_url && (
                                                    <Button variant="outline" size="sm" className="rounded-lg" onClick={() => window.open(reviewingApp.profile.resume_url, '_blank')}>
                                                        <FileText className="w-4 h-4 mr-2 text-rose-600" /> View Resume
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="mt-8">
                                        <CardHeader>
                                            <CardTitle>Volunteer Bio</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                                {reviewingApp?.profile?.description || "No biography provided."}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* TAB: EDUCATION */}
                                <TabsContent value="education" className="mt-0 outline-none">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Educational Background</CardTitle>
                                            <CardDescription>Highest qualification and graduation details.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Highest Degree / Qualification</Label>
                                                    <p className="text-sm font-semibold text-slate-700">{reviewingApp?.profile?.education_degree || "Not Provided"}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Institution / University</Label>
                                                    <p className="text-sm font-semibold text-slate-700">{reviewingApp?.profile?.education_institution || "Not Provided"}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Year of Graduation</Label>
                                                    <div>
                                                        <Badge variant="outline" className="border-slate-200 text-slate-500 font-bold px-2 py-0.5 rounded-full uppercase tracking-widest text-[9px]">
                                                            Class of {reviewingApp?.profile?.education_year}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* TAB: PROFESSIONAL */}
                                <TabsContent value="professional" className="mt-0 outline-none space-y-8">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Professional Details</CardTitle>
                                            <CardDescription>Work history and industrial expertise.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-8">
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Current Job Title</Label>
                                                    <p className="text-sm font-semibold text-slate-700">{reviewingApp?.profile?.job_title}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Employer / Company</Label>
                                                    <p className="text-sm font-semibold text-slate-700">{reviewingApp?.profile?.employer}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Industry Vertical</Label>
                                                    <p className="text-sm font-semibold text-slate-700">{reviewingApp?.profile?.industry_vertical}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Total Experience</Label>
                                                    <p className="text-sm font-semibold text-slate-700">{reviewingApp?.profile?.years_of_experience} Years, {reviewingApp?.profile?.months_of_experience} Months</p>
                                                </div>
                                            </div>

                                            <div className="pt-6 border-t space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <Target className="w-5 h-5 text-indigo-500" />
                                                    <h4 className="font-bold text-slate-900">Skill Portfolio</h4>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <Badge className="bg-indigo-600 text-white font-bold px-4 py-1.5 rounded-lg">{reviewingApp?.profile?.primary_skill_category}</Badge>
                                                    {reviewingApp?.profile?.secondary_skill_category && (
                                                        <Badge variant="outline" className="border-2 border-indigo-100 text-indigo-700 font-bold px-4 py-1.5 rounded-lg">{reviewingApp?.profile?.secondary_skill_category}</Badge>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="pt-6 border-t">
                                                <Label className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-2 block">Professional Narrative</Label>
                                                <p className="text-sm text-slate-700 leading-relaxed italic border-l-4 border-indigo-100 pl-4 py-1">
                                                    "{reviewingApp?.profile?.experience_description || "Professional narrative not provided."}"
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* TAB: AVAILABILITY */}
                                <TabsContent value="availability" className="mt-0 outline-none">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Availability & Commitment</CardTitle>
                                            <CardDescription>Commitment capacity and engagement mode.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-8">
                                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                {[
                                                    { label: "Commitment", value: reviewingApp?.profile?.commitment_type, icon: CalendarDays, color: "text-indigo-500" },
                                                    { label: "Hours / Week", value: reviewingApp?.profile?.hours_per_week, icon: Clock, color: "text-emerald-500" },
                                                    { label: "Mode", value: reviewingApp?.profile?.volunteer_mode, icon: MapPin, color: "text-amber-500" },
                                                    { label: "Start Date", value: reviewingApp?.profile?.start_time, icon: CalendarDays, color: "text-rose-500" }
                                                ].map((item, idx) => (
                                                    <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 flex flex-col items-center text-center space-y-2 hover:bg-white transition-all group">
                                                        <item.icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{item.label}</p>
                                                        <p className="text-xs font-semibold text-slate-700">{item.value || "Not Set"}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            {reviewingApp?.profile?.preferred_days && (
                                                <div className="p-4 rounded-xl border border-dashed text-center">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Preferred Days</p>
                                                    <p className="text-base font-bold text-slate-800 italic">"{reviewingApp?.profile?.preferred_days}"</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* TAB: SCREENING RESULTS */}
                                <TabsContent value="screening" className="mt-0 outline-none space-y-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                                                <Target className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-800 tracking-tight">Project Screening Breakdown</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Weighted Score: {reviewingApp?.screening_score || 0}% (Cutoff: {project.screening_cutoff_score || 75}%)</p>
                                            </div>
                                        </div>
                                        <Badge className={`px-4 py-1.5 rounded-lg text-sm font-black uppercase tracking-widest ${
                                            (reviewingApp?.screening_score || 0) >= (project.screening_cutoff_score || 75) ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                        }`}>
                                            {(reviewingApp?.screening_score || 0) >= (project.screening_cutoff_score || 75) ? 'QUALIFIED' : 'NOT QUALIFIED'}
                                        </Badge>
                                    </div>

                                    <div className="space-y-3">
                                        { (reviewingApp?.screening_results || []).map((result: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between p-4 bg-white border rounded-xl shadow-sm transition-all hover:border-indigo-200">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-full ${result.format === 'text' ? 'bg-indigo-50 text-indigo-600' : (result.passed ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')}`}>
                                                        {result.format === 'text' ? <FileText className="w-4 h-4" /> : (result.passed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />)}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-bold text-slate-800">{result.label}</p>
                                                            {result.format === 'text' && (
                                                                <Badge variant="outline" className="text-[9px] h-4 font-black uppercase tracking-widest border-indigo-200 text-indigo-600">Manual Review</Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-slate-400 font-medium">
                                                            Response: <span className="font-bold text-slate-600">"{result.actualValue || 'N/A'}"</span> 
                                                            {result.format !== 'text' && (
                                                                <> · Expected: <span className="font-bold text-slate-600">"{result.expectedValue}"</span></>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-sm font-black ${result.format === 'text' ? 'text-indigo-600' : (result.passed ? 'text-emerald-600' : 'text-slate-300')}`}>
                                                        {result.format === 'text' ? '---' : `+${result.impact}%`}
                                                    </p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Weight: {result.weight}%</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {reviewingApp?.status === 'rejected' && reviewingApp?.rejection_reason && (
                                        <div className="mt-8 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3">
                                            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-xs font-black text-rose-700 uppercase tracking-widest mb-1">Rejection Feedback</p>
                                                <p className="text-sm text-rose-800 font-medium">{reviewingApp.rejection_reason}</p>
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>

                                {/* TAB: QUESTIONNAIRE (Modular Onboarding) */}
                                <TabsContent value="questionnaire" className="mt-0 outline-none space-y-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                                            <BookOpen className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Onboarding Task Responses</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Modular Task Evaluation for {project.title}</p>
                                        </div>
                                    </div>
                                    
                                    {isLoadingResponses ? (
                                        <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                                            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest">Fetching task responses...</p>
                                        </div>
                                    ) : onboardingResponses && onboardingResponses.length > 0 ? (
                                        <div className="space-y-12">
                                            {onboardingResponses.map((module: any) => (
                                                <div key={module.id} className="space-y-6">
                                                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black">
                                                            {module.order_index}
                                                        </div>
                                                        <h4 className="font-black text-slate-900 uppercase tracking-widest text-sm">{module.title}</h4>
                                                    </div>
                                                    
                                                    <div className="grid gap-6">
                                                        {module.tasks.map((task: any) => (
                                                            <div key={task.id} className="pl-6 border-l-2 border-slate-100 space-y-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="p-1 bg-indigo-50 text-indigo-600 rounded">
                                                                        <ClipboardList className="w-3.5 h-3.5" />
                                                                    </div>
                                                                    <p className="text-xs font-bold text-slate-600">{task.title}</p>
                                                                </div>
                                                                
                                                                <div className="grid gap-3">
                                                                    {task.blocks.map((block: any) => (
                                                                        <div key={block.id} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{block.type} Question</p>
                                                                            <p className="text-sm font-bold text-slate-800 mb-3">{block.title || block.content?.replace(/<[^>]*>?/gm, '').substring(0, 100)}</p>
                                                                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-50">
                                                                                {typeof block.response === 'object' ? (
                                                                                    <pre className="text-xs font-medium text-slate-600">{JSON.stringify(block.response, null, 2)}</pre>
                                                                                ) : (
                                                                                    <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                                                                                        "{block.response || "No response provided."}"
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="bg-slate-50 rounded-3xl p-16 text-center border-2 border-dashed border-slate-200">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">No Modular Onboarding Responses Found</p>
                                            <p className="text-xs text-slate-500 max-w-xs mx-auto">This usually means the volunteer hasn't completed any interactive tasks yet, or the project uses screening questions only.</p>
                                        </div>
                                    )}
                                </TabsContent>

                                {/* TAB: DECISION */}
                                <TabsContent value="decision" className="mt-0 outline-none">
                                    <div className="pt-6 pb-20">
                                        <Card className="max-w-2xl mx-auto border-indigo-100 shadow-lg shadow-indigo-600/5">
                                            <CardHeader className="text-center pb-2">
                                                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 mx-auto mb-4">
                                                    <Target className="w-6 h-6" />
                                                </div>
                                                <CardTitle className="text-xl font-bold text-slate-900">Final Application Decision</CardTitle>
                                                <CardDescription className="text-xs uppercase tracking-wider font-bold">Review carefully before finalizing</CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-8">
                                                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-4 rounded-xl bg-slate-50 border border-slate-100">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Application Status</p>
                                                        <p className="text-base font-bold text-indigo-600">{reviewingApp?.status === 'pending' ? 'Review Required' : reviewingApp?.status?.toUpperCase()}</p>
                                                    </div>
                                                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                                        {reviewingApp?.status === 'pending_screening' && (
                                                            <>
                                                                <Button 
                                                                    variant="outline"
                                                                    className="text-rose-600 border-rose-100 hover:bg-rose-50 font-bold uppercase tracking-wider text-[10px] px-6 h-10 rounded-lg" 
                                                                    onClick={() => { handleUpdateStatus(reviewingApp.id, 'rejected', true); setReviewingApp(null); }}
                                                                >
                                                                    Reject
                                                                </Button>
                                                                <Button 
                                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-wider text-[10px] px-8 h-10 shadow-md shadow-indigo-600/10 rounded-lg" 
                                                                    onClick={() => { handleUpdateStatus(reviewingApp.id, 'approved'); setReviewingApp(null); }}
                                                                >
                                                                    Approve Screening
                                                                </Button>
                                                            </>
                                                        )}
                                                        {reviewingApp?.status === 'pending' && (
                                                            <>
                                                                <Button 
                                                                    variant="outline"
                                                                    className="text-rose-600 border-rose-100 hover:bg-rose-50 font-bold uppercase tracking-wider text-[10px] px-6 h-10 rounded-lg" 
                                                                    onClick={() => { handleUpdateStatus(reviewingApp.id, 'rejected', true); setReviewingApp(null); }}
                                                                >
                                                                    Reject
                                                                </Button>
                                                                <Button 
                                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider text-[10px] px-8 h-10 shadow-md shadow-emerald-600/10 rounded-lg" 
                                                                    onClick={() => { handleUpdateStatus(reviewingApp.id, 'approved'); setReviewingApp(null); }}
                                                                >
                                                                    Final Approve & Assign
                                                                </Button>
                                                            </>
                                                        )}
                                                        {reviewingApp?.status === 'approved' && (
                                                            <Button 
                                                                variant="outline" 
                                                                className="text-rose-600 border-rose-200 hover:bg-rose-50 font-bold uppercase tracking-wider text-[10px] px-8 h-10 rounded-lg flex-1" 
                                                                onClick={() => { setRemovingApp(reviewingApp); setReviewingApp(null); }}
                                                            >
                                                                Remove from Project
                                                            </Button>
                                                        )}
                                                        {reviewingApp?.status === 'rejected' && (
                                                            <Button 
                                                                variant="outline" 
                                                                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 font-bold uppercase tracking-wider text-[10px] px-8 h-10 rounded-lg flex-1" 
                                                                onClick={() => { handleUpdateStatus(reviewingApp.id, 'approved'); setReviewingApp(null); }}
                                                            >
                                                                Reconsider & Approve
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

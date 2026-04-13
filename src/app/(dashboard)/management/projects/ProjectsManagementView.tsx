"use client";

import { useState, useEffect } from "react";
import { getProjects, upsertProject, deleteProject, duplicateProject } from "@/app/actions/project-actions";
import { getDepartments } from "@/app/actions/general-onboarding-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { 
    Briefcase, Plus, Users, Search, Edit2, Trash2, Settings, 
    CheckCircle2, XCircle, Target, ChevronDown, ChevronUp, Copy, Loader2
} from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserContext } from "@/contexts/user-context";

export default function ProjectsManagementView() {
    const [projects, setProjects] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [editingProject, setEditingProject] = useState<any | null>(null);
    const user = useUserContext();
    const isReadOnly = user?.role === "Operations";

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            getDepartments().then(deptData => {
                setDepartments(deptData || []);
            }).catch(e => {
                console.error("Failed to load departments:", e);
                setDepartments([]);
            });

            const projData = await getProjects();
            setProjects(projData);
        } catch (error: any) {
            toast.error("Error loading projects", { description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editingProject?.title) return toast.error("Title is required");
        try {
            await upsertProject({
                id: editingProject.id,
                title: editingProject.title,
                description: editingProject.description,
                department_id: editingProject.department_id || null,
                volunteers_needed: editingProject.volunteers_needed || 1,
                impact_tier: editingProject.impact_tier || "Community",
                status: editingProject.status || "draft",
                screening_criteria: editingProject.screening_criteria || [],
                screening_cutoff_score: editingProject.screening_cutoff_score || 75,
                screening_questions: (editingProject.screening_criteria || [])
                    .filter((c: any) => c.type === 'manual')
                    .map((c: any) => c.label)
            });
            toast.success("Project saved successfully");
            setEditingProject(null);
            loadData();
        } catch (e: any) {
            toast.error("Error saving project", { description: e.message });
        }
    };

    const handleDelete = async (id: string) => {
        toast("Are you sure? This will delete the project and all related applications.", {
            action: {
                label: "Delete",
                onClick: async () => {
                    try {
                        await deleteProject(id);
                        toast.success("Project deleted");
                        loadData();
                    } catch (e: any) {
                        toast.error("Error deleting project", { description: e.message });
                    }
                },
            },
        });
    };
    const handleDuplicate = async (id: string) => {
        try {
            toast.loading("Duplicating project...");
            await duplicateProject(id);
            toast.dismiss();
            toast.success("Project duplicated successfully");
            loadData();
        } catch (e: any) {
            toast.dismiss();
            toast.error("Error duplicating project", { description: e.message });
        }
    };

    const filtered = projects.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <div className="relative overflow-hidden rounded-lg bg-slate-50 dark:bg-zinc-900/50 p-4 md:p-6 border border-slate-200 dark:border-zinc-800 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                            <Briefcase className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Project Management</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                                Create and manage functional pieces of work that require volunteer support.
                            </p>
                        </div>
                    </div>
                    {!isReadOnly && (
                        <Button 
                            className="w-fit gap-2 bg-indigo-600 hover:bg-indigo-700 text-white" 
                            onClick={() => setEditingProject({ volunteers_needed: 1, status: "draft", impact_tier: "Community" })}
                        >
                            <Plus className="w-4 h-4" /> Add Project
                        </Button>
                    )}
                </div>
            </div>

            {editingProject && (
                <Card className="border-indigo-200 bg-indigo-50/10 animate-in fade-in slide-in-from-top-4 duration-300">
                    <CardHeader>
                        <CardTitle>{editingProject.id ? "Edit Project" : "New Project"}</CardTitle>
                        <CardDescription>Configure project requirements and details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700">Project Title</label>
                                <Input
                                    value={editingProject.title || ''}
                                    onChange={e => setEditingProject({ ...editingProject, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700">Department</label>
                                <Select
                                    value={editingProject.department_id || "none"}
                                    onValueChange={(val) => setEditingProject({ ...editingProject, department_id: val === "none" ? null : val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- No Department (General) --</SelectItem>
                                        {departments.map((d: any) => (
                                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-bold text-slate-700">Description</label>
                                <Textarea
                                    rows={3}
                                    value={editingProject.description || ''}
                                    onChange={e => setEditingProject({ ...editingProject, description: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2 border p-3 rounded-lg">
                                <label className="text-xs font-bold text-slate-700 block mb-1">Volunteers Needed</label>
                                <Input
                                    type="number"
                                    value={editingProject.volunteers_needed}
                                    onChange={e => setEditingProject({ ...editingProject, volunteers_needed: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2 border p-3 rounded-lg">
                                <label className="text-xs font-bold text-slate-700 flex justify-between">
                                    <span>Status</span>
                                </label>
                                <Select
                                    value={editingProject.status || "draft"}
                                    onValueChange={(val) => setEditingProject({ ...editingProject, status: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="published">Published (Visible to Volunteers)</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="archived">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Screening Setup Section */}
                        <div className="mt-8 pt-8 border-t border-indigo-100">
                            <div className="flex items-center gap-2 mb-4">
                                <Target className="w-5 h-5 text-indigo-600" />
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Screening & Auto-Approval Setup</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                <div className="p-4 bg-white border border-indigo-100 rounded-xl shadow-sm">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Cutoff Score (%)</label>
                                    <div className="flex items-center gap-3">
                                        <Input 
                                            type="number" 
                                            min="0" max="100" 
                                            value={editingProject.screening_cutoff_score || 75} 
                                            onChange={e => setEditingProject({ ...editingProject, screening_cutoff_score: parseInt(e.target.value) })}
                                            className="font-bold text-lg text-indigo-600"
                                        />
                                        <div className="text-[10px] text-slate-400 font-medium leading-tight">
                                            Volunteers scoring above this will move to Stage 2: Onboarding.
                                        </div>
                                    </div>
                                </div>
                                <div className="md:col-span-2 p-4 bg-indigo-50/50 border border-dashed border-indigo-200 rounded-xl flex items-center gap-4">
                                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                        <Target className="w-5 h-5" />
                                    </div>
                                    <div className="text-xs text-indigo-800">
                                        <p className="font-bold mb-1">Total Criteria Weight: { (editingProject.screening_criteria || []).reduce((acc: number, c: any) => acc + (c.weight || 0), 0) }%</p>
                                        <p className="opacity-70">Ensure your weights add up to 100% for accurate scoring.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-bold text-slate-700">Evaluation Criteria</label>
                                    <div className="flex gap-2">
                                        <Button 
                                            variant="outline" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-wider gap-1 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                            onClick={() => {
                                                const crit = editingProject.screening_criteria || [];
                                                setEditingProject({
                                                    ...editingProject,
                                                    screening_criteria: [...crit, { type: 'manual', format: 'dropdown', label: 'New Question?', expectedValue: 'Yes', weight: 25 }]
                                                });
                                            }}
                                        >
                                            <Plus className="w-3 h-3" /> Add Screening Question
                                        </Button>
                                    </div>
                                </div>

                                { (editingProject.screening_criteria || []).map((c: any, idx: number) => (
                                    <div key={idx} className="flex flex-col md:flex-row gap-3 p-4 bg-white border rounded-xl items-start md:items-center group relative animate-in slide-in-from-left-2 transition-all shadow-sm hover:shadow-md">
                                        <div className={`p-1.5 rounded-lg ${c.type === 'profile' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                            {c.type === 'profile' ? <Users className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                                        </div>
                                        
                                        <div className="flex-1 space-y-2 md:space-y-0 md:flex md:items-center md:gap-3 w-full">
                                            <Input 
                                                value={c.label} 
                                                onChange={e => {
                                                    const crit = [...editingProject.screening_criteria];
                                                    crit[idx].label = e.target.value;
                                                    setEditingProject({ ...editingProject, screening_criteria: crit });
                                                }}
                                                placeholder="Screening Question"
                                                className="h-8 text-sm font-semibold"
                                            />
                                            
                                            <div className="flex flex-col gap-2 w-full md:w-auto">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Format:</span>
                                                <Select 
                                                    value={c.format || 'dropdown'} 
                                                    onValueChange={v => {
                                                        const crit = [...editingProject.screening_criteria];
                                                        crit[idx].format = v;
                                                        // Reset expected value if switching to text
                                                        if (v === 'text') crit[idx].expectedValue = 'Manual Review';
                                                        setEditingProject({ ...editingProject, screening_criteria: crit });
                                                    }}
                                                >
                                                    <SelectTrigger className="h-8 w-28 text-[10px] font-bold">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="dropdown">Dropdown</SelectItem>
                                                        <SelectItem value="text">Short Answer</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="flex items-center gap-2 w-full md:w-auto">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">{c.format === 'text' ? 'Hint:' : 'Expected:'}</span>
                                                <Input 
                                                    value={c.expectedValue} 
                                                    disabled={c.format === 'text'}
                                                    onChange={e => {
                                                        const crit = [...editingProject.screening_criteria];
                                                        crit[idx].expectedValue = e.target.value;
                                                        setEditingProject({ ...editingProject, screening_criteria: crit });
                                                    }}
                                                    placeholder={c.format === 'text' ? 'Manual Review' : 'Expected'}
                                                    className="h-8 text-xs w-24"
                                                />
                                            </div>

                                            <div className="flex items-center gap-2 w-full md:w-auto">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase text-right md:w-16">Weight %</span>
                                                <Input 
                                                    type="number"
                                                    value={c.weight} 
                                                    onChange={e => {
                                                        const crit = [...editingProject.screening_criteria];
                                                        crit[idx].weight = parseInt(e.target.value);
                                                        setEditingProject({ ...editingProject, screening_criteria: crit });
                                                    }}
                                                    className="h-8 text-xs w-16 font-bold"
                                                />
                                            </div>
                                        </div>

                                        <Button 
                                            variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-rose-600 transition-colors"
                                            onClick={() => {
                                                const crit = editingProject.screening_criteria.filter((_: any, i: number) => i !== idx);
                                                setEditingProject({ ...editingProject, screening_criteria: crit });
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}

                                {(!editingProject.screening_criteria || editingProject.screening_criteria.length === 0) && (
                                    <div className="py-8 text-center border-2 border-dashed rounded-xl bg-slate-50/50">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No screening criteria configured. All volunteers will move to Stage 2 by default.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="gap-2">
                        <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">Save Project</Button>
                        <Button variant="ghost" onClick={() => setEditingProject(null)}>Cancel</Button>
                    </CardFooter>
                </Card>
            )}

            <div className="border rounded-md bg-white dark:bg-zinc-950/50 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="px-6">Project Title</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Spots</TableHead>
                            <TableHead className="text-right px-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length > 0 ? (
                            filtered.map((proj) => (
                                <TableRow key={proj.id}>
                                    <TableCell className="font-bold px-6">{proj.title}</TableCell>
                                    <TableCell className="text-sm text-slate-600">{proj.department?.name || 'General'}</TableCell>
                                    <TableCell>
                                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                                            proj.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 
                                            proj.status === 'draft' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                                        }`}>
                                            {proj.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">{proj.volunteers_needed}</TableCell>
                                    <TableCell className="text-right flex items-center justify-end gap-1 px-6">
                                        <Button variant="outline" size="sm" asChild className="gap-1 mr-2 bg-slate-50 text-slate-700 font-bold border-slate-200">
                                            <Link href={`/management/projects/${proj.id}`}>
                                                {isReadOnly ? <Search className="w-3.5 h-3.5" /> : <Settings className="w-3.5 h-3.5" />}
                                                {isReadOnly ? "View Details" : "Manage View"}
                                            </Link>
                                        </Button>
                                        {!isReadOnly && (
                                            <>
                                                <Button variant="ghost" size="icon" onClick={() => setEditingProject({ ...proj, department_id: proj.department?.id })}>
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" title="Duplicate Project" onClick={() => handleDuplicate(proj.id)}>
                                                    <Copy className="w-4 h-4 text-indigo-500" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-rose-500 mb:text-rose-600" onClick={() => handleDelete(proj.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                                    No projects found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

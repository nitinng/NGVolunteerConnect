"use client";

import { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@/lib/supabase";
import { getAllNonVolunteers, addTicketAssignee, removeTicketAssignee } from "@/app/actions/supabase-actions";
import { 
    Settings, Plus, Trash2, Layers, AlertTriangle, Save,
    Info, UserCheck, UserPlus, CheckCircle2, Search,
    ChevronLeft, ChevronRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const PAGE_SIZE = 10;

export default function TicketingSettingsPage() {
    const supabase = createBrowserClient();

    const [categories, setCategories] = useState<string[]>([]);
    const [newCategory, setNewCategory] = useState("");
    const [priorities, setPriorities] = useState<{name: string, color: string}[]>([]);
    const [newPriority, setNewPriority] = useState("");

    // Assignable Staff
    const [allCandidates, setAllCandidates] = useState<any[]>([]);
    const [assignees, setAssignees] = useState<string[]>([]);
    const [isLoadingStaff, setIsLoadingStaff] = useState(true);
    const [savingStaffId, setSavingStaffId] = useState<string | null>(null);
    const [staffSearch, setStaffSearch] = useState("");
    const [staffPage, setStaffPage] = useState(1);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        const fetchConfig = async () => {
            setIsLoading(true);
            try {
                const { data: cats } = await supabase.from('ticket_categories').select('name').order('name');
                const { data: pris } = await supabase.from('ticket_priorities').select('name').order('name');
                if (cats) setCategories(cats.map((c: any) => c.name));
                if (pris) setPriorities(pris.map((p: any) => ({ 
                    name: p.name, 
                    color: p.name === 'High' ? "text-rose-500 border-rose-200" : 
                           p.name === 'Medium' ? "text-amber-500 border-amber-200" : 
                           "text-slate-500 border-slate-200"
                })));
            } catch (error) {
                console.error("Failed to fetch ticketing config:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchConfig();
    }, [supabase]);

    useEffect(() => {
        const fetchStaff = async () => {
            setIsLoadingStaff(true);
            try {
                const candidates = await getAllNonVolunteers();
                setAllCandidates(candidates);
                const { data: saved } = await supabase.from("ticket_assignees").select("profile_id");
                if (saved) setAssignees(saved.map((r: any) => r.profile_id));
            } catch (error: any) {
                console.error("Failed to fetch staff:", error.message || error);
            } finally {
                setIsLoadingStaff(false);
            }
        };
        fetchStaff();
    }, [supabase]);

    // Filtered + paginated staff list
    const filteredCandidates = useMemo(() => {
        const q = staffSearch.toLowerCase();
        return allCandidates.filter(p =>
            p.full_name?.toLowerCase().includes(q) ||
            p.email?.toLowerCase().includes(q) ||
            p.role?.toLowerCase().includes(q)
        );
    }, [allCandidates, staffSearch]);

    const totalPages = Math.max(1, Math.ceil(filteredCandidates.length / PAGE_SIZE));
    const pagedCandidates = filteredCandidates.slice((staffPage - 1) * PAGE_SIZE, staffPage * PAGE_SIZE);

    const handleStaffSearch = (val: string) => {
        setStaffSearch(val);
        setStaffPage(1);
    };

    const handleToggleAssignee = async (profileId: string) => {
        setSavingStaffId(profileId);
        try {
            if (assignees.includes(profileId)) {
                await removeTicketAssignee(profileId);
                setAssignees(assignees.filter(id => id !== profileId));
            } else {
                await addTicketAssignee(profileId);
                setAssignees([...assignees, profileId]);
            }
        } catch (error: any) {
            console.error("Failed to update assignee:", error.message);
        } finally {
            setSavingStaffId(null);
        }
    };

    const handleAddCategory = async () => {
        if (!newCategory.trim() || categories.includes(newCategory.trim())) return;
        const name = newCategory.trim();
        const { error } = await supabase.from('ticket_categories').insert({ name });
        if (error) { console.error("Failed to add category:", error); return; }
        setCategories([...categories, name]);
        setNewCategory("");
    };

    const handleRemoveCategory = async (name: string) => {
        const { error } = await supabase.from('ticket_categories').delete().eq('name', name);
        if (error) { console.error("Failed to remove category:", error); return; }
        setCategories(categories.filter(c => c !== name));
    };

    const handleAddPriority = async () => {
        if (!newPriority.trim() || priorities.find(p => p.name === newPriority.trim())) return;
        const name = newPriority.trim();
        const { error } = await supabase.from('ticket_priorities').insert({ name });
        if (error) { console.error("Failed to add priority:", error); return; }
        setPriorities([...priorities, { name, color: "text-indigo-500 border-indigo-200" }]);
        setNewPriority("");
    };

    const handleRemovePriority = async (name: string) => {
        const { error } = await supabase.from('ticket_priorities').delete().eq('name', name);
        if (error) { console.error("Failed to remove priority:", error); return; }
        setPriorities(priorities.filter(p => p.name !== name));
    };

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        }, 500);
    };

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="relative overflow-hidden rounded-lg bg-white dark:bg-zinc-900/50 p-4 md:p-6 border border-slate-200 dark:border-zinc-800 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                            <Settings className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Ticketing Settings</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Configure categories, priorities, and manage who can be assigned to tickets.</p>
                        </div>
                    </div>
                    <Button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        {isSaving ? (
                            <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</span>
                        ) : saveSuccess ? (
                            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Saved!</span>
                        ) : (
                            <span className="flex items-center gap-2"><Save className="w-4 h-4" /> Save Configuration</span>
                        )}
                    </Button>
                </div>
            </div>

            {/* Categories + Priorities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900/40 shadow-sm">
                    <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b border-slate-100 dark:border-white/5 pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg"><Layers className="w-5 h-5 text-indigo-500" />Ticket Categories</CardTitle>
                        <CardDescription>Define the issue types volunteers can select.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex gap-2">
                            <Input placeholder="New category name..." value={newCategory} onChange={(e) => setNewCategory(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()} />
                            <Button onClick={handleAddCategory} variant="secondary" className="shrink-0"><Plus className="w-4 h-4 mr-1"/>Add</Button>
                        </div>
                        <div className="space-y-2 mt-4">
                            {categories.map((cat, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 group">
                                    <span className="font-medium text-sm text-slate-800 dark:text-slate-200">{cat}</span>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-rose-500 hover:bg-rose-50" onClick={() => handleRemoveCategory(cat)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900/40 shadow-sm">
                    <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b border-slate-100 dark:border-white/5 pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg"><AlertTriangle className="w-5 h-5 text-amber-500" />Priority Levels</CardTitle>
                        <CardDescription>Configure the urgency flags for tickets.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex gap-2">
                            <Input placeholder="New priority level..." value={newPriority} onChange={(e) => setNewPriority(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddPriority()} />
                            <Button onClick={handleAddPriority} variant="secondary" className="shrink-0"><Plus className="w-4 h-4 mr-1"/>Add</Button>
                        </div>
                        <div className="space-y-2 mt-4">
                            {priorities.map((pri, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 group">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className={`text-[10px] ${pri.color}`}>{pri.name} Priority</Badge>
                                        <span className="font-medium text-sm text-slate-800 dark:text-slate-200">{pri.name}</span>
                                    </div>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-rose-500 hover:bg-rose-50" onClick={() => handleRemovePriority(pri.name)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Assignable Staff — Searchable Paginated Table */}
            <Card className="border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900/40 shadow-sm">
                <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b border-slate-100 dark:border-white/5 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <UserCheck className="w-5 h-5 text-emerald-500" />
                                Assignable Staff
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Select which staff members appear in the "Assigned To" dropdown on tickets.
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 self-start whitespace-nowrap">
                            {assignees.length} of {allCandidates.length} enabled
                        </Badge>
                    </div>

                    {/* Search */}
                    <div className="relative mt-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search by name, email, or role..."
                            className="pl-9 bg-white dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-700"
                            value={staffSearch}
                            onChange={(e) => handleStaffSearch(e.target.value)}
                        />
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {isLoadingStaff ? (
                        <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
                            <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                            <span className="text-sm">Loading staff users...</span>
                        </div>
                    ) : allCandidates.length === 0 ? (
                        <div className="text-center py-16 text-slate-400">
                            <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            <p className="text-sm font-medium">No non-volunteer users found.</p>
                            <p className="text-xs mt-1">Assign roles other than "Volunteer" in Supabase Auth to see them here.</p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader className="bg-slate-50/30 dark:bg-zinc-900/10">
                                    <TableRow className="border-slate-100 dark:border-white/5 hover:bg-transparent">
                                        <TableHead className="pl-6 font-bold text-slate-700 dark:text-slate-300 w-[35%]">Name</TableHead>
                                        <TableHead className="font-bold text-slate-700 dark:text-slate-300 w-[30%]">Email</TableHead>
                                        <TableHead className="font-bold text-slate-700 dark:text-slate-300 w-[15%]">Role</TableHead>
                                        <TableHead className="font-bold text-slate-700 dark:text-slate-300 w-[10%] text-center">Status</TableHead>
                                        <TableHead className="pr-6 text-right font-bold text-slate-700 dark:text-slate-300 w-[10%]">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {pagedCandidates.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-12 text-slate-400 text-sm">
                                                No results for &quot;{staffSearch}&quot;
                                            </TableCell>
                                        </TableRow>
                                    ) : pagedCandidates.map((person) => {
                                        const isEnabled = assignees.includes(person.id);
                                        const isSavingThis = savingStaffId === person.id;
                                        return (
                                            <TableRow key={person.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-900/40 transition-colors">
                                                <TableCell className="pl-6 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${isEnabled ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-500"}`}>
                                                            {person.full_name?.charAt(0)?.toUpperCase() || "?"}
                                                        </div>
                                                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{person.full_name || "Unnamed"}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-slate-500 py-3">{person.email}</TableCell>
                                                <TableCell className="py-3">
                                                    <Badge variant="outline" className="text-[10px] px-2 border-slate-200 text-slate-500 dark:border-zinc-700">{person.role}</Badge>
                                                </TableCell>
                                                <TableCell className="py-3 text-center">
                                                    {isEnabled ? (
                                                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 shadow-none text-[10px]">Enabled</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-slate-400 border-slate-200 text-[10px]">Disabled</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="pr-6 text-right py-3">
                                                    <Button
                                                        size="sm"
                                                        variant={isEnabled ? "outline" : "secondary"}
                                                        className={`h-7 text-xs font-semibold min-w-[72px] transition-all ${
                                                            isEnabled 
                                                                ? "border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 dark:hover:bg-rose-950/20" 
                                                                : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0 dark:bg-emerald-900/30 dark:text-emerald-300"
                                                        }`}
                                                        onClick={() => !isSavingThis && handleToggleAssignee(person.id)}
                                                        disabled={isSavingThis}
                                                    >
                                                        {isSavingThis ? (
                                                            <div className="w-3 h-3 border border-current/30 border-t-current rounded-full animate-spin" />
                                                        ) : isEnabled ? "Remove" : "Enable"}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 dark:border-white/5">
                                <p className="text-xs text-slate-500">
                                    Showing {filteredCandidates.length === 0 ? 0 : (staffPage - 1) * PAGE_SIZE + 1}–{Math.min(staffPage * PAGE_SIZE, filteredCandidates.length)} of {filteredCandidates.length} users
                                </p>
                                <div className="flex items-center gap-1">
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-500" disabled={staffPage === 1} onClick={() => setStaffPage(p => Math.max(1, p - 1))}>
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <span className="text-xs text-slate-500 px-2 font-medium">Page {staffPage} of {totalPages}</span>
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-500" disabled={staffPage === totalPages} onClick={() => setStaffPage(p => Math.min(totalPages, p + 1))}>
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Info Banner */}
            <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 dark:border-indigo-900/30 dark:bg-indigo-900/10 flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div className="text-sm text-indigo-800 dark:text-indigo-300">
                    <p className="font-semibold mb-1">How assignees work</p>
                    <p>Only staff enabled here will appear in the "Assigned To" dropdown when managing tickets. Changes take effect immediately — no save required for assignees.</p>
                </div>
            </div>
        </div>
    );
}

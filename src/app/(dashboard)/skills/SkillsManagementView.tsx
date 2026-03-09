"use client";

import { useState, useMemo } from "react";
import {
    SKILLS_CONFIG,
    SkillCategory,
    SkillRole,
    OnboardingTask,
    TaskType,
    TaskStatus
} from "@/lib/skills-config";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Badge
} from "@/components/ui/badge";
import {
    Plus,
    Trash2,
    Edit2,
    MoreHorizontal,
    Search,
    Filter,
    LayoutGrid,
    CheckCircle2,
    Clock,
    AlertCircle
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function SkillsManagementView() {
    const [config, setConfig] = useState(SKILLS_CONFIG);

    // Search/Filters
    const [searchTerm, setSearchTerm] = useState("");

    // Modals
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<SkillCategory | null>(null);

    const [isSubCatModalOpen, setIsSubCatModalOpen] = useState(false);
    const [editingSubCat, setEditingSubCat] = useState<{ catKey: string, role: SkillRole } | null>(null);

    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<{
        task: OnboardingTask,
        assignments: { catKey: string, roleId: string }[]
    } | null>(null);

    // Flatten data for easier table access
    const categoryList = useMemo(() => Object.values(config), [config]);

    const subCategoryList = useMemo(() => {
        return Object.entries(config).flatMap(([catKey, cat]) =>
            cat.roles.map(role => ({ ...role, catKey, catTitle: cat.title }))
        );
    }, [config]);

    const allTasksList = useMemo(() => {
        const taskMap = new Map<string, any>();

        Object.entries(config).forEach(([catKey, cat]) => {
            cat.roles.forEach(role => {
                role.tasks.forEach(task => {
                    if (!taskMap.has(task.id)) {
                        taskMap.set(task.id, {
                            ...task,
                            assignments: []
                        });
                    }
                    taskMap.get(task.id).assignments.push({
                        catKey,
                        catTitle: cat.title,
                        roleId: role.id,
                        roleName: role.name
                    });
                });
            });
        });

        return Array.from(taskMap.values());
    }, [config]);

    // --- Handlers ---

    const saveCategory = () => {
        if (!editingCategory) return;
        if (!editingCategory.title || !editingCategory.key) {
            toast.error("Title and Key are required");
            return;
        }

        setConfig(prev => {
            // If editing existing, we might need to update the key name in the record if title changed
            // But let's assume title is the unique key for now as per SKILLS_CONFIG structure
            return {
                ...prev,
                [editingCategory.title]: editingCategory
            };
        });

        setIsCategoryModalOpen(false);
        setEditingCategory(null);
        toast.success("Category updated");
    };

    const deleteCategory = (catKey: string) => {
        if (!confirm(`Delete category? All sub-categories and tasks will be lost.`)) return;
        setConfig(prev => {
            const next = { ...prev };
            delete next[catKey];
            return next;
        });
        toast.success("Category deleted");
    };

    const saveSubCat = () => {
        if (!editingSubCat) return;
        const { catKey, role } = editingSubCat;

        setConfig(prev => {
            const cat = prev[catKey];
            const exists = cat.roles.some(r => r.id === role.id);
            const updatedRoles = exists
                ? cat.roles.map(r => r.id === role.id ? role : r)
                : [...cat.roles, role];

            return {
                ...prev,
                [catKey]: { ...cat, roles: updatedRoles }
            };
        });

        setIsSubCatModalOpen(false);
        setEditingSubCat(null);
        toast.success("Sub-category updated");
    };

    const deleteSubCat = (catKey: string, roleId: string) => {
        if (!confirm("Delete this sub-category?")) return;
        setConfig(prev => {
            const cat = prev[catKey];
            return {
                ...prev,
                [catKey]: { ...cat, roles: cat.roles.filter(r => r.id !== roleId) }
            };
        });
        toast.success("Sub-category deleted");
    };

    const saveTask = () => {
        if (!editingTask) return;
        const { task, assignments } = editingTask;

        if (assignments.length === 0) {
            toast.error("At least one assignment (Category + Sub-role) is required");
            return;
        }

        setConfig(prev => {
            const next = { ...prev };

            // 1. Remove task from EVERYWHERE it might exist currently
            Object.keys(next).forEach(ck => {
                next[ck] = {
                    ...next[ck],
                    roles: next[ck].roles.map(r => ({
                        ...r,
                        tasks: r.tasks.filter(t => t.id !== task.id)
                    }))
                };
            });

            // 2. Add task to selected assignments
            assignments.forEach(ass => {
                const cat = next[ass.catKey];
                if (!cat) return;
                const roleIdx = cat.roles.findIndex(r => r.id === ass.roleId);
                if (roleIdx === -1) return;

                const role = cat.roles[roleIdx];
                // Deep copy to avoid reference issues
                cat.roles[roleIdx] = {
                    ...role,
                    tasks: [...role.tasks, { ...task }]
                };
            });

            return next;
        });

        setIsTaskModalOpen(false);
        setEditingTask(null);
        toast.success("Task synchronized across categories");
    };

    const deleteTask = (taskId: string) => {
        if (!confirm("Delete this task from all assigned categories?")) return;
        setConfig(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(ck => {
                next[ck] = {
                    ...next[ck],
                    roles: next[ck].roles.map(r => ({
                        ...r,
                        tasks: r.tasks.filter(t => t.id !== taskId)
                    }))
                };
            });
            return next;
        });
        toast.success("Task globally removed");
    };

    const getStatusBadge = (status: TaskStatus) => {
        switch (status) {
            case "published": return <Badge className="bg-emerald-500 hover:bg-emerald-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Published</Badge>;
            case "draft": return <Badge variant="outline" className="text-slate-500 border-slate-300"><Clock className="w-3 h-3 mr-1" /> Draft</Badge>;
            case "on-hold": return <Badge variant="destructive" className="bg-amber-500 hover:bg-amber-600"><AlertCircle className="w-3 h-3 mr-1" /> On Hold</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-var(--header-height)-1rem)] p-4 md:p-6 max-w-[1400px] mx-auto w-full overflow-hidden">
            {/* Header - Reduced Size */}
            <div className="flex justify-between items-start mb-6 shrink-0">
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Onboarding & Skills CMS</h1>
                    <p className="text-sm text-muted-foreground">Architect the journey for our student community.</p>
                </div>
            </div>

            <Tabs defaultValue="tasks" className="flex-1 flex flex-col min-h-0">
                <div className="flex justify-between items-center mb-4">
                    <TabsList className="bg-slate-100 dark:bg-zinc-900/50 p-1">
                        <TabsTrigger value="categories" className="text-xs px-4">Categories</TabsTrigger>
                        <TabsTrigger value="subcategories" className="text-xs px-4">Sub-Categories</TabsTrigger>
                        <TabsTrigger value="tasks" className="text-xs px-4">Tasks</TabsTrigger>
                    </TabsList>

                    <div className="flex gap-2">
                        <div className="relative group">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search everything..."
                                className="pl-9 w-[250px] h-9 text-sm"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Categories Tab */}
                <TabsContent value="categories" className="flex-1 min-h-0 bg-white dark:bg-zinc-950 border rounded-xl shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b flex justify-between items-center bg-slate-50/50 dark:bg-zinc-900/20">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Skill Categories</h3>
                        <Button size="sm" className="bg-slate-950 hover:bg-slate-900 border-none text-white" onClick={() => { setEditingCategory({ id: `cat_${Date.now()}`, title: "", key: "", roles: [] }); setIsCategoryModalOpen(true); }}>
                            <Plus className="w-4 h-4 mr-2" /> Add Category
                        </Button>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/80 dark:bg-zinc-900/40 sticky top-0 z-10">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[120px] text-xs font-bold border-r px-6">ID</TableHead>
                                    <TableHead className="text-xs font-bold border-r px-6">Title</TableHead>
                                    <TableHead className="text-xs font-bold border-r px-6">Internal Key</TableHead>
                                    <TableHead className="text-xs font-bold text-center border-r px-6">Sub-Roles</TableHead>
                                    <TableHead className="w-[100px] text-right text-xs font-bold px-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categoryList.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase())).map((cat) => (
                                    <TableRow key={cat.id} className="group hover:bg-slate-50/50 dark:hover:bg-zinc-900/30">
                                        <TableCell className="font-mono text-[11px] text-muted-foreground border-r px-6">{cat.id}</TableCell>
                                        <TableCell className="font-bold text-sm border-r px-6">{cat.title}</TableCell>
                                        <TableCell className="border-r px-6"><code className="text-[11px] bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{cat.key}</code></TableCell>
                                        <TableCell className="text-center border-r px-6">
                                            <Badge variant="secondary" className="font-mono">{cat.roles.length}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => { setEditingCategory({ ...cat }); setIsCategoryModalOpen(true); }}><Edit2 className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => deleteCategory(cat.title)} className="text-rose-500"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                {/* Sub-Categories Tab */}
                <TabsContent value="subcategories" className="flex-1 min-h-0 bg-white dark:bg-zinc-950 border rounded-xl shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b flex justify-between items-center bg-slate-50/50 dark:bg-zinc-900/20">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Skill Sub-Roles</h3>
                        <Button size="sm" className="bg-slate-950 hover:bg-slate-900 border-none text-white shadow-sm" onClick={() => {
                            const firstCat = Object.keys(config)[0];
                            setEditingSubCat({ catKey: firstCat, role: { id: `role_${Date.now()}`, name: "New Sub-Role", tasks: [] } });
                            setIsSubCatModalOpen(true);
                        }}>
                            <Plus className="w-4 h-4 mr-2" /> Add Sub-Category
                        </Button>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/80 dark:bg-zinc-900/40 sticky top-0 z-10">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[120px] text-xs font-bold border-r px-6">Role ID</TableHead>
                                    <TableHead className="text-xs font-bold border-r px-6">Sub-Category</TableHead>
                                    <TableHead className="text-xs font-bold border-r px-6">Main Category</TableHead>
                                    <TableHead className="text-xs font-bold text-center border-r px-6">Tasks</TableHead>
                                    <TableHead className="w-[100px] text-right text-xs font-bold px-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {subCategoryList.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map((sub) => (
                                    <TableRow key={sub.id} className="group hover:bg-slate-50/50 dark:hover:bg-zinc-900/30">
                                        <TableCell className="font-mono text-[11px] text-muted-foreground border-r px-6">{sub.id}</TableCell>
                                        <TableCell className="font-bold text-sm border-r px-6">{sub.name}</TableCell>
                                        <TableCell className="border-r px-6">
                                            <Badge variant="outline" className="text-indigo-600 border-indigo-200 dark:border-indigo-900">{sub.catTitle}</Badge>
                                        </TableCell>
                                        <TableCell className="text-center border-r px-6">
                                            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {sub.tasks.length}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => { setEditingSubCat({ catKey: sub.catKey, role: { ...sub } }); setIsSubCatModalOpen(true); }}><Edit2 className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => deleteSubCat(sub.catKey, sub.id)} className="text-rose-500"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                {/* Tasks Tab */}
                <TabsContent value="tasks" className="flex-1 min-h-0 bg-white dark:bg-zinc-950 border rounded-xl shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b flex justify-between items-center bg-slate-50/50 dark:bg-zinc-900/20">
                        <div className="flex items-center gap-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Mission Tasks</h3>
                        </div>
                        <Button size="sm" className="bg-slate-950 hover:bg-slate-900 border-none text-white shadow-md" onClick={() => {
                            const firstCatKey = Object.keys(config)[0];
                            const firstRole = config[firstCatKey].roles[0];
                            setEditingTask({
                                task: { id: `t_${Date.now()}`, title: "New Assignment", description: "", type: "reading", status: "draft", required: true },
                                assignments: firstRole ? [{ catKey: firstCatKey, roleId: firstRole.id }] : []
                            });
                            setIsTaskModalOpen(true);
                        }}>
                            <Plus className="w-4 h-4 mr-2" /> Create Task
                        </Button>
                    </div>
                    <div className="flex-1 overflow-auto scrollbar-compact">
                        <Table>
                            <TableHeader className="bg-slate-50/80 dark:bg-zinc-900/40 sticky top-0 z-10">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[140px] text-xs font-bold border-r px-6">Task ID</TableHead>
                                    <TableHead className="min-w-[200px] text-xs font-bold border-r px-6">Task Title</TableHead>
                                    <TableHead className="text-xs font-bold border-r px-6">Category</TableHead>
                                    <TableHead className="text-xs font-bold border-r px-6">Sub-Category</TableHead>
                                    <TableHead className="text-xs font-bold text-center border-r px-6">Type</TableHead>
                                    <TableHead className="text-xs font-bold text-center border-r px-6">Status</TableHead>
                                    <TableHead className="w-[100px] text-right text-xs font-bold px-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {allTasksList.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase())).map((task) => (
                                    <TableRow key={task.id} className="group hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                                        <TableCell className="font-mono text-[10px] text-slate-400 border-r px-6">{task.id}</TableCell>
                                        <TableCell className="border-r px-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{task.title}</span>
                                                <span className="text-[10px] text-muted-foreground italic truncate max-w-[250px]">{task.description}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground border-r px-6">
                                            <div className="flex flex-wrap gap-1">
                                                {Array.from(new Set(task.assignments.map((a: any) => a.catTitle))).map((t: any) => (
                                                    <Badge key={t} variant="outline" className="text-[9px] uppercase">{t}</Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="border-r px-6">
                                            <div className="flex flex-wrap gap-1">
                                                {task.assignments.map((a: any) => (
                                                    <Badge key={a.roleId} variant="secondary" className="text-[9px] font-bold bg-slate-100 dark:bg-zinc-800">{a.roleName}</Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center border-r px-6">
                                            <span className="text-[10px] font-black uppercase tracking-tighter text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-1 rounded">
                                                {task.type}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center border-r px-6">
                                            {getStatusBadge(task.status)}
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => { setEditingTask({ task: { ...task }, assignments: task.assignments.map((a: any) => ({ catKey: a.catKey, roleId: a.roleId })) }); setIsTaskModalOpen(true); }}><Edit2 className="w-4 h-4 mr-2" /> Details</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => deleteTask(task.id)} className="text-rose-500"><Trash2 className="w-4 h-4 mr-2" /> Remove</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>

            {/* --- Modals --- */}

            {/* Category Modal */}
            <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Category Configuration</DialogTitle>
                        <DialogDescription>Define a high-level expertise area.</DialogDescription>
                    </DialogHeader>
                    {editingCategory && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input value={editingCategory.title} onChange={e => setEditingCategory({ ...editingCategory, title: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Internal Key (camelCase)</Label>
                                <Input value={editingCategory.key} onChange={e => setEditingCategory({ ...editingCategory, key: e.target.value })} />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={saveCategory} className="w-full bg-slate-950 hover:bg-slate-900 text-white">Save Category</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Sub-Category Modal */}
            <Dialog open={isSubCatModalOpen} onOpenChange={setIsSubCatModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Sub-Category Setup</DialogTitle>
                        <DialogDescription>Assign this role to a parent classification.</DialogDescription>
                    </DialogHeader>
                    {editingSubCat && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Parent Category</Label>
                                <Select value={editingSubCat.catKey} onValueChange={val => setEditingSubCat({ ...editingSubCat, catKey: val })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(config).map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Role Name</Label>
                                <Input value={editingSubCat.role.name} onChange={e => setEditingSubCat({ ...editingSubCat, role: { ...editingSubCat.role, name: e.target.value } })} />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={saveSubCat} className="w-full bg-slate-950 hover:bg-slate-900 text-white">Save Sub-Category</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Task Details Modal */}
            <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
                <DialogContent className="max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Master Task Controller</DialogTitle>
                        <DialogDescription>Configure the dynamic onboarding module properties.</DialogDescription>
                    </DialogHeader>
                    {editingTask && (
                        <div className="grid gap-5 py-4">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center mb-1">
                                    <Label className="text-xs uppercase font-bold text-muted-foreground">Assignments</Label>
                                    <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setEditingTask({ ...editingTask, assignments: [...editingTask.assignments, { catKey: Object.keys(config)[0], roleId: config[Object.keys(config)[0]].roles[0]?.id || "" }] })}>
                                        <Plus className="w-3 h-3 mr-1" /> Add Assignment
                                    </Button>
                                </div>
                                <div className="space-y-2 max-h-[150px] overflow-auto p-1 border rounded-lg bg-slate-50/50 dark:bg-zinc-900/20">
                                    {editingTask.assignments.map((ass, idx) => (
                                        <div key={idx} className="flex gap-2 items-center bg-white dark:bg-zinc-950 p-2 rounded-md border shadow-sm">
                                            <Select value={ass.catKey} onValueChange={val => {
                                                const newAss = [...editingTask.assignments];
                                                newAss[idx] = { catKey: val, roleId: config[val].roles[0]?.id || "" };
                                                setEditingTask({ ...editingTask, assignments: newAss });
                                            }}>
                                                <SelectTrigger className="h-8 text-xs shrink-0 w-[140px]"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {Object.keys(config).map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <Select value={ass.roleId} onValueChange={val => {
                                                const newAss = [...editingTask.assignments];
                                                newAss[idx].roleId = val;
                                                setEditingTask({ ...editingTask, assignments: newAss });
                                            }}>
                                                <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {config[ass.catKey].roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-500" onClick={() => {
                                                const newAss = editingTask.assignments.filter((_, i) => i !== idx);
                                                setEditingTask({ ...editingTask, assignments: newAss });
                                            }}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                    {editingTask.assignments.length === 0 && (
                                        <p className="text-[10px] text-center text-muted-foreground py-2">No categories assigned</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Task Title</Label>
                                <Input value={editingTask.task.title} onChange={e => setEditingTask({ ...editingTask, task: { ...editingTask.task, title: e.target.value } })} />
                            </div>

                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea className="resize-none h-16 text-sm" value={editingTask.task.description} onChange={e => setEditingTask({ ...editingTask, task: { ...editingTask.task, description: e.target.value } })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select value={editingTask.task.type} onValueChange={(val: TaskType) => setEditingTask({ ...editingTask, task: { ...editingTask.task, type: val } })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="reading">Reading</SelectItem>
                                            <SelectItem value="video">Video</SelectItem>
                                            <SelectItem value="essay">Essay</SelectItem>
                                            <SelectItem value="mcq">MCQ</SelectItem>
                                            <SelectItem value="report">Report</SelectItem>
                                            <SelectItem value="upload">Upload</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select value={editingTask.task.status} onValueChange={(val: TaskStatus) => setEditingTask({ ...editingTask, task: { ...editingTask.task, status: val } })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="published">Published</SelectItem>
                                            <SelectItem value="on-hold">On Hold</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsTaskModalOpen(false)}>Cancel</Button>
                        <Button onClick={saveTask} className="bg-slate-950 hover:bg-slate-900 border-none text-white shadow-sm">Commit Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}

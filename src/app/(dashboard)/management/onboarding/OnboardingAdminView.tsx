"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { 
    getGeneralOnboardingModules, 
    getGeneralOnboardingTasks, 
    upsertModule, 
    deleteModule, 
    upsertTask, 
    deleteTask,
    reorderModules,
    reorderTasks,
    GeneralModule,
    GeneralTask,
    getContentBlocks,
    upsertContentBlock,
    deleteContentBlock,
    reorderContentBlocks,
    ContentBlock,
    getDepartments
} from "@/app/actions/general-onboarding-actions";
import { Target, ListTodo, Plus, Trash2, Edit2, GripVertical, CheckCircle2 } from "lucide-react";
import * as Icons from "lucide-react";

export default function OnboardingAdminView() {
    const [modules, setModules] = useState<GeneralModule[]>([]);
    const [tasks, setTasks] = useState<GeneralTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [editingModule, setEditingModule] = useState<Partial<GeneralModule> | null>(null);
    const [editingTask, setEditingTask] = useState<Partial<GeneralTask> | null>(null);
    const [editingContentId, setEditingContentId] = useState<string | null>(null);
    const editingContentTask = tasks.find(t => t.id === editingContentId) || null;
    
    // Content Blocks State
    const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
    const [editingBlock, setEditingBlock] = useState<Partial<ContentBlock> | null>(null);

    const [departments, setDepartments] = useState<any[]>([]);

    const [draggedModuleId, setDraggedModuleId] = useState<string | null>(null);
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const mods = await getGeneralOnboardingModules();
            const tsks = await getGeneralOnboardingTasks();
            const deps = await getDepartments();
            setModules(mods);
            setTasks(tsks);
            setDepartments(deps);
        } catch (error: any) {
            toast.error("Failed to load onboarding data", { description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Module Handlers
    const handleSaveModule = async () => {
        if (!editingModule?.title) return toast.error("Title is required");
        try {
            await upsertModule(editingModule as Partial<GeneralModule>);
            toast.success(editingModule.id ? "Module updated" : "Module created");
            setEditingModule(null);
            loadData();
        } catch (e: any) {
            toast.error("Error saving module", { description: e.message });
        }
    };

    const handleDeleteModule = async (id: string) => {
        if (!confirm("Are you sure? This deletes all associated tasks as well.")) return;
        try {
            await deleteModule(id);
            toast.success("Module deleted");
            loadData();
        } catch (e: any) {
            toast.error("Error deleting module", { description: e.message });
        }
    }

    const handleDropModule = async (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedModuleId || draggedModuleId === targetId) return;

        const oldIndex = modules.findIndex(m => m.id === draggedModuleId);
        const newIndex = modules.findIndex(m => m.id === targetId);

        if (oldIndex === -1 || newIndex === -1) return;

        const newModules = [...modules];
        const [draggedItem] = newModules.splice(oldIndex, 1);
        newModules.splice(newIndex, 0, draggedItem);

        setModules(newModules);
        setDraggedModuleId(null);
        try {
            await reorderModules(newModules.map(m => m.id));
            toast.success("Module order updated");
        } catch (err: any) {
            toast.error("Failed to update order");
            loadData();
        }
    };

    // Task Handlers
    const handleSaveTask = async () => {
        if (!editingTask?.title || !editingTask?.module_id) return toast.error("Title and Module mapping are required");
        
        // Preserve existing content structure if we are just editing task basics
        const payload = { ...editingTask };
        
        try {
            await upsertTask(payload as Partial<GeneralTask>);
            toast.success(payload.id ? "Task updated" : "Task created");
            setEditingTask(null);
            loadData();
        } catch (e: any) {
            toast.error("Error saving task", { description: e.message });
        }
    };

    const handleDeleteTask = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            await deleteTask(id);
            if (editingContentId === id) setEditingContentId(null);
            toast.success("Task deleted");
            loadData();
        } catch (e: any) {
            toast.error("Error deleting task", { description: e.message });
        }
    }

    const handleDropTask = async (e: React.DragEvent, targetId: string, moduleId: string) => {
        e.preventDefault();
        if (!draggedTaskId || draggedTaskId === targetId) return;

        // Reorder only within the same module visually
        const moduleTasks = tasks.filter(t => t.module_id === moduleId);
        const oldIndex = moduleTasks.findIndex(t => t.id === draggedTaskId);
        const newIndex = moduleTasks.findIndex(t => t.id === targetId);

        if (oldIndex === -1 || newIndex === -1) return;

        const newModuleTasks = [...moduleTasks];
        const [draggedItem] = newModuleTasks.splice(oldIndex, 1);
        newModuleTasks.splice(newIndex, 0, draggedItem);

        // Optimistically merge
        const otherTasks = tasks.filter(t => t.module_id !== moduleId);
         setTasks([...otherTasks, ...newModuleTasks]);
        setDraggedTaskId(null);

        try {
            await reorderTasks(newModuleTasks.map(t => t.id));
            toast.success("Task order updated");
        } catch (err: any) {
             toast.error("Failed to update task order");
             loadData();
        }
    };

    // Content Handlers
    const startEditingContent = async (taskId: string) => {
        setEditingContentId(taskId);
        try {
            const blocks = await getContentBlocks(taskId);
            setContentBlocks(blocks || []);
        } catch (e: any) {
            toast.error("Error loading content", { description: e.message });
        }
    };

    const handleSaveBlock = async () => {
        if (!editingContentId || !editingBlock?.type) return;
        try {
            const blockToSave = {
                ...editingBlock,
                task_id: editingContentId,
                order_index: editingBlock.order_index ?? contentBlocks.length
            };
            await upsertContentBlock(blockToSave as Partial<ContentBlock>);
            toast.success("Block saved successfully");
            setEditingBlock(null);
            
            const blocks = await getContentBlocks(editingContentId);
            setContentBlocks(blocks || []);
        } catch (e: any) {
            toast.error("Error saving block", { description: e.message });
        }
    };

    const handleDeleteBlock = async (id: string) => {
        if (!confirm("Delete this content block?")) return;
        try {
            await deleteContentBlock(id);
            toast.success("Block deleted");
            const blocks = await getContentBlocks(editingContentId as string);
            setContentBlocks(blocks || []);
        } catch (e: any) {
            toast.error("Error deleting block", { description: e.message });
        }
    };

    const handleDropBlock = async (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedBlockId || draggedBlockId === targetId || !editingContentId) return;

        const oldIndex = contentBlocks.findIndex(b => b.id === draggedBlockId);
        const newIndex = contentBlocks.findIndex(b => b.id === targetId);

        if (oldIndex === -1 || newIndex === -1) return;

        const newBlocks = [...contentBlocks];
        const [draggedItem] = newBlocks.splice(oldIndex, 1);
        newBlocks.splice(newIndex, 0, draggedItem);

        setContentBlocks(newBlocks);
        setDraggedBlockId(null);

        try {
            await reorderContentBlocks(newBlocks.map(b => b.id));
            toast.success("Block order updated");
        } catch (err: any) {
             toast.error("Failed to update block order");
             const blocks = await getContentBlocks(editingContentId);
             setContentBlocks(blocks || []);
        }
    };


    if (isLoading) return <div className="p-8 text-center text-slate-500">Loading Configuration Data...</div>;

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <div className="relative overflow-hidden rounded-lg bg-slate-50 dark:bg-zinc-900/50 p-4 md:p-6 border border-slate-200 dark:border-zinc-800 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                            <Target className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Onboarding Configuration</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                                Manage the general onboarding flow (Modules), sub-tasks, and their associated reading/video content.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="modules" className="mt-4">
                <TabsList className="grid w-full max-w-2xl grid-cols-3">
                    <TabsTrigger value="modules">1. Modules</TabsTrigger>
                    <TabsTrigger value="tasks">2. Tasks</TabsTrigger>
                    <TabsTrigger value="content">3. Task Content</TabsTrigger>
                </TabsList>

                {/* 1. MODULES TAB */}
                <TabsContent value="modules" className="mt-6 flex flex-col gap-6">
                    {editingModule ? (
                        <Card className="border-indigo-200 bg-indigo-50/10 fade-in-0 duration-300">
                            <CardHeader>
                                <CardTitle>{editingModule.id ? "Edit Module" : "New Module"}</CardTitle>
                                <CardDescription>This is a top-level grouping module (e.g. Organization, Mission).</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">Title</label>
                                        <Input value={editingModule.title || ''} onChange={e => setEditingModule({ ...editingModule, title: e.target.value })} placeholder="e.g. Organization" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">Icon</label>
                                        <Select value={editingModule.icon || 'BookOpen'} onValueChange={v => setEditingModule({ ...editingModule, icon: v })}>
                                            <SelectTrigger>
                                                <div className="flex items-center gap-2">
                                                    {(() => {
                                                        const Icon = (Icons as any)[editingModule.icon || "BookOpen"] || Icons.BookOpen;
                                                        return <Icon className="w-4 h-4" />;
                                                    })()}
                                                    <SelectValue placeholder="Select icon" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[300px]">
                                                {[
                                                    { id: 'Building2', name: 'Building / Org' },
                                                    { id: 'Target', name: 'Target / Mission' },
                                                    { id: 'GraduationCap', name: 'Education' },
                                                    { id: 'Heart', name: 'Values / Heart' },
                                                    { id: 'Puzzle', name: 'Puzzle / Logic' },
                                                    { id: 'ListTodo', name: 'Tasks / List' },
                                                    { id: 'ShieldCheck', name: 'Safety / Trust' },
                                                    { id: 'PlayCircle', name: 'Video / Media' },
                                                    { id: 'BookOpen', name: 'Reading / Book' },
                                                    { id: 'UserCircle', name: 'Profile / User' },
                                                    { id: 'Sparkles', name: 'Tips / Highlights' },
                                                    { id: 'FileText', name: 'Document' },
                                                    { id: 'MessageSquare', name: 'Chat / Feedback' },
                                                    { id: 'Users2', name: 'Team / Community' }
                                                ].map(ico => {
                                                    const Preview = (Icons as any)[ico.id] || Icons.BookOpen;
                                                    return (
                                                        <SelectItem key={ico.id} value={ico.id}>
                                                            <div className="flex items-center gap-2">
                                                                <Preview className="w-4 h-4" />
                                                                <span>{ico.name}</span>
                                                            </div>
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">Color Variant</label>
                                        <Select value={editingModule.color || 'indigo'} onValueChange={v => setEditingModule({ ...editingModule, color: v })}>
                                            <SelectTrigger><SelectValue placeholder="Select color" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="indigo">Indigo</SelectItem>
                                                <SelectItem value="rose">Rose</SelectItem>
                                                <SelectItem value="amber">Amber</SelectItem>
                                                <SelectItem value="emerald">Emerald</SelectItem>
                                                <SelectItem value="blue">Blue</SelectItem>
                                                <SelectItem value="violet">Violet</SelectItem>
                                                <SelectItem value="orange">Orange</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">Module Scope</label>
                                        <Select 
                                            value={editingModule.type === 'General' ? 'General' : (editingModule.department_id || '')} 
                                            onValueChange={v => {
                                                if (v === 'General') {
                                                    setEditingModule({ ...editingModule, type: 'General', department_id: null });
                                                } else {
                                                    setEditingModule({ ...editingModule, type: 'Specific', department_id: v });
                                                }
                                            }}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Select scope" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="General">ORG (General)</SelectItem>
                                                {departments
                                                    .filter(d => d.name.toUpperCase() !== 'ORG')
                                                    .map(d => (
                                                        <SelectItem key={d.id} value={d.id}>{d.name} (Department)</SelectItem>
                                                    ))
                                                }
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-bold text-slate-700">Description</label>
                                        <Textarea value={editingModule.description || ''} onChange={e => setEditingModule({ ...editingModule, description: e.target.value })} />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="gap-2">
                                <Button onClick={handleSaveModule} className="bg-indigo-600 hover:bg-indigo-700">Save Module</Button>
                                <Button variant="ghost" onClick={() => setEditingModule(null)}>Cancel</Button>
                            </CardFooter>
                        </Card>
                    ) : (
                        <Button className="w-auto self-start gap-2" onClick={() => setEditingModule({ color: 'indigo', icon: 'BookOpen', type: 'General' })}>
                            <Plus className="w-4 h-4" /> Add New Module
                        </Button>
                    )}

                    <div className="border rounded-md bg-white dark:bg-zinc-950/50 shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Order</TableHead>
                                    <TableHead>Module</TableHead>
                                    <TableHead>Scope</TableHead>
                                    <TableHead className="hidden md:table-cell">Description</TableHead>
                                    <TableHead className="w-[120px]">Color</TableHead>
                                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {modules.map((mod, index) => (
                                    <TableRow 
                                        key={mod.id}
                                        draggable
                                        onDragStart={(e) => { setDraggedModuleId(mod.id); e.dataTransfer.effectAllowed = 'move'; }}
                                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                                        onDrop={(e) => handleDropModule(e, mod.id)}
                                        className={`transition-all ${draggedModuleId === mod.id ? 'opacity-50 bg-slate-50' : ''}`}
                                    >
                                        <TableCell>
                                           <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing text-slate-500">
                                                <GripVertical className="w-4 h-4" />
                                                <span className="font-medium text-sm">{index + 1}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{mod.title}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${mod.type === 'General' ? 'bg-slate-100 text-slate-600' : 'bg-indigo-100 text-indigo-700'}`}>
                                                {mod.type === 'General' ? 'Org' : (departments.find(d => d.id === mod.department_id)?.name || 'Dept')}
                                            </span>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-sm text-slate-500 truncate max-w-[300px]">{mod.description}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded text-xs font-medium bg-${mod.color}-100 text-${mod.color}-700 dark:bg-${mod.color}-900/40 dark:text-${mod.color}-400`}>
                                                {mod.color}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingModule(mod)}><Edit2 className="w-4 h-4" /></Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDeleteModule(mod.id)}><Trash2 className="w-4 h-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                {/* 2. TASKS TAB */}
                <TabsContent value="tasks" className="mt-6 flex flex-col gap-6">
                    {editingTask ? (
                        <Card className="border-emerald-200 bg-emerald-50/10 fade-in-0 duration-300">
                             <CardHeader>
                                <CardTitle>{editingTask.id ? "Edit Task" : "New Task"}</CardTitle>
                                <CardDescription>Define the basic metadata for a task under a specific module.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">Parent Module</label>
                                        <Select value={editingTask.module_id || ''} onValueChange={v => setEditingTask({ ...editingTask, module_id: v })}>
                                            <SelectTrigger><SelectValue placeholder="Select Parent Module" /></SelectTrigger>
                                            <SelectContent>
                                                {modules.map(m => (
                                                    <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">Task Title</label>
                                        <Input value={editingTask.title || ''} onChange={e => setEditingTask({ ...editingTask, title: e.target.value })} placeholder="e.g. Our History" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">Icon</label>
                                        <Select value={editingTask.icon || 'ListTodo'} onValueChange={v => setEditingTask({ ...editingTask, icon: v })}>
                                            <SelectTrigger>
                                                <div className="flex items-center gap-2">
                                                    {(() => {
                                                        const Icon = (Icons as any)[editingTask.icon || "ListTodo"] || Icons.ListTodo;
                                                        return <Icon className="w-4 h-4" />;
                                                    })()}
                                                    <SelectValue placeholder="Select icon" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[300px]">
                                                {[
                                                    { id: 'ListTodo', name: 'Task List' },
                                                    { id: 'BookOpen', name: 'Reading' },
                                                    { id: 'PlayCircle', name: 'Video' },
                                                    { id: 'FileText', name: 'Document' },
                                                    { id: 'CheckCircle2', name: 'Verification' },
                                                    { id: 'HelpCircle', name: 'Quiz / Question' },
                                                    { id: 'Eye', name: 'Review' },
                                                    { id: 'User', name: 'Personal' },
                                                    { id: 'MessageSquare', name: 'Feedback' },
                                                    { id: 'PenTool', name: 'Drafting' }
                                                ].map(ico => {
                                                    const Preview = (Icons as any)[ico.id] || Icons.ListTodo;
                                                    return (
                                                        <SelectItem key={ico.id} value={ico.id}>
                                                            <div className="flex items-center gap-2">
                                                                <Preview className="w-4 h-4" />
                                                                <span>{ico.name}</span>
                                                            </div>
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-bold text-slate-700">Short Description</label>
                                        <Textarea value={editingTask.description || ''} onChange={e => setEditingTask({ ...editingTask, description: e.target.value })} />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="gap-2">
                                <Button onClick={handleSaveTask} className="bg-emerald-600 hover:bg-emerald-700">Save Task</Button>
                                <Button variant="ghost" onClick={() => setEditingTask(null)}>Cancel</Button>
                            </CardFooter>
                        </Card>
                    ) : (
                        <Button className="w-auto self-start gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setEditingTask({ icon: 'ListTodo' })}>
                            <Plus className="w-4 h-4" /> Add New Task
                        </Button>
                    )}

                    {modules.map(mod => {
                        const modTasks = tasks.filter(t => t.module_id === mod.id);
                        if (modTasks.length === 0) return null;
                        return (
                            <div key={mod.id} className="mb-6 space-y-3">
                                <h3 className="font-bold text-md flex items-center gap-2 text-slate-800 dark:text-slate-200">
                                    <div className={`w-2 h-2 rounded-full bg-${mod.color}-500`} /> 
                                    {mod.title}
                                </h3>
                                <div className="border rounded-md bg-white dark:bg-zinc-950/50 shadow-sm overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[80px]">Order</TableHead>
                                                <TableHead>Task</TableHead>
                                                <TableHead className="hidden md:table-cell">Description</TableHead>
                                                <TableHead className="w-[100px] text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {modTasks.map((task, index) => (
                                                <TableRow 
                                                    key={task.id}
                                                    draggable
                                                    onDragStart={(e) => { setDraggedTaskId(task.id); e.dataTransfer.effectAllowed = 'move'; }}
                                                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                                                    onDrop={(e) => handleDropTask(e, task.id, mod.id)}
                                                    className={`transition-all ${draggedTaskId === task.id ? 'opacity-50 bg-slate-50' : ''}`}
                                                >
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing text-slate-500">
                                                            <GripVertical className="w-4 h-4" />
                                                            <span className="font-medium text-sm">{index + 1}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-medium">{task.title}</TableCell>
                                                    <TableCell className="hidden md:table-cell text-sm text-slate-500 truncate max-w-[300px]">{task.description}</TableCell>
                                                    <TableCell className="text-right flex items-center justify-end gap-1">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingTask(task)}><Edit2 className="w-4 h-4" /></Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDeleteTask(task.id)}><Trash2 className="w-4 h-4" /></Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )
                    })}
                </TabsContent>

                {/* 3. TASK CONTENT TAB */}
                <TabsContent value="content" className="mt-6 flex flex-col gap-6">
                    {!editingContentId ? (
                        <>
                            <p className="text-sm text-slate-500 mb-2">Select a task from below to edit the learning material and content type.</p>
                            {modules.map(mod => {
                                const modTasks = tasks.filter(t => t.module_id === mod.id);
                                if (modTasks.length === 0) return null;
                                return (
                                    <div key={mod.id} className="mb-6 space-y-3">
                                        <h3 className="font-bold text-md flex items-center gap-2 text-slate-800 dark:text-slate-200">
                                            <div className={`w-2 h-2 rounded-full bg-${mod.color}-500`} /> 
                                            {mod.title}
                                        </h3>
                                        <div className="border rounded-md bg-white dark:bg-zinc-950/50 shadow-sm overflow-hidden">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Task Title</TableHead>
                                                        <TableHead className="w-[150px]">Content Type</TableHead>
                                                        <TableHead className="text-right w-[150px]">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {modTasks.map(task => (
                                                        <TableRow key={task.id}>
                                                            <TableCell className="font-medium">{task.title}</TableCell>
                                                            <TableCell className="font-medium text-slate-500 text-sm">Blocks</TableCell>
                                                            <TableCell className="text-right flex items-center justify-end gap-1">
                                                                <Button variant="ghost" size="sm" className="h-8 gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => startEditingContent(task.id)}>
                                                                    <Edit2 className="w-3 h-3" /> Edit Content
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                )
                            })}
                        </>
                    ) : (
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center justify-between pb-4 border-b">
                                <div>
                                    <h3 className="text-xl font-bold">Content Editor: {editingContentTask?.title}</h3>
                                    <p className="text-sm text-slate-500">Build your learning content iteratively block by block</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setEditingContentId(null)}>Close Editor</Button>
                            </div>

                            {/* Block List */}
                            <div className="space-y-4">
                                {contentBlocks.map((block, index) => (
                                    <div 
                                        key={block.id}
                                        draggable
                                        onDragStart={(e) => { setDraggedBlockId(block.id); e.dataTransfer.effectAllowed = 'move'; }}
                                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                                        onDrop={(e) => handleDropBlock(e, block.id)}
                                        className={`transition-all bg-white dark:bg-zinc-950/50 border rounded-lg p-4 flex items-center justify-between gap-4 shadow-sm ${draggedBlockId === block.id ? 'opacity-50' : ''}`}
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="cursor-grab active:cursor-grabbing text-slate-400"><GripVertical className="w-5 h-5"/></div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                                        {block.type.replace('_', ' ')}
                                                    </span>
                                                    {block.page_behavior === 'new_page' && <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">NEW PAGE</span>}
                                                </div>
                                                <div className="font-semibold text-sm">{block.title || '(No Title)'}</div>
                                                {block.content && <p className="text-xs text-slate-500 truncate max-w-xl">{block.content}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => setEditingBlock(block)}><Edit2 className="w-4 h-4" /></Button>
                                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDeleteBlock(block.id)}><Trash2 className="w-4 h-4" /></Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Block Editor / Creator */}
                            <div className="mt-8 border-t pt-8">
                                {editingBlock ? (
                                    <Card className="border-blue-200 bg-blue-50/20 shadow-none ring-1 ring-blue-100 fade-in-0">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-md">{editingBlock.id ? "Edit Block" : "Add Content Block"}</CardTitle>
                                            <CardDescription className="text-xs">Use blocks to build content with Notion-like styles (Callouts, Quotes, Lists, Tables etc.)</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-700">Block Type</label>
                                                    <Select value={editingBlock.type || ''} onValueChange={v => setEditingBlock({ ...editingBlock, type: v, metadata: {} })}>
                                                        <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="heading">Heading</SelectItem>
                                                            <SelectItem value="text">Text (Markdown format)</SelectItem>
                                                            <SelectItem value="plain_text">Plain Text (No markdown)</SelectItem>
                                                            <SelectItem value="notion">Notion Page (Embed)</SelectItem>
                                                            <SelectItem value="callout">Callout (Important Note)</SelectItem>
                                                            <SelectItem value="quote">Quote</SelectItem>
                                                            <SelectItem value="bulleted_list">Bulleted List</SelectItem>
                                                            <SelectItem value="numbered_list">Numbered List</SelectItem>
                                                            <SelectItem value="to_do">To-do List</SelectItem>
                                                            <SelectItem value="toggle">Toggle (Expandable)</SelectItem>
                                                            <SelectItem value="embed">Video/Audio Embed</SelectItem>
                                                            <SelectItem value="pdf_viewer">PDF Document</SelectItem>
                                                            <SelectItem value="reflection_question">Reflection Question</SelectItem>
                                                            <SelectItem value="quiz_mcq">Quiz MCQ</SelectItem>
                                                            <SelectItem value="divider">Divider</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-700">Page Behavior</label>
                                                    <Select value={editingBlock.page_behavior || 'same_page'} onValueChange={v => setEditingBlock({ ...editingBlock, page_behavior: v })}>
                                                        <SelectTrigger><SelectValue placeholder="Behavior..." /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="same_page">Same Page (continues below)</SelectItem>
                                                            <SelectItem value="new_page">New Page (Starts new step/page)</SelectItem>
                                                            <SelectItem value="section_break">Section Break</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-700">Block Title / Component Label</label>
                                                <Input value={editingBlock.title || ''} onChange={e => setEditingBlock({ ...editingBlock, title: e.target.value })} placeholder="e.g. NavGurukul Mission Video" />
                                            </div>

                                            {(editingBlock.type === 'text' || editingBlock.type === 'plain_text' || editingBlock.type === 'heading' || editingBlock.type === 'reflection_question' || editingBlock.type === 'quiz_mcq' || editingBlock.type === 'callout' || editingBlock.type === 'quote' || editingBlock.type === 'bulleted_list' || editingBlock.type === 'numbered_list' || editingBlock.type === 'to_do' || editingBlock.type === 'toggle') && (
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-700">Content / Prompt / Question</label>
                                                    <Textarea 
                                                        className="min-h-[150px] font-mono text-sm leading-relaxed" 
                                                        value={editingBlock.content || ''} 
                                                        onChange={e => setEditingBlock({ ...editingBlock, content: e.target.value })} 
                                                        placeholder={
                                                           editingBlock.type === 'bulleted_list' || editingBlock.type === 'numbered_list' || editingBlock.type === 'to_do'
                                                           ? "Enter each item on a new line..."
                                                           : "Enter markdown text or question prompt here..."
                                                        }
                                                    />
                                                </div>
                                            )}

                                            {(editingBlock.type === 'embed' || editingBlock.type === 'notion') && (
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-700">{editingBlock.type === 'notion' ? 'Notion Page URL (Make sure it is public)' : 'Embed URL (Youtube, Vimeo, etc)'}</label>
                                                    <Input 
                                                        value={editingBlock.metadata?.url || ''} 
                                                        onChange={e => setEditingBlock({ ...editingBlock, metadata: { ...(editingBlock.metadata || {}), url: e.target.value } })} 
                                                        placeholder={editingBlock.type === 'notion' ? "https://notion.so/..." : "https://youtube.com/..."} 
                                                    />
                                                    {editingBlock.type === 'notion' && (
                                                        <p className="text-[10px] text-amber-600 font-medium">
                                                            Note: Most Notion pages block embedding for security. A link fallback is automatically provided for the user.
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {editingBlock.type === 'pdf_viewer' && (
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-700">PDF Document URL</label>
                                                    <Input 
                                                        value={editingBlock.metadata?.url || ''} 
                                                        onChange={e => setEditingBlock({ ...editingBlock, metadata: { ...(editingBlock.metadata || {}), url: e.target.value } })} 
                                                        placeholder="https://example.com/document.pdf" 
                                                    />
                                                </div>
                                            )}
                                            
                                            {editingBlock.type === 'callout' && (
                                                <div className="space-y-4 pt-2">
                                                     <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold text-slate-700">Icon (Emoji or Icon Name)</label>
                                                            <Input 
                                                                value={editingBlock.metadata?.icon || '💡'} 
                                                                onChange={e => setEditingBlock({ ...editingBlock, metadata: { ...(editingBlock.metadata || {}), icon: e.target.value } })} 
                                                                placeholder="💡 or Rocket" 
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold text-slate-700">Color</label>
                                                            <Select 
                                                                value={editingBlock.metadata?.color || 'blue'} 
                                                                onValueChange={v => setEditingBlock({ ...editingBlock, metadata: { ...(editingBlock.metadata || {}), color: v } })}
                                                             >
                                                                 <SelectTrigger><SelectValue placeholder="Color..." /></SelectTrigger>
                                                                 <SelectContent>
                                                                     <SelectItem value="blue">Blue</SelectItem>
                                                                     <SelectItem value="amber">Amber</SelectItem>
                                                                     <SelectItem value="rose">Rose</SelectItem>
                                                                     <SelectItem value="emerald">Emerald</SelectItem>
                                                                     <SelectItem value="slate">Gray</SelectItem>
                                                                     <SelectItem value="indigo">Indigo</SelectItem>
                                                                 </SelectContent>
                                                             </Select>
                                                        </div>
                                                     </div>
                                                </div>
                                            )}

                                            {editingBlock.type === 'quiz_mcq' && (
                                                <div className="space-y-4 pt-4 border-t">
                                                    <h4 className="font-bold text-sm text-slate-800">Multiple Choice Answers</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {[1, 2, 3, 4].map((num) => (
                                                            <div key={num} className="space-y-1">
                                                                <label className="text-xs font-bold text-slate-700">Option {num}</label>
                                                                <Input 
                                                                    value={editingBlock.metadata?.[`option${num}`] || ''} 
                                                                    onChange={e => setEditingBlock({ ...editingBlock, metadata: { ...(editingBlock.metadata || {}), [`option${num}`]: e.target.value } })} 
                                                                    placeholder={`Answer ${num}`} 
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-slate-700">Correct Answer</label>
                                                        <Select value={editingBlock.metadata?.correctAnswer?.toString() || ''} onValueChange={v => setEditingBlock({ ...editingBlock, metadata: { ...(editingBlock.metadata || {}), correctAnswer: parseInt(v) } })}>
                                                            <SelectTrigger><SelectValue placeholder="Which option is correct?" /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="1">Option 1</SelectItem>
                                                                <SelectItem value="2">Option 2</SelectItem>
                                                                <SelectItem value="3">Option 3</SelectItem>
                                                                <SelectItem value="4">Option 4</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            )}

                                        </CardContent>
                                        <CardFooter className="gap-2">
                                            <Button onClick={handleSaveBlock} className="bg-blue-600 hover:bg-blue-700">Save Block</Button>
                                            <Button variant="ghost" onClick={() => setEditingBlock(null)}>Cancel</Button>
                                        </CardFooter>
                                    </Card>
                                ) : (
                                    <Button className="w-auto gap-2 bg-slate-900 border-dashed border text-white hover:bg-slate-800 w-full" variant="outline" onClick={() => setEditingBlock({ type: 'text', page_behavior: 'same_page', layout: 'full_width' })}>
                                        <Plus className="w-4 h-4" /> Add Block
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

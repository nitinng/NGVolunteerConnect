"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { 
    getDepartments,
    upsertDepartment,
    deleteDepartment,
    Department
} from "@/app/actions/general-onboarding-actions";
import { Building2, Plus, Trash2, Edit2, Search } from "lucide-react";

export default function DepartmentsManagementView() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [editingDept, setEditingDept] = useState<Partial<Department> | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const data = await getDepartments();
            setDepartments(data);
        } catch (error: any) {
            toast.error("Failed to load departments", { description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSave = async () => {
        if (!editingDept?.name) return toast.error("Name is required");
        try {
            await upsertDepartment(editingDept);
            toast.success(editingDept.id ? "Department updated" : "Department created");
            setEditingDept(null);
            loadData();
        } catch (e: any) {
            toast.error("Error saving department", { description: e.message });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? Any onboarding modules linked to this department will lose their association.")) return;
        try {
            await deleteDepartment(id);
            toast.success("Department deleted");
            loadData();
        } catch (e: any) {
            toast.error("Error deleting department", { description: e.message });
        }
    };

    const filteredDepartments = departments.filter(d => 
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        d.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) return <div className="p-8 text-center text-slate-500">Loading Departments...</div>;

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <div className="relative overflow-hidden rounded-[12px] bg-slate-50 dark:bg-zinc-900/50 p-6 md:p-8 border border-slate-200 dark:border-zinc-800 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="p-3 rounded-[12px] bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Departments</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl font-medium">
                                Manage organizational departments to categorize volunteers and specific onboarding flows.
                            </p>
                        </div>
                    </div>
                    <Button className="w-fit gap-2 bg-indigo-600 hover:bg-indigo-700" onClick={() => setEditingDept({})}>
                        <Plus className="w-4 h-4" /> Add Department
                    </Button>
                </div>
            </div>

            {editingDept && (
                <Card className="border-indigo-200 bg-indigo-50/10 animate-in fade-in slide-in-from-top-4 duration-300">
                    <CardHeader>
                        <CardTitle>{editingDept.id ? "Edit Department" : "New Department"}</CardTitle>
                        <CardDescription>Enter the details for the department.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700">Name</label>
                                <Input 
                                    value={editingDept.name || ''} 
                                    onChange={e => setEditingDept({ ...editingDept, name: e.target.value })} 
                                    placeholder="e.g. Engineering, Marketing, Operations" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700">Description</label>
                                <Textarea 
                                    value={editingDept.description || ''} 
                                    onChange={e => setEditingDept({ ...editingDept, description: e.target.value })} 
                                    placeholder="Briefly describe the department's role..."
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="gap-2">
                        <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">Save Department</Button>
                        <Button variant="ghost" onClick={() => setEditingDept(null)}>Cancel</Button>
                    </CardFooter>
                </Card>
            )}

            <div className="flex flex-col gap-4">
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                        className="pl-9" 
                        placeholder="Search departments..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="border rounded-md bg-white dark:bg-zinc-950/50 shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="px-4 md:px-6 py-4">Name</TableHead>
                                <TableHead className="hidden md:table-cell px-4 md:px-6 py-4">Description</TableHead>
                                <TableHead className="w-[100px] text-right px-4 md:px-6 py-4">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredDepartments.length > 0 ? (
                                filteredDepartments.map((dept) => (
                                    <TableRow key={dept.id}>
                                        <TableCell className="font-bold text-slate-900 dark:text-slate-100 px-4 md:px-6 py-4">{dept.name}</TableCell>
                                        <TableCell className="hidden md:table-cell text-sm text-slate-500 px-4 md:px-6 py-4">{dept.description || "No description provided."}</TableCell>
                                        <TableCell className="text-right flex items-center justify-end gap-1 px-4 md:px-6 py-4">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingDept(dept)}><Edit2 className="w-4 h-4" /></Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDelete(dept.id)}><Trash2 className="w-4 h-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-12 text-slate-500 font-medium">
                                        {searchQuery ? "No departments match your search." : "No departments added yet."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import {
    getSkillCategories,
    createSkillCategory,
    updateSkillCategory,
    deleteSkillCategory,
    getSkillSubcategories,
    createSkillSubcategory,
    updateSkillSubcategory,
    deleteSkillSubcategory
} from "@/app/actions/skills-actions";
import type { SkillCategory, SkillSubcategory } from "@/lib/supabase";
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
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Trash2,
    Edit2,
    MoreHorizontal,
    Search,
    LayoutGrid
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

type SubcategoryWithCategory = SkillSubcategory & { skill_categories: { title: string } };

const CATEGORY_STYLE_MAP = [
    { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-100", darkBg: "dark:bg-indigo-900/30", darkText: "dark:text-indigo-300", darkBorder: "dark:border-indigo-800/50" },
    { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100", darkBg: "dark:bg-emerald-900/30", darkText: "dark:text-emerald-300", darkBorder: "dark:border-emerald-800/50" },
    { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-100", darkBg: "dark:bg-rose-900/30", darkText: "dark:text-rose-300", darkBorder: "dark:border-rose-800/50" },
    { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100", darkBg: "dark:bg-amber-900/30", darkText: "dark:text-amber-300", darkBorder: "dark:border-amber-800/50" },
    { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-100", darkBg: "dark:bg-violet-900/30", darkText: "dark:text-violet-300", darkBorder: "dark:border-violet-800/50" },
    { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-100", darkBg: "dark:bg-cyan-900/30", darkText: "dark:text-cyan-300", darkBorder: "dark:border-cyan-800/50" },
    { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-100", darkBg: "dark:bg-orange-900/30", darkText: "dark:text-orange-300", darkBorder: "dark:border-orange-800/50" },
];

const getCategoryStyles = (title: string = "") => {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
        hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % CATEGORY_STYLE_MAP.length);
    const s = CATEGORY_STYLE_MAP[index];
    return `${s.bg} ${s.text} ${s.border} ${s.darkBg} ${s.darkText} ${s.darkBorder}`;
};

export default function SkillsManagementView() {
    const [categories, setCategories] = useState<SkillCategory[]>([]);
    const [subcategories, setSubcategories] = useState<SubcategoryWithCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Modals
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Partial<SkillCategory> | null>(null);

    const [isSubCatModalOpen, setIsSubCatModalOpen] = useState(false);
    const [editingSubCat, setEditingSubCat] = useState<Partial<SkillSubcategory> | null>(null);

    const [isActionLoading, setIsActionLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [cats, subcats] = await Promise.all([
                getSkillCategories(),
                getSkillSubcategories()
            ]);
            setCategories(cats);
            setSubcategories(subcats as SubcategoryWithCategory[]);
        } catch (error) {
            toast.error("Failed to load skills data");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Category Handlers ---

    const handleSaveCategory = async () => {
        if (!editingCategory?.title || !editingCategory?.key) {
            toast.error("Title and Key are required");
            return;
        }

        setIsActionLoading(true);
        try {
            if (editingCategory.id) {
                await updateSkillCategory(editingCategory.id, editingCategory);
                toast.success("Category updated");
            } else {
                await createSkillCategory(editingCategory as any);
                toast.success("Category created");
            }
            setIsCategoryModalOpen(false);
            loadData();
        } catch (error: any) {
            toast.error(error.message || "Failed to save category");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm("Delete this category? All linked subcategories will be lost.")) return;
        try {
            await deleteSkillCategory(id);
            toast.success("Category deleted");
            loadData();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete category");
        }
    };

    // --- Subcategory Handlers ---

    const handleSaveSubCat = async () => {
        if (!editingSubCat?.name || !editingSubCat?.category_id) {
            toast.error("Name and Category are required");
            return;
        }

        setIsActionLoading(true);
        try {
            if (editingSubCat.id) {
                await updateSkillSubcategory(editingSubCat.id, editingSubCat);
                toast.success("Sub-category updated");
            } else {
                await createSkillSubcategory(editingSubCat as any);
                toast.success("Sub-category created");
            }
            setIsSubCatModalOpen(false);
            loadData();
        } catch (error: any) {
            toast.error(error.message || "Failed to save sub-category");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleDeleteSubCat = async (id: string) => {
        if (!confirm("Delete this sub-category?")) return;
        try {
            await deleteSkillSubcategory(id);
            toast.success("Sub-category deleted");
            loadData();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete sub-category");
        }
    };

    // --- Filtered Data ---

    const filteredCategories = useMemo(() => {
        return categories.filter(c =>
            c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.key.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [categories, searchTerm]);

    const filteredSubcategories = useMemo(() => {
        return subcategories.filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.skill_categories?.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [subcategories, searchTerm]);

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-var(--header-height))] items-center justify-center">
                <i className="fa-solid fa-spinner fa-spin text-3xl text-slate-400" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-var(--header-height)-1rem)] p-4 md:p-6 max-w-[1400px] mx-auto w-full overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 shrink-0">
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Onboarding & Skills CMS</h1>
                    <p className="text-sm text-muted-foreground">Architect the journey for our student community.</p>
                </div>
            </div>

            <Tabs defaultValue="categories" className="flex-1 flex flex-col min-h-0">
                <div className="flex justify-between items-center mb-4">
                    <TabsList className="bg-slate-100 dark:bg-zinc-900/50 p-1">
                        <TabsTrigger value="categories" className="text-xs px-4">Categories</TabsTrigger>
                        <TabsTrigger value="subcategories" className="text-xs px-4">Sub-Categories</TabsTrigger>
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
                        <Button size="sm" className="bg-slate-950 hover:bg-slate-900 border-none text-white font-medium" onClick={() => { setEditingCategory({ title: "", key: "", display_order: 0 }); setIsCategoryModalOpen(true); }}>
                            <Plus className="w-4 h-4 mr-2" /> Add Category
                        </Button>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/80 dark:bg-zinc-900/40 sticky top-0 z-10">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="text-xs font-medium border-r px-6">Title</TableHead>
                                    <TableHead className="text-xs font-medium border-r px-6">Internal Key</TableHead>
                                    <TableHead className="w-[120px] text-xs font-medium text-center border-r px-6">Order</TableHead>
                                    <TableHead className="w-[100px] text-right text-xs font-medium px-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCategories.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No categories found</TableCell></TableRow>
                                ) : filteredCategories.map((cat) => (
                                    <TableRow key={cat.id} className="group hover:bg-slate-50/50 dark:hover:bg-zinc-900/30">
                                        <TableCell className="text-sm border-r px-6">{cat.title}</TableCell>
                                        <TableCell className="border-r px-6">
                                            <Badge variant="secondary" className={`border font-medium ${getCategoryStyles(cat.title)}`}>
                                                {cat.key}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center border-r px-6">
                                            <Badge variant="secondary" className="font-mono font-medium">{cat.display_order}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => { setEditingCategory({ ...cat }); setIsCategoryModalOpen(true); }}><Edit2 className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleDeleteCategory(cat.id)} className="text-rose-500"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
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
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Skill Sub-Categories</h3>
                        <Button size="sm" className="bg-slate-950 hover:bg-slate-900 border-none text-white font-medium" onClick={() => {
                            setEditingSubCat({ name: "", category_id: categories[0]?.id || "" });
                            setIsSubCatModalOpen(true);
                        }}>
                            <Plus className="w-4 h-4 mr-2" /> Add Sub-Category
                        </Button>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/80 dark:bg-zinc-900/40 sticky top-0 z-10">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="text-xs font-medium border-r px-6">Sub-Category Name</TableHead>
                                    <TableHead className="text-xs font-medium border-r px-6">Parent Category</TableHead>
                                    <TableHead className="w-[100px] text-right text-xs font-medium px-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSubcategories.length === 0 ? (
                                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No sub-categories found</TableCell></TableRow>
                                ) : filteredSubcategories.map((sub) => (
                                    <TableRow key={sub.id} className="group hover:bg-slate-50/50 dark:hover:bg-zinc-900/30">
                                        <TableCell className="text-sm border-r px-6">{sub.name}</TableCell>
                                        <TableCell className="border-r px-6">
                                            <Badge variant="secondary" className={`border font-medium ${getCategoryStyles(sub.skill_categories?.title)}`}>
                                                {sub.skill_categories?.title}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => { setEditingSubCat({ ...sub }); setIsSubCatModalOpen(true); }}><Edit2 className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleDeleteSubCat(sub.id)} className="text-rose-500"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
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
                        <DialogTitle>{editingCategory?.id ? "Edit Category" : "Add Category"}</DialogTitle>
                        <DialogDescription>Define a high-level expertise area.</DialogDescription>
                    </DialogHeader>
                    {editingCategory && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input value={editingCategory.title} onChange={e => setEditingCategory({ ...editingCategory, title: e.target.value })} placeholder="e.g., Technical" />
                            </div>
                            <div className="space-y-2">
                                <Label>Internal Key (unique)</Label>
                                <Input value={editingCategory.key} onChange={e => setEditingCategory({ ...editingCategory, key: e.target.value })} placeholder="e.g., technical" />
                            </div>
                            <div className="space-y-2">
                                <Label>Display Order</Label>
                                <Input type="number" value={editingCategory.display_order} onChange={e => setEditingCategory({ ...editingCategory, display_order: parseInt(e.target.value) || 0 })} />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCategoryModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveCategory} disabled={isActionLoading} className="bg-slate-950 hover:bg-slate-900 text-white min-w-[100px]">
                            {isActionLoading ? <i className="fa-solid fa-spinner fa-spin" /> : "Save Category"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Sub-Category Modal */}
            <Dialog open={isSubCatModalOpen} onOpenChange={setIsSubCatModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingSubCat?.id ? "Edit Sub-Category" : "Add Sub-Category"}</DialogTitle>
                        <DialogDescription>Assign this role to a parent classification.</DialogDescription>
                    </DialogHeader>
                    {editingSubCat && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Parent Category</Label>
                                <Select value={editingSubCat.category_id} onValueChange={val => setEditingSubCat({ ...editingSubCat, category_id: val })}>
                                    <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                                    <SelectContent>
                                        {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.title}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Sub-Category Name</Label>
                                <Input value={editingSubCat.name} onChange={e => setEditingSubCat({ ...editingSubCat, name: e.target.value })} placeholder="e.g., Fullstack Developer" />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSubCatModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveSubCat} disabled={isActionLoading} className="bg-slate-950 hover:bg-slate-900 text-white min-w-[100px]">
                            {isActionLoading ? <i className="fa-solid fa-spinner fa-spin" /> : "Save Sub-Category"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}

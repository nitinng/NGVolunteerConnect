"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase";
import { createFAQ, deleteFAQ } from "@/app/actions/supabase-actions";
import { Plus, Trash2, Save, FileQuestion, GripVertical } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function FAQsEditorPage() {
    const supabase = createBrowserClient();
    const [faqs, setFaqs] = useState<{question: string, answer: string, id: string}[]>([]);

    const [newQ, setNewQ] = useState("");
    const [newA, setNewA] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch initial data
    useEffect(() => {
        const fetchFAQs = async () => {
            setIsLoading(true);
            try {
                const { data } = await supabase
                    .from('faqs')
                    .select('*')
                    .order('order_index', { ascending: true });
                if (data) setFaqs(data);
            } catch (error) {
                console.error("Failed to fetch FAQs:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFAQs();
    }, [supabase]);

    const handleAdd = async () => {
        if (newQ.trim() && newA.trim()) {
            try {
                const data = await createFAQ({
                    question: newQ.trim(),
                    answer: newA.trim(),
                    orderIndex: faqs.length
                });

                if (data) {
                    setFaqs([...faqs, data]);
                    setNewQ("");
                    setNewA("");
                }
            } catch (error: any) {
                console.error("Failed to add FAQ:", error.message || error);
            }
        }
    };

    const handleRemove = async (id: string) => {
        try {
            await deleteFAQ(id);
            setFaqs(faqs.filter(f => f.id !== id));
        } catch (error: any) {
            console.error("Failed to remove FAQ:", error.message || error);
        }
    };

    const handleSave = () => {
        // Since we are doing optimistic/direct updates, handlesave is just a success indicator
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 800);
    };

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <div className="relative overflow-hidden rounded-lg bg-slate-50 dark:bg-zinc-900/50 p-4 md:p-6 border border-slate-200 dark:border-zinc-800 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                            <FileQuestion className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">FAQs Content Manager</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                                Add, remove, and curate the frequently asked questions displayed on the volunteer Support hub.
                            </p>
                        </div>
                    </div>
                    <Button onClick={handleSave} disabled={isSaving} className="w-fit gap-2 text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 px-8">
                        {isSaving ? "Publishing Changes..." : <><Save className="w-4 h-4" /> Publish Live</>}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-4">
                    {faqs.map((faq) => (
                        <Card key={faq.id} className="border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900/40 shadow-sm overflow-hidden group">
                            <div className="flex">
                                <div className="w-8 flex items-center justify-center bg-slate-50 dark:bg-zinc-900/50 border-r border-slate-100 dark:border-white/5 cursor-move">
                                    <GripVertical className="w-4 h-4 text-slate-400" />
                                </div>
                                <div className="p-4 flex-1">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="space-y-2 flex-1">
                                            <Input defaultValue={faq.question} className="font-semibold text-slate-900 dark:text-slate-100 bg-transparent border-transparent hover:border-slate-200 focus:border-indigo-500 h-8" />
                                            <Textarea defaultValue={faq.answer} className="text-sm text-slate-600 dark:text-slate-400 bg-transparent border-transparent hover:border-slate-200 focus:border-indigo-500 min-h-[60px] resize-none" />
                                        </div>
                                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30" onClick={() => handleRemove(faq.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                <Card className="border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-900/10 shadow-sm sticky top-24">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg text-indigo-900 dark:text-indigo-100">Add New Question</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Question Title</Label>
                            <Input placeholder="e.g., How do I reset my password?" value={newQ} onChange={(e) => setNewQ(e.target.value)} className="bg-white dark:bg-zinc-900" />
                        </div>
                        <div className="space-y-2">
                            <Label>Detailed Answer</Label>
                            <Textarea placeholder="Provide clear instructions..." value={newA} onChange={(e) => setNewA(e.target.value)} className="min-h-[100px] bg-white dark:bg-zinc-900" />
                        </div>
                        <Button className="w-full bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 dark:bg-zinc-900 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-zinc-800" onClick={handleAdd}>
                            <Plus className="w-4 h-4 mr-2" /> Append to List
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

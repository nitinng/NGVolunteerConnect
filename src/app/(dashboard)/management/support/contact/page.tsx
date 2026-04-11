"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase";
import { createDirectoryNode, deleteDirectoryNode } from "@/app/actions/supabase-actions";
import { 
    Plus, 
    Trash2, 
    Save, 
    Phone, 
    Mail, 
    MessageSquare, 
    CreditCard,
    GripVertical 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function ContactDirectoryEditorPage() {
    const supabase = createBrowserClient();
    const [contacts, setContacts] = useState<{id: string, type: string, title: string, value: string, icon: string}[]>([]);

    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [newTitle, setNewTitle] = useState("");
    const [newValue, setNewValue] = useState("");
    const [newType, setNewType] = useState("email");
    const [newIcon, setNewIcon] = useState("mail");

    // Fetch initial data
    useEffect(() => {
        const fetchDirectory = async () => {
            setIsLoading(true);
            try {
                const { data } = await supabase
                    .from('contact_directory')
                    .select('*')
                    .order('order_index', { ascending: true });
                if (data) setContacts(data);
            } catch (error) {
                console.error("Failed to fetch directory:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDirectory();
    }, [supabase]);

    const handleAdd = async () => {
        if (newTitle.trim() && newValue.trim()) {
            try {
                const data = await createDirectoryNode({
                    type: newType,
                    title: newTitle.trim(),
                    value: newValue.trim(),
                    icon: newIcon,
                    orderIndex: contacts.length
                });

                if (data) {
                    setContacts([...contacts, data]);
                    setNewTitle("");
                    setNewValue("");
                }
            } catch (error: any) {
                console.error("Failed to add node:", error.message || error);
            }
        }
    };

    const handleRemove = async (id: string) => {
        try {
            await deleteDirectoryNode(id);
            setContacts(contacts.filter(c => c.id !== id));
        } catch (error: any) {
            console.error("Failed to remove node:", error.message || error);
        }
    };

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 500);
    };

    const IconMap = {
        mail: Mail,
        phone: Phone,
        chat: MessageSquare,
        card: CreditCard
    };

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <div className="relative overflow-hidden rounded-lg bg-slate-50 dark:bg-zinc-900/50 p-4 md:p-6 border border-slate-200 dark:border-zinc-800 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                            <Phone className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Directory Configuration</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                                Manage the frontend contact directory cards seen by users.
                            </p>
                        </div>
                    </div>
                    <Button onClick={handleSave} disabled={isSaving} className="w-fit gap-2 text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 px-8">
                        {isSaving ? "Publishing Changes..." : <><Save className="w-4 h-4" /> Publish Live</>}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Active Directory Cards */}
                <div className="lg:col-span-2 space-y-4">
                    {contacts.map((contact) => {
                        const IconElement = IconMap[contact.icon as keyof typeof IconMap] || Mail;
                        
                        return (
                            <Card key={contact.id} className="border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900/40 shadow-sm overflow-hidden group hover:border-indigo-500/30 transition-colors">
                                <div className="flex">
                                    <div className="w-8 flex items-center justify-center bg-slate-50 dark:bg-zinc-900/50 border-r border-slate-100 dark:border-white/5 cursor-move">
                                        <GripVertical className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="p-4 flex-1">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className={`p-3 rounded-lg flex items-center justify-center ${contact.type === 'phone' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                                                    <IconElement className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Input defaultValue={contact.title} className="font-semibold text-slate-900 dark:text-slate-100 bg-transparent border-transparent hover:border-slate-200 focus:border-indigo-500 h-8 flex-1" />
                                                        <Badge variant="secondary" className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 dark:bg-zinc-800 shrink-0 border-none">{contact.type} node</Badge>
                                                    </div>
                                                    <Input defaultValue={contact.value} className="text-sm text-slate-500 dark:text-slate-400 bg-transparent border-transparent hover:border-slate-200 focus:border-indigo-500 h-8 font-mono" />
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 shrink-0" onClick={() => handleRemove(contact.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {/* Add New Directory Node Builder */}
                <Card className="border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-900/10 shadow-sm sticky top-24">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg text-indigo-900 dark:text-indigo-100">Add New Node</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Node Type</Label>
                            <Select value={newType} onValueChange={setNewType}>
                                <SelectTrigger className="bg-white dark:bg-zinc-900">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="email">Email Address</SelectItem>
                                    <SelectItem value="phone">Phone / WhatsApp</SelectItem>
                                    <SelectItem value="link">External Link / Web Form</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Label / Title</Label>
                            <Input placeholder="e.g. Finance Hub" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="bg-white dark:bg-zinc-900" />
                        </div>
                        <div className="space-y-2">
                            <Label>Value / Identity</Label>
                            <Input placeholder="finance@navgurukul.org" value={newValue} onChange={(e) => setNewValue(e.target.value)} className="bg-white dark:bg-zinc-900 font-mono" />
                        </div>
                        <div className="space-y-2">
                            <Label>Icon Strategy</Label>
                            <Select value={newIcon} onValueChange={setNewIcon}>
                                <SelectTrigger className="bg-white dark:bg-zinc-900">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="mail"><span className="flex items-center gap-2"><Mail className="w-3.5 h-3.5"/> Mail</span></SelectItem>
                                    <SelectItem value="phone"><span className="flex items-center gap-2"><Phone className="w-3.5 h-3.5"/> Phone</span></SelectItem>
                                    <SelectItem value="chat"><span className="flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5"/> Chat Bubble</span></SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button className="w-full bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 dark:bg-zinc-900 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-zinc-800 mt-2" onClick={handleAdd}>
                            <Plus className="w-4 h-4 mr-2" /> Add Contact Node
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

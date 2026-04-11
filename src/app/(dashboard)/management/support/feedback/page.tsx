"use client";

import { useState } from "react";
import { 
    Plus, Trash2, Save, MessageSquare, ClipboardList, PenTool, ArrowLeft, 
    Type, AlignLeft, Hash, List, CheckSquare, Star, SlidersHorizontal, 
    Smile, Mail, HelpCircle, GripVertical, Settings2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

const BLOCK_CATEGORIES = [
    {
        name: "Basic Inputs",
        blocks: [
            { icon: Type, label: "Short Text", desc: "Names, roles, one-line answers" },
            { icon: AlignLeft, label: "Long Text", desc: "Detailed feedback, suggestions" },
            { icon: Mail, label: "Email Field", desc: "Validated email input" },
            { icon: List, label: "Dropdown", desc: "Select from a list" },
            { icon: CheckSquare, label: "Checkboxes", desc: "Multiple choice" }
        ]
    },
    {
        name: "Rating & Scale",
        blocks: [
            { icon: Star, label: "Star Rating", desc: "1-5 visual stars" },
            { icon: Hash, label: "Numeric Scale", desc: "1-10 rating scale" },
            { icon: SlidersHorizontal, label: "Likert Scale", desc: "Strongly Agree -> Disagree" },
            { icon: Smile, label: "NPS Score", desc: "Likelihood to recommend (0-10)" }
        ]
    },
    {
        name: "Qualitative & Emotional",
        blocks: [
            { icon: HelpCircle, label: "Open Prompt", desc: "Follow-up 'Why?' prompts" },
            { icon: Smile, label: "Sentiment Meter", desc: "Emoji-based mood selection" }
        ]
    }
];

export default function FeedbackFormsEditorPage() {
    const [forms, setForms] = useState([
        { id: 1, title: "Platform Experience Feedback", desc: "Collect overarching platform feedback via star ratings and comments.", fieldsCount: 3, active: true },
        { id: 2, title: "Program Check-in Survey", desc: "End of month check-in asking volunteers about their mentorship success.", fieldsCount: 5, active: false }
    ]);

    const [editingFormId, setEditingFormId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    // Form Builder States Mock
    const [formCanvas, setFormCanvas] = useState([
        { id: '1', type: 'Star Rating', label: 'How would you rate your overall experience?', required: true },
        { id: '2', type: 'Long Text', label: 'What worked well and what could be improved?', required: false },
        { id: '3', type: 'Dropdown', label: 'Which department are you from?', required: true }
    ]);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 800);
    };

    const editingForm = forms.find(f => f.id === editingFormId);

    if (editingFormId) {
        return (
            <div className="flex flex-1 flex-col h-full bg-slate-50/50 dark:bg-zinc-950">
                <div className="border-b border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => setEditingFormId(null)}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                Form Builder: {editingForm?.title}
                            </h2>
                            <p className="text-xs text-slate-500">Add logic blocks, rating meters, and core fields.</p>
                        </div>
                    </div>
                    <Button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        {isSaving ? "Saving Schema..." : <><Save className="w-4 h-4 mr-2" /> Save Schema</>}
                    </Button>
                </div>

                <div className="flex flex-1 overflow-hidden h-full max-h-[80vh]">
                    {/* Left Palette */}
                    <div className="w-72 border-r border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900/40 p-4 overflow-y-auto">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Block Library</h3>
                        <div className="space-y-6">
                            {BLOCK_CATEGORIES.map((cat, i) => (
                                <div key={i}>
                                    <h4 className="text-xs font-bold text-indigo-500 mb-2">{cat.name}</h4>
                                    <div className="grid grid-cols-1 gap-2">
                                        {cat.blocks.map((block, j) => (
                                            <div key={j} className="flex items-center gap-3 p-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 hover:border-indigo-500 cursor-grab hover:shadow-sm transition-all group">
                                                <div className="p-1.5 rounded-md bg-white dark:bg-zinc-800 text-slate-500 group-hover:text-indigo-500 border border-slate-200 dark:border-zinc-700">
                                                    <block.icon className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{block.label}</p>
                                                    <p className="text-[10px] text-slate-500">{block.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Main Canvas */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-100/50 dark:bg-zinc-950">
                        <div className="max-w-2xl mx-auto space-y-4 pb-20">
                            {/* Intro Block */}
                            <Card className="border-t-4 border-t-indigo-500 border-x-slate-200 border-b-slate-200 dark:border-x-white/10 dark:border-b-white/10 shadow-sm relative overflow-hidden">
                                <CardHeader className="bg-white dark:bg-zinc-900">
                                    <Input defaultValue={editingForm?.title} className="text-2xl font-black h-12 border-transparent px-0 rounded-none focus-visible:ring-0 focus-visible:border-b-indigo-500" />
                                    <Textarea defaultValue={editingForm?.desc} className="mt-2 border-transparent px-0 rounded-none focus-visible:ring-0 focus-visible:border-b-indigo-500 resize-none min-h-[40px] text-slate-500" />
                                </CardHeader>
                            </Card>

                            {/* Form Fields Canvas */}
                            {formCanvas.map((item, idx) => (
                                <Card key={item.id} className="border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-sm overflow-visible group relative">
                                    <div className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center bg-slate-50 dark:bg-zinc-950 border-r border-slate-100 dark:border-white/5 cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
                                        <GripVertical className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="p-5 pl-12 flex flex-col gap-4">
                                        <div className="flex justify-between items-start">
                                            <Input defaultValue={item.label} className="font-semibold text-slate-800 dark:text-slate-200 border-transparent bg-slate-50 dark:bg-zinc-800/50 w-2/3 h-10" />
                                            <Badge variant="outline" className="bg-slate-100 dark:bg-zinc-800 text-slate-500">{item.type}</Badge>
                                        </div>
                                        <div className="p-4 border border-dashed border-slate-200 dark:border-white/10 rounded-lg bg-slate-50/50 dark:bg-zinc-900/20 text-sm text-slate-400 pointer-events-none">
                                            {item.type.includes('Text') ? 'User input flows here...' : 'Interactive widget renders here...'}
                                        </div>
                                        <div className="flex justify-end items-center gap-4 pt-4 border-t border-slate-100 dark:border-white/5 mt-2">
                                            <div className="flex items-center gap-2">
                                                <Switch id={`req-${item.id}`} defaultChecked={item.required} />
                                                <Label htmlFor={`req-${item.id}`} className="text-xs font-medium cursor-pointer">Required</Label>
                                            </div>
                                            <div className="w-px h-4 bg-slate-200 dark:bg-zinc-800" />
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-500">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}

                            <div className="pt-8 flex justify-center">
                                <Button variant="outline" className="border-dashed border-2 border-indigo-200 dark:border-indigo-900 text-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20">
                                    <Plus className="w-4 h-4 mr-2" /> Add Next Block
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <div className="relative overflow-hidden rounded-lg bg-slate-50 dark:bg-zinc-900/50 p-4 md:p-6 border border-slate-200 dark:border-zinc-800 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Feedback Systems Manager</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                                Build and manage dynamic feedback modules using the Drag-and-Drop schema builder.
                            </p>
                        </div>
                    </div>
                    <Button className="w-fit gap-2 text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 px-6">
                        <Plus className="w-4 h-4" /> Create Empty Module
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {forms.map((form) => (
                    <Card key={form.id} className={`border-slate-200 dark:border-white/10 ${form.active ? 'bg-white dark:bg-zinc-900/40' : 'bg-slate-50 opacity-60 dark:bg-zinc-900/20'} shadow-sm overflow-hidden transition-all group`}>
                        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-5 flex-1 w-full">
                                <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex shrink-0 items-center justify-center">
                                    <ClipboardList className="w-8 h-8" />
                                </div>
                                <div className="space-y-1.5 flex-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{form.title}</h3>
                                        {form.active ? (
                                            <Badge variant="outline" className="border-emerald-200 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 shrink-0 uppercase text-[9px] font-black tracking-wider">Live Active</Badge>
                                        ) : (
                                            <Badge variant="outline" className="border-slate-200 text-slate-500 bg-slate-100 dark:bg-zinc-800 dark:border-zinc-700 shrink-0 uppercase text-[9px] font-black tracking-wider">Draft Mode</Badge>
                                        )}
                                    </div>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 w-full max-w-2xl">{form.desc}</p>
                                    
                                    <div className="flex items-center gap-4 pt-2">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border border-slate-200 dark:border-zinc-800 px-2 py-1 rounded-md bg-white dark:bg-zinc-900">{form.fieldsCount} Fields Configured</span>
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border border-slate-200 dark:border-zinc-800 px-2 py-1 rounded-md bg-white dark:bg-zinc-900">0 Logic Rules</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 ml-auto md:ml-0 shrink-0">
                                <div className="flex items-center gap-2 mr-4">
                                    <Switch id={`active-${form.id}`} defaultChecked={form.active} />
                                    <Label htmlFor={`active-${form.id}`} className="text-xs font-bold text-slate-500 uppercase">Live</Label>
                                </div>
                                <Button className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-slate-200" onClick={() => setEditingFormId(form.id)}>
                                    <PenTool className="w-4 h-4 mr-2" /> Build Schema
                                </Button>
                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent">
                                    <Settings2 className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

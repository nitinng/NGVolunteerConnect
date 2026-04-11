"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
    getDepartments,
    getGlobalOnboardingEnabled,
    setGlobalOnboardingEnabled,
    getVolunteersOnboardingStatus,
    updateVolunteerOnboardingStatus
} from "@/app/actions/general-onboarding-actions";
import { Target, ListTodo, Plus, Trash2, Edit2, GripVertical, CheckCircle2, Settings, Lock, Unlock, Search, UserCheck, Info } from "lucide-react";
import LoadingView, { LoadingSpinner } from "@/components/loading-view";
import OnboardingFlowBuilder from "@/components/onboarding-flow-builder";
import * as Icons from "lucide-react";

export default function OnboardingAdminView() {
    const [isLoading, setIsLoading] = useState(true);
    const [departments, setDepartments] = useState<any[]>([]);

    // Settings State
    const [globalEnabled, setGlobalEnabled] = useState(true);
    const [volunteerStatus, setVolunteerStatus] = useState<any[]>([]);
    const [settingsSearch, setSettingsSearch] = useState("");
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const deps = await getDepartments();
            const globOnbEnabled = await getGlobalOnboardingEnabled();
            const volStatus = await getVolunteersOnboardingStatus();
            
            setDepartments(deps);
            setGlobalEnabled(globOnbEnabled);
            setVolunteerStatus(volStatus);
        } catch (error: any) {
            toast.error("Failed to load settings data", { description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleToggleGlobalOnboarding = async () => {
        setIsSavingSettings(true);
        try {
            await setGlobalOnboardingEnabled(!globalEnabled);
            setGlobalEnabled(!globalEnabled);
            toast.success(`Onboarding is now ${!globalEnabled ? 'unlocked' : 'locked'} for everyone.`);
        } catch (e: any) {
            toast.error("Failed to update setting");
        } finally {
            setIsSavingSettings(false);
        }
    };

    const handleUpdateUserStatus = async (id: string, status: 'default' | 'locked' | 'unlocked') => {
        setIsSavingSettings(true);
        try {
            await updateVolunteerOnboardingStatus(id, status);
            setVolunteerStatus(prev => prev.map(v => v.id === id ? { ...v, onboarding_status: status } : v));
            toast.success("Status updated");
        } catch (e: any) {
            toast.error("Failed to update status");
        } finally {
            setIsSavingSettings(false);
        }
    };

    const filteredVolunteers = volunteerStatus.filter(v => 
        v.full_name?.toLowerCase().includes(settingsSearch.toLowerCase()) || 
        v.email?.toLowerCase().includes(settingsSearch.toLowerCase())
    );

    if (isLoading) return <div className="flex justify-center p-12"><LoadingSpinner size="md" /></div>;

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

            <Tabs defaultValue="management" className="mt-4">
                <TabsList className="grid w-full max-w-lg grid-cols-3">
                    <TabsTrigger value="management">1. Configuration</TabsTrigger>
                    <TabsTrigger value="volunteers">2. Volunteer Status</TabsTrigger>
                    <TabsTrigger value="settings">3. Permissions</TabsTrigger>
                </TabsList>


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

                {/* 4. SETTINGS TAB */}
                <TabsContent value="settings" className="mt-6 flex flex-col gap-8">
                    {/* Global Toggle */}
                    <Card className="border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900/40 shadow-sm">
                        <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b border-slate-100 dark:border-white/5 pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Settings className="w-5 h-5 text-indigo-500" />
                                        Global Access Control
                                    </CardTitle>
                                    <CardDescription>
                                        Control the default visibility of General Onboarding for all volunteers.
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                     <Badge variant="outline" className={globalEnabled ? "text-emerald-600 border-emerald-200 bg-emerald-50" : "text-rose-600 border-rose-200 bg-rose-50"}>
                                        {globalEnabled ? "Currently Unlocked" : "Currently Locked"}
                                    </Badge>
                                    <Button 
                                        variant={globalEnabled ? "destructive" : "default"} 
                                        size="sm" 
                                        onClick={handleToggleGlobalOnboarding}
                                        disabled={isSavingSettings}
                                        className={!globalEnabled ? "bg-emerald-600 hover:bg-emerald-700" : "flex items-center gap-2"}
                                    >
                                        {isSavingSettings ? (
                                            <>
                                                <LoadingSpinner size="sm" />
                                                <span>Processing...</span>
                                            </>
                                        ) : (
                                            <>
                                                {globalEnabled ? <Lock className="w-4 h-4 mr-1" /> : <Unlock className="w-4 h-4 mr-1" />}
                                                {globalEnabled ? "Lock for Everyone" : "Unlock for Everyone"}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-4 p-4 rounded-lg bg-indigo-50/50 border border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-900/30">
                                <Info className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                                <div className="text-sm text-indigo-800 dark:text-indigo-300">
                                    <p className="font-semibold mb-1">How it works</p>
                                    <ul className="list-disc pl-4 space-y-1">
                                        <li><strong>Unlocked:</strong> Volunteers see their onboarding modules immediately after registration.</li>
                                        <li><strong>Locked:</strong> Onboarding is hidden until an Admin unlocks it. Percentage cards show "Locked" status.</li>
                                        <li><strong>Important:</strong> Individual overrides set in the table below take priority over this global setting.</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Volunteer List Override */}
                    <Card className="border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900/40 shadow-sm">
                        <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b border-slate-100 dark:border-white/5 pb-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <UserCheck className="w-5 h-5 text-emerald-500" />
                                        Volunteer Access Overrides
                                    </CardTitle>
                                    <CardDescription>
                                        Grant or revoke access to specific individuals regardless of global settings.
                                    </CardDescription>
                                </div>
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input 
                                        placeholder="Search volunteers..." 
                                        value={settingsSearch}
                                        onChange={e => setSettingsSearch(e.target.value)}
                                        className="pl-9 h-9"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50/30 dark:bg-zinc-900/10">
                                    <TableRow className="border-slate-100 dark:border-white/5">
                                        <TableHead className="pl-6 w-[35%]">Volunteer</TableHead>
                                        <TableHead className="w-[15%]">Progress</TableHead>
                                        <TableHead className="w-[20%]">Status Override</TableHead>
                                        <TableHead className="pr-6 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredVolunteers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-12 text-slate-400 text-sm">
                                                No volunteers found matching your search.
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredVolunteers.map(vol => (
                                        <TableRow key={vol.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-900/40 transition-colors">
                                            <TableCell className="pl-6 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold shrink-0">
                                                        {vol.full_name?.charAt(0) || 'V'}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-sm">{vol.full_name}</span>
                                                        <span className="text-[10px] text-slate-400">{vol.email}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-indigo-500 transition-all" style={{ width: `${vol.onboarding_percentage || 0}%` }} />
                                                    </div>
                                                    <span className="text-[10px] font-bold min-w-[30px]">{vol.onboarding_percentage || 0}%</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {vol.onboarding_status === 'locked' && <Badge className="bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100 shadow-none text-[10px] gap-1"><Lock className="w-2 h-2"/> Locked</Badge>}
                                                    {vol.onboarding_status === 'unlocked' && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 shadow-none text-[10px] gap-1"><Unlock className="w-2 h-2"/> Unlocked</Badge>}
                                                    {vol.onboarding_status === 'default' && <Badge variant="outline" className="text-slate-400 border-slate-200 text-[10px]">Global Default</Badge>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="pr-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Select 
                                                        value={vol.onboarding_status} 
                                                        onValueChange={(val: any) => handleUpdateUserStatus(vol.id, val)}
                                                        disabled={isSavingSettings}
                                                    >
                                                        <SelectTrigger className="h-8 w-[140px] text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="default">Follow Global</SelectItem>
                                                            <SelectItem value="locked">Force Lock</SelectItem>
                                                            <SelectItem value="unlocked">Force Unlock</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    getPotentialHosts,
    getPotentialParticipants,
    createWebinarAction,
    updateWebinarAction
} from "@/app/actions/webinar-actions";
import { getDepartments, Department } from "@/app/actions/general-onboarding-actions";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Loader2, Calendar, Target, Users2, Info, Search, Building2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Webinar, WebinarStatus } from "@/lib/supabase";

type WebinarWithRelations = Webinar & {
    webinar_hosts: { profile_id: string }[];
    webinar_participants: { profile_id: string }[];
};

interface WebinarModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    webinar?: WebinarWithRelations | null;
}

export default function WebinarModal({ isOpen, onClose, onSuccess, webinar }: WebinarModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Potentials
    const [potentialHosts, setPotentialHosts] = useState<any[]>([]);
    const [potentialParticipants, setPotentialParticipants] = useState<any[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    
    // Search terms
    const [hostSearch, setHostSearch] = useState("");
    const [participantSearch, setParticipantSearch] = useState("");

    // Form State
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [agenda, setAgenda] = useState("");
    const [department, setDepartment] = useState("");
    const [gmeetLink, setGmeetLink] = useState("");
    const [isOpenToAll, setIsOpenToAll] = useState(true);
    const [sessionType, setSessionType] = useState<'one_off' | 'recurring'>('one_off');
    const [selectedHostIds, setSelectedHostIds] = useState<string[]>([]);
    const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                setIsLoading(true);
                try {
                    const [hosts, participants, depts] = await Promise.all([
                        getPotentialHosts(),
                        getPotentialParticipants(),
                        getDepartments()
                    ]);
                    setPotentialHosts(hosts);
                    setPotentialParticipants(participants);
                    setDepartments(depts);
                    
                    if (webinar) {
                        // Pre-populate for edit
                        setTitle(webinar.title);
                        // Format date for datetime-local input (YYYY-MM-DDThh:mm)
                        const d = new Date(webinar.date);
                        const formattedDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                        setDate(formattedDate);
                        setAgenda(webinar.agenda || "");
                        setDepartment(webinar.department || "");
                        setGmeetLink(webinar.gmeet_link || "");
                        setIsOpenToAll(webinar.is_open_to_all);
                        setSessionType(webinar.type || 'one_off');
                        setSelectedHostIds(webinar.webinar_hosts.map(h => h.profile_id));
                        setSelectedParticipantIds(webinar.webinar_participants.map(p => p.profile_id));
                    } else {
                        resetFormFields(depts);
                    }
                } catch (error) {
                    console.error("Failed to fetch data:", error);
                    toast.error("Could not load form lists");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();
        }
    }, [isOpen, webinar]);

    const resetFormFields = (depts: Department[]) => {
        setTitle("");
        setDate("");
        setAgenda("");
        setDepartment(depts[0]?.name || "");
        setGmeetLink("");
        setIsOpenToAll(true);
        setSessionType('one_off');
        setSelectedHostIds([]);
        setSelectedParticipantIds([]);
    };

    // Filtering logic
    const filteredHosts = potentialHosts.filter(host =>
        host.full_name?.toLowerCase().includes(hostSearch.toLowerCase()) ||
        host.email?.toLowerCase().includes(hostSearch.toLowerCase())
    );

    const filteredParticipants = potentialParticipants.filter(p =>
        p.full_name?.toLowerCase().includes(participantSearch.toLowerCase())
    );

    const handleSubmit = async (status: WebinarStatus = 'planned') => {
        if (!title || !date) {
            toast.error("Please fill in the title and date");
            return;
        }

        setIsSaving(true);
        try {
            const params = {
                title,
                date: new Date(date).toISOString(),
                agenda,
                department,
                gmeet_link: gmeetLink,
                is_open_to_all: isOpenToAll,
                hostIds: selectedHostIds,
                participantIds: selectedParticipantIds,
                status,
                type: sessionType
            };

            if (webinar?.id) {
                await updateWebinarAction(webinar.id, params);
                toast.success("Webinar updated successfully");
            } else {
                await createWebinarAction(params);
                toast.success(status === 'draft' ? "Draft saved" : "Webinar scheduled successfully");
            }
            
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Failed to process webinar");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleHost = (id: string) => {
        setSelectedHostIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleParticipant = (id: string) => {
        setSelectedParticipantIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] sm:max-w-[95vw] w-full max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-6 bg-slate-50 dark:bg-zinc-900 border-b">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 bg-indigo-600 rounded-md text-white">
                            {webinar ? <Pencil className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                        </div>
                        <DialogTitle className="text-xl font-bold tracking-tight">
                            {webinar ? "Edit Webinar Details" : "Schedule New Webinar"}
                        </DialogTitle>
                    </div>
                    <DialogDescription>
                        {webinar ? "Modify the session details and target audience." : "Set up a new session and define your target audience."}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white dark:bg-zinc-950">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                        {/* Section 1: Details */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-indigo-600 border-b pb-2">
                                <Info className="w-4 h-4" />
                                <h3 className="text-sm font-bold uppercase tracking-wider">General Information</h3>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title" className="text-xs font-bold text-slate-500 uppercase">Webinar Title *</Label>
                                    <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Tech Mentorship 101" className="h-10 focus-visible:ring-indigo-500" />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="date" className="text-xs font-bold text-slate-500 uppercase">Start Date & Time *</Label>
                                        <Input id="date" type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="h-10 text-xs sm:text-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="dept" className="text-xs font-bold text-slate-500 uppercase">Department</Label>
                                        <div className="relative">
                                            <select
                                                id="dept"
                                                value={department}
                                                onChange={e => setDepartment(e.target.value)}
                                                className="w-full h-10 px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                                            >
                                                {isLoading ? (
                                                    <option>Loading departments...</option>
                                                ) : (
                                                    departments.map(d => (
                                                        <option key={d.id} value={d.name}>{d.name}</option>
                                                    ))
                                                )}
                                                {!isLoading && departments.length === 0 && <option value="">No departments found</option>}
                                            </select>
                                            <Building2 className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="link" className="text-xs font-bold text-slate-500 uppercase">Google Meet Link</Label>
                                    <Input id="link" value={gmeetLink} onChange={e => setGmeetLink(e.target.value)} placeholder="https://meet.google.com/..." className="h-10" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="agenda" className="text-xs font-bold text-slate-500 uppercase">Agenda / Key Points</Label>
                                    <Textarea id="agenda" value={agenda} onChange={e => setAgenda(e.target.value)} placeholder="What will be covered?" className="min-h-[120px] resize-none" />
                                </div>

                                <div className="pt-4 border-t">
                                    <Label className="text-xs font-bold text-slate-500 uppercase block mb-3">Session Type</Label>
                                    <div className="flex gap-4">
                                        <button 
                                            type="button"
                                            onClick={() => setSessionType('one_off')}
                                            className={`flex-1 p-3 rounded-lg border text-left transition-all ${sessionType === 'one_off' ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600' : 'border-slate-200 hover:border-slate-300'}`}
                                        >
                                            <p className="text-sm font-bold">One-time Session</p>
                                            <p className="text-[10px] text-slate-500">Standalone webinar event.</p>
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setSessionType('recurring')}
                                            className={`flex-1 p-3 rounded-lg border text-left transition-all ${sessionType === 'recurring' ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600' : 'border-slate-200 hover:border-slate-300'}`}
                                        >
                                            <p className="text-sm font-bold">Recurring Series</p>
                                            <p className="text-[10px] text-slate-500">Repeats on a schedule.</p>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Roles */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-indigo-600 border-b pb-2">
                                <Users2 className="w-4 h-4" />
                                <h3 className="text-sm font-bold uppercase tracking-wider">Assign Roles</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between mb-1">
                                        <Label className="text-xs font-bold text-slate-500 uppercase">Session Hosts</Label>
                                        <div className="relative w-48">
                                            <Search className="absolute left-2 top-1.5 w-3 h-3 text-slate-400" />
                                            <Input
                                                value={hostSearch}
                                                onChange={e => setHostSearch(e.target.value)}
                                                placeholder="Search staff..."
                                                className="h-7 pl-7 text-[10px] bg-slate-50 dark:bg-white/5"
                                            />
                                        </div>
                                    </div>
                                    <div className="border rounded-lg p-3 bg-slate-50 dark:bg-zinc-900/50">
                                        {isLoading ? (
                                            <div className="flex items-center justify-center py-6"><Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading...</div>
                                        ) : (
                                            <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                                                {filteredHosts.map(host => (
                                                    <div key={host.id} className="flex items-center space-x-2 p-1 hover:bg-white dark:hover:bg-zinc-800 rounded transition-colors">
                                                        <Checkbox id={`host-${host.id}`} checked={selectedHostIds.includes(host.id)} onCheckedChange={() => toggleHost(host.id)} />
                                                        <label htmlFor={`host-${host.id}`} className="text-xs font-medium cursor-pointer flex-1">
                                                            {host.full_name}
                                                        </label>
                                                    </div>
                                                ))}
                                                {filteredHosts.length === 0 && (
                                                    <p className="text-[10px] text-slate-400 text-center py-4 italic">No matching staff found.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <div className="flex items-center justify-between p-3 rounded-lg border bg-indigo-50/20 dark:bg-indigo-900/10">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="open-all" className="text-sm font-bold">Open to all Volunteers</Label>
                                            <p className="text-[10px] text-slate-500">Makes the session visible to every volunteer.</p>
                                        </div>
                                        <Switch id="open-all" checked={isOpenToAll} onCheckedChange={setIsOpenToAll} />
                                    </div>

                                    {!isOpenToAll && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex items-center justify-between mb-1 text-indigo-600">
                                                <div className="flex items-center gap-2">
                                                    <Target className="w-4 h-4" />
                                                    <Label className="text-xs font-bold uppercase">Targeted Audience</Label>
                                                </div>
                                                <div className="relative w-48">
                                                    <Search className="absolute left-2 top-1.5 w-3 h-3 text-indigo-400" />
                                                    <Input
                                                        value={participantSearch}
                                                        onChange={e => setParticipantSearch(e.target.value)}
                                                        placeholder="Search volunteers..."
                                                        className="h-7 pl-7 text-[10px] border-indigo-100 bg-indigo-50/10 focus-visible:ring-indigo-500"
                                                    />
                                                </div>
                                            </div>
                                            <div className="border border-indigo-100 rounded-lg p-3 bg-indigo-50/10 h-[220px] overflow-hidden">
                                                {isLoading ? (
                                                    <div className="flex items-center justify-center h-full"><Loader2 className="w-4 h-4 animate-spin" /></div>
                                                ) : (
                                                    <div className="space-y-2 h-full overflow-y-auto pr-2 custom-scrollbar">
                                                        {filteredParticipants.map(v => (
                                                            <div key={v.id} className="flex items-center space-x-2 p-1 hover:bg-indigo-50/50 rounded transition-colors">
                                                                  <Checkbox id={`v-${v.id}`} checked={selectedParticipantIds.includes(v.id)} onCheckedChange={() => toggleParticipant(v.id)} />
                                                                  <label htmlFor={`v-${v.id}`} className="text-xs font-medium cursor-pointer">
                                                                       {v.full_name}
                                                                  </label>
                                                            </div>
                                                        ))}
                                                        {filteredParticipants.length === 0 && (
                                                            <p className="text-[10px] text-indigo-400 text-center py-8 italic">No matching volunteers found.</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 bg-slate-50 dark:bg-zinc-900 border-t flex items-center justify-between gap-4">
                    <p className="hidden sm:block text-[10px] text-slate-400 font-medium">
                        * Required fields. Session will be published as 'Planned'.
                    </p>
                    <div className="flex gap-3 ml-auto">
                        <Button variant="ghost" onClick={onClose} disabled={isSaving} className="text-slate-500 hover:text-slate-700">Discard</Button>
                        {!webinar && (
                            <Button 
                                variant="outline" 
                                onClick={() => handleSubmit('draft')} 
                                disabled={isSaving} 
                                className="border-slate-300 min-w-[120px]"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save as Draft"}
                            </Button>
                        )}
                        <Button 
                            onClick={() => handleSubmit(webinar?.status === 'draft' ? 'planned' : (webinar?.status || 'planned'))} 
                            disabled={isSaving} 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]"
                        >
                            {isSaving ? (
                                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</>
                            ) : (
                                webinar?.status === 'draft' ? "Publish Session" : (webinar ? "Update Details" : "Schedule Session")
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

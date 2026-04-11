"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase";
import { 
    updateTicketInternal, 
    addTicketResponse, 
    getAllTickets, 
    getTicketTimeline,
    getEligibleStaff,
    updateTicketFull
} from "@/app/actions/supabase-actions";
import { useUserContext } from "@/contexts/user-context";
import { toast } from "sonner";
import { 
    Ticket, 
    Search, 
    Filter, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    MoreHorizontal,
    ArrowLeft,
    Send,
    MessageSquare,
    UserCircle,
    Paperclip
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AllTicketsPage() {
    const user = useUserContext();
    const supabase = createBrowserClient();
    const [tickets, setTickets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
    const [replyText, setReplyText] = useState("");
    const [isSendingReply, setIsSendingReply] = useState(false);
    const [eligibleStaff, setEligibleStaff] = useState<any[]>([]);

    // Fetch initial data
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                // Fetch ALL tickets using Server Action (Staff Bypass)
                const tks = await getAllTickets();
                if (tks) setTickets(tks);

                // Fetch eligible staff for assignment
                const staff = await getEligibleStaff();
                setEligibleStaff(staff);
            } catch (error: any) {
                console.error("Failed to fetch initial data:", error.message || error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const handleSelectTicket = async (t: any) => {
        setIsLoading(true);
        try {
            // Fetch timeline using Server Action (Staff Bypass)
            const timelineData = await getTicketTimeline(t.id);
            setSelectedTicket({ ...t, timeline: timelineData });
        } catch (error: any) {
            console.error("Failed to fetch timeline:", error.message || error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        setSelectedTicket(null);
        setReplyText("");
    };

    const handleSendReply = async () => {
        if (!replyText.trim() || !selectedTicket) return;
        setIsSendingReply(true);
        
        try {
            const newEvent = await addTicketResponse({
                ticketId: selectedTicket.id,
                authorName: user?.fullName || "Staff",
                content: replyText
            });

            if (newEvent) {
                setSelectedTicket({
                    ...selectedTicket,
                    timeline: [...(selectedTicket.timeline || []), newEvent]
                });
                setReplyText("");
            }
        } catch (error: any) {
            console.error("Failed to send reply:", error.message || error);
        } finally {
            setIsSendingReply(false);
        }
    };

    const handleSaveTicket = async () => {
        if (!selectedTicket) return;
        setIsSaving(true);
        try {
            const updates = {
                status: selectedTicket.status,
                priority: selectedTicket.priority,
                departments: selectedTicket.departments,
                assigned_users: selectedTicket.assigned_users || [] // UUID array
            };

            const updatedTicket = await updateTicketFull(selectedTicket.id, updates, user?.fullName || "Staff");
            
            // Sync local list
            setTickets(tickets.map(tk => tk.id === selectedTicket.id ? { ...tk, ...updates } : tk));
            
            // Refresh timeline for the system note
            const timelineData = await getTicketTimeline(selectedTicket.id);
            setSelectedTicket({ ...selectedTicket, ...updates, timeline: timelineData });
            
            toast.success("Ticket updated successfully!");
        } catch (error: any) {
            console.error("Failed to save ticket:", error.message || error);
            toast.error("Failed to save: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateField = (field: string, value: any) => {
        setSelectedTicket({ ...selectedTicket, [field]: value });
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        const day = d.getDate();
        const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
        const month = d.toLocaleString('en-GB', { month: 'short' });
        const year = String(d.getFullYear()).slice(2);
        const time = d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        return `${day}${suffix} ${month}'${year}, ${time}`;
    };

    const StatusBadge = ({ status }: { status: string }) => {
        switch(status) {
            case "Resolved": return <Badge className="bg-emerald-100/80 text-emerald-700 hover:bg-emerald-100 border-emerald-200 shadow-none"><CheckCircle2 className="w-3 h-3 mr-1" /> {status}</Badge>;
            case "In Progress": return <Badge className="bg-amber-100/80 text-amber-700 hover:bg-amber-100 border-amber-200 shadow-none"><AlertCircle className="w-3 h-3 mr-1" /> {status}</Badge>;
            case "Open": return <Badge className="bg-blue-100/80 text-blue-700 hover:bg-blue-100 border-blue-200 shadow-none"><Clock className="w-3 h-3 mr-1" /> {status}</Badge>;
            default: return <Badge className="bg-slate-100/80 text-slate-700 hover:bg-slate-100 border-slate-300 shadow-none">{status}</Badge>;
        }
    };

    if (selectedTicket) {
        // Detailed View Mode
        return (
            <div className="flex flex-1 flex-col gap-4 p-4 md:p-8 max-w-7xl mx-auto w-full">
                <Button variant="ghost" onClick={handleBack} className="w-fit text-slate-500 hover:text-slate-900 -ml-2 mb-2">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to All Tickets
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        {/* Ticket Context Header */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded dark:bg-zinc-800">{selectedTicket.id}</span>
                                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400">{selectedTicket.category}</Badge>
                                {selectedTicket.priority === 'High' && <Badge variant="outline" className="text-rose-500 border-rose-200">High Priority</Badge>}
                            </div>
                            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
                                {selectedTicket.subject}
                            </h2>
                        </div>

                        {/* Thread Container */}
                        <div className="flex flex-col gap-4">
                            {/* Original Request */}
                            <div className="p-5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900/40 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-slate-300 dark:bg-zinc-700" />
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400">
                                            <UserCircle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{selectedTicket.profiles?.full_name || 'Volunteer'}</p>
                                            <p className="text-xs text-slate-500">{selectedTicket.profiles?.email} • {formatDate(selectedTicket.created_at)}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap ml-11">
                                    {selectedTicket.description}
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="relative pl-6 border-l-2 border-slate-200 dark:border-white/10 ml-4 space-y-6 mt-4">
                                {selectedTicket.timeline?.map((event: any) => (
                                    <div key={event.id} className="relative">
                                        <div className="absolute -left-[35px] top-1 w-6 h-6 rounded-full bg-slate-100 dark:bg-zinc-800 border-2 border-white dark:border-zinc-950 flex items-center justify-center shadow-sm">
                                            {event.type === 'message' && <MessageSquare className="w-3 h-3 text-indigo-500" />}
                                            {event.type === 'status' && <AlertCircle className="w-3 h-3 text-amber-500" />}
                                            {event.type === 'assignment' && <UserCircle className="w-3 h-3 text-emerald-500" />}
                                            {event.type === 'creation' && <Clock className="w-3 h-3 text-slate-500" />}
                                        </div>
                                        
                                        {event.type === 'message' ? (
                                            <div className={`p-4 rounded-xl border ${event.author_role?.includes("Management") || event.author_role?.includes("Operations") || event.author_role === "Staff" ? "border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-900/10" : "border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900/40"} shadow-sm relative overflow-hidden`}>
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{event.author_name}</p>
                                                        {(event.author_role?.includes("Staff") || event.author_role?.includes("Operations")) && <Badge variant="outline" className="text-[9px] h-4 px-1.5 uppercase font-black tracking-widest bg-indigo-50 border-indigo-200 text-indigo-600">Staff</Badge>}
                                                    </div>
                                                    <p className="text-xs text-slate-500">{formatDate(event.created_at)}</p>
                                                </div>
                                                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                                    {event.text_content}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-1 py-1">
                                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                                    <span className="font-bold text-slate-900 dark:text-slate-200">{event.author_name}</span> 
                                                    {` ${event.text_content}`}
                                                </p>
                                                <p className="text-xs text-slate-400">{formatDate(event.created_at)}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Reply Box */}
                        <div className="mt-2 relative">
                            <Textarea 
                                placeholder="Write a response to the volunteer..." 
                                className="min-h-[120px] pb-14 bg-white dark:bg-zinc-900/50 resize-y border-slate-200 focus-visible:ring-indigo-500"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                            />
                            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                                <Button size="sm" variant="ghost" className="text-slate-500 h-8 px-2"><Paperclip className="w-4 h-4 mr-1"/> Attach</Button>
                                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm" onClick={handleSendReply} disabled={isSendingReply}>
                                    <Send className="w-3.5 h-3.5 mr-2" />
                                    {isSendingReply ? "Sending..." : "Send Reply"}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Meta Management Sidebar */}
                    <div className="flex flex-col gap-4">
                        <Card className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-900/40 shadow-sm sticky top-24">
                            <CardHeader className="p-4 border-b border-slate-200 dark:border-white/5 pb-3">
                                <CardTitle className="text-sm text-slate-500 font-bold uppercase tracking-wider">Manage Ticket</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-5">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-slate-500 uppercase">Current Status</Label>
                                    <Select value={selectedTicket.status} onValueChange={(val) => handleUpdateField('status', val)}>
                                        <SelectTrigger className="bg-white dark:bg-zinc-900 border-slate-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Open">Open</SelectItem>
                                            <SelectItem value="In Progress">In Progress</SelectItem>
                                            <SelectItem value="Resolved">Resolved</SelectItem>
                                            <SelectItem value="Closed">Closed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 flex flex-col">
                                    <Label className="text-xs font-semibold text-slate-500 uppercase">Departments</Label>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-left font-normal bg-white dark:bg-zinc-900 border-slate-200 overflow-hidden text-ellipsis whitespace-nowrap">
                                                {selectedTicket.departments?.length > 0 ? selectedTicket.departments.join(", ") : "Select Departments"}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-56">
                                            {['Operations', 'IT', 'Academics', 'Human Resources', 'Finance'].map(dept => (
                                                <DropdownMenuCheckboxItem 
                                                    key={dept} 
                                                    checked={selectedTicket.departments?.includes(dept)}
                                                    onCheckedChange={(checked) => {
                                                        const newVal = checked 
                                                            ? [...(selectedTicket.departments || []), dept] 
                                                            : (selectedTicket.departments || []).filter((d: any) => d !== dept);
                                                        handleUpdateField('departments', newVal);
                                                    }}
                                                >
                                                    {dept}
                                                </DropdownMenuCheckboxItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <div className="space-y-2 flex flex-col">
                                    <Label className="text-xs font-semibold text-slate-500 uppercase">Assigned To</Label>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-left font-normal bg-white dark:bg-zinc-900 border-slate-200 overflow-hidden text-ellipsis whitespace-nowrap">
                                                {selectedTicket.assigned_users?.length > 0 
                                                    ? eligibleStaff.filter(s => selectedTicket.assigned_users?.includes(s.id)).map(s => s.full_name).join(", ")
                                                    : "Select People"}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-56">
                                            {eligibleStaff.map(staff => (
                                                <DropdownMenuCheckboxItem 
                                                    key={staff.id} 
                                                    checked={selectedTicket.assigned_users?.includes(staff.id)}
                                                    onCheckedChange={(checked) => {
                                                        const newVal = checked 
                                                            ? [...(selectedTicket.assigned_users || []), staff.id] 
                                                            : (selectedTicket.assigned_users || []).filter((id: string) => id !== staff.id);
                                                        handleUpdateField('assigned_users', newVal);
                                                    }}
                                                >
                                                    {staff.full_name}
                                                </DropdownMenuCheckboxItem>
                                            ))}
                                            {eligibleStaff.length === 0 && <DropdownMenuItem disabled>No staff available</DropdownMenuItem>}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-slate-500 uppercase">Priority Level</Label>
                                    <Select value={selectedTicket.priority} onValueChange={(val) => handleUpdateField('priority', val)}>
                                        <SelectTrigger className="bg-white dark:bg-zinc-900 border-slate-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Low">Low</SelectItem>
                                            <SelectItem value="Medium">Medium</SelectItem>
                                            <SelectItem value="High">High</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="pt-2">
                                    <Button 
                                        className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-zinc-800 dark:text-slate-200 dark:hover:bg-zinc-700 font-bold"
                                        onClick={handleSaveTicket}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? "Saving..." : "Save Changes"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </div>
        );
    }


    // List View Mode
    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <div className="relative overflow-hidden rounded-lg bg-white dark:bg-zinc-900/50 p-4 md:p-6 border border-slate-200 dark:border-zinc-800 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                            <Ticket className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">All Tickets Dashboard</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                                Manage incoming volunteer requests, route issues, and monitor resolutions.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Filters Toolkit */}
            <div className="flex flex-col md:flex-row gap-3 pt-2">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                        placeholder="Search tickets by ID, subject, or user..." 
                        className="pl-9 bg-white dark:bg-zinc-900/50 border-slate-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[160px] bg-white dark:bg-zinc-900/50">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Resolved">Resolved</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full md:w-[160px] bg-white dark:bg-zinc-900/50">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="Ops">Ops</SelectItem>
                        <SelectItem value="Tech Issue">Tech Issue</SelectItem>
                        <SelectItem value="Academic Support">Academic Support</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                    </SelectContent>
                </Select>
                <Select defaultValue="newest">
                    <SelectTrigger className="w-full md:w-[180px] bg-white dark:bg-zinc-900/50">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="priority">Highest Priority</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Tickets Table / List */}
            <div className="border rounded-md bg-white dark:bg-zinc-950/50 shadow-sm overflow-x-auto">
                <Table className="min-w-[1100px]">
                    <TableHeader className="bg-slate-50/50 dark:bg-zinc-900/20">
                        <TableRow className="hover:bg-transparent border-slate-100 dark:border-white/5 border-b">
                            <TableHead className="w-[90px] text-[90%] font-bold text-slate-900 dark:text-slate-100 px-4 md:px-6 py-4">ID</TableHead>
                            <TableHead className="min-w-[200px] text-[90%] font-bold text-slate-900 dark:text-slate-100 px-4 md:px-6 py-4">Subject & Requester</TableHead>
                            <TableHead className="w-[120px] text-[90%] font-bold text-slate-900 dark:text-slate-100 px-4 md:px-6 py-4">Category</TableHead>
                            <TableHead className="w-[150px] text-[90%] font-bold text-slate-900 dark:text-slate-100 px-4 md:px-6 py-4">Department</TableHead>
                            <TableHead className="w-[140px] text-[90%] font-bold text-slate-900 dark:text-slate-100 px-4 md:px-6 py-4">Assigned To</TableHead>
                            <TableHead className="w-[120px] text-[90%] font-bold text-slate-900 dark:text-slate-100 px-4 md:px-6 py-4">Status</TableHead>
                            <TableHead className="w-[100px] text-[90%] font-bold text-slate-900 dark:text-slate-100 px-4 md:px-6 py-4">Priority</TableHead>
                            <TableHead className="w-[120px] text-[90%] font-bold text-slate-900 dark:text-slate-100 px-4 md:px-6 py-4">Date Created</TableHead>
                            <TableHead className="w-[80px] text-right text-[90%] font-bold text-slate-900 dark:text-slate-100 px-4 md:px-6 py-4">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
                        {isLoading && tickets.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-20 text-slate-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                                        <p>Loading records...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : tickets.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-20 text-slate-400 font-medium">
                                    No tickets found matching your filters.
                                </TableCell>
                            </TableRow>
                        ) : tickets.filter(t => {
                            const matchSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                              t.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                              t.ticket_number?.toString().includes(searchTerm);
                            const matchStatus = statusFilter === "all" || t.status === statusFilter;
                            const matchCategory = categoryFilter === "all" || t.category === categoryFilter;
                            return matchSearch && matchStatus && matchCategory;
                        }).map((t) => (
                            <TableRow 
                                key={t.id} 
                                className="hover:bg-slate-50/80 dark:hover:bg-zinc-900/60 transition-colors group cursor-pointer border-slate-100 dark:border-white/5" 
                                onClick={() => handleSelectTicket(t)}
                            >
                                <TableCell className="text-[90%] font-bold text-slate-500 px-4 md:px-6 py-4">#{t.ticket_number}</TableCell>
                                <TableCell className="px-4 md:px-6 py-4 pr-4">
                                    <p className="font-bold text-slate-900 dark:text-slate-100 text-[90%] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate text-wrap">{t.title}</p>
                                    <p className="text-[90%] text-slate-500 mt-0.5 max-w-[200px] md:max-w-xs truncate">{t.profiles?.full_name} • {t.profiles?.email}</p>
                                </TableCell>
                                <TableCell className="px-4 md:px-6 py-4">
                                    <Badge variant="secondary" className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 font-medium text-[90%]">{t.category}</Badge>
                                </TableCell>
                                <TableCell className="text-[90%] font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px] px-4 md:px-6 py-4">
                                    {t.departments?.join(", ") || "Unrouted"}
                                </TableCell>
                                <TableCell className="text-[90%] font-medium text-slate-700 dark:text-slate-300 truncate max-w-[140px] px-4 md:px-6 py-4">
                                    {t.assigned_users?.length > 0 
                                        ? eligibleStaff.filter(s => t.assigned_users.includes(s.id)).map(s => s.full_name).join(", ")
                                        : "Unassigned"}
                                </TableCell>
                                <TableCell className="px-4 md:px-6 py-4">
                                    <StatusBadge status={t.status} />
                                </TableCell>
                                <TableCell className="px-4 md:px-6 py-4">
                                    {t.priority === 'High' && <span className="text-[90%] font-bold text-rose-500 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/> High</span>}
                                    {t.priority === 'Medium' && <span className="text-[90%] font-medium text-amber-500">Medium</span>}
                                    {t.priority === 'Low' && <span className="text-[90%] font-medium text-slate-400">Low</span>}
                                </TableCell>
                                <TableCell className="px-4 md:px-6 py-4 text-[90%] font-medium text-slate-500">
                                    {new Date(t.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right px-4 md:px-6 py-4">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 group-hover:text-indigo-600 opacity-50 group-hover:opacity-100 transition-all z-10" onClick={(e) => { e.stopPropagation(); handleSelectTicket(t); }}>
                                        <MessageSquare className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

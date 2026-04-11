"use client";

import { useEffect, useState } from "react";
import { 
    HelpCircle, 
    MessageSquare, 
    Mail, 
    FileQuestion, 
    Send,
    BookOpen,
    Users,
    Settings,
    Ticket,
    Clock,
    CheckCircle2,
    AlertCircle,
    Paperclip,
    Phone,
    Plus,
    X,
    Star,
    MessageCircleHeart,
    ArrowLeft,
    ClipboardList
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useUserContext } from "@/contexts/user-context";
import { createBrowserClient } from "@/lib/supabase";
import { createTicket, getMyTickets, getFAQs, getDirectory, getTicketingConfig, getTicketTimeline, addTicketResponse } from "@/app/actions/supabase-actions";

interface TicketData {
    id: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    created_at: string;
    attachments: string[];
}

export default function SupportCenterPage() {
    const user = useUserContext();
    const supabase = createBrowserClient();
    const [activeTab, setActiveTab] = useState("faqs");
    
    // Data States
    const [tickets, setTickets] = useState<TicketData[]>([]);
    const [faqs, setFaqs] = useState<{question: string, answer: string, id: string}[]>([]);
    const [directory, setDirectory] = useState<{title: string, value: string, type: string, icon: string, id: string}[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [priorities, setPriorities] = useState<string[]>([]);

    // Loading/UI States
    const [isCreatingTicket, setIsCreatingTicket] = useState(false);
    const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    
    // Form Inputs (Controlled)
    const [ticketCategory, setTicketCategory] = useState("Other");
    const [ticketPriority, setTicketPriority] = useState("Medium");
    
    const [activeFeedbackFormId, setActiveFeedbackFormId] = useState<number | null>(null);
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
    const [feedbackSuccess, setFeedbackSuccess] = useState(false);

    // Ticket Detail View States
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
    const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [isSendingReply, setIsSendingReply] = useState(false);

    const activeFeedbackForms = [
        { id: 1, title: "Platform Experience Feedback", desc: "Let us know how we can improve the Volunteer Connect portal visually and functionally.", fieldsCount: 3 },
        { id: 2, title: "Program Check-in Survey", desc: "End of month check-in asking volunteers about their mentorship success.", fieldsCount: 5 }
    ];

    // Fetch live data from Supabase
    useEffect(() => {
        const fetchSupportData = async () => {
            setIsLoadingData(true);
            try {
                // 1. Fetch User Tickets
                const ticketList = await getMyTickets();
                setTickets(ticketList as TicketData[]);

                // 2. Fetch FAQs
                const faqList = await getFAQs();
                setFaqs(faqList);

                // 3. Fetch Directory
                const dirList = await getDirectory();
                setDirectory(dirList);

                // 4. Fetch Config (Categories/Priorities)
                const config = await getTicketingConfig();
                setCategories(config.categories);
                setPriorities(config.priorities);

            } catch (error: any) {
                console.error("Support Center fetch loop failed:", error.message || error);
            } finally {
                setIsLoadingData(false);
            }
        };

        if (user?.id) {
            fetchSupportData();
        }
    }, [user?.id]);

    const handleTicketSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmittingTicket(true);
        
        const form = e.currentTarget;
        const titleValue = (form.elements.namedItem('title') as HTMLInputElement).value;
        const descValue = (form.elements.namedItem('description') as HTMLTextAreaElement).value;

        try {
            // Using Server Action for reliable insertion
            const data = await createTicket({
                title: titleValue,
                description: descValue,
                category: ticketCategory,
                priority: ticketPriority,
            });

            if (data) {
                setTickets([data as any, ...tickets]);
                setIsCreatingTicket(false);
                setIsSubmittingTicket(false);
            }
        } catch (error: any) {
            console.error("Ticket submission failed:", error.message || error);
            setIsSubmittingTicket(false);
        }
    };

    const handleSelectTicket = async (t: TicketData) => {
        setIsLoadingTimeline(true);
        try {
            const timeline = await getTicketTimeline(t.id);
            setSelectedTicket({ ...t, timeline });
        } catch (error: any) {
            console.error("Failed to fetch ticket timeline:", error.message || error);
        } finally {
            setIsLoadingTimeline(false);
        }
    };

    const handleSendReply = async () => {
        if (!replyText.trim() || !selectedTicket) return;
        setIsSendingReply(true);
        
        try {
            const newEvent = await addTicketResponse({
                ticketId: selectedTicket.id,
                authorName: user?.fullName || "Volunteer",
                content: replyText,
                authorRole: "Volunteer"
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

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleString('en-US', { 
            day: 'numeric', 
            month: 'short', 
            year: '2-digit', 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
        });
    };

    const handleFeedbackSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmittingFeedback(true);
        
        setTimeout(() => {
            setIsSubmittingFeedback(false);
            setFeedbackSuccess(true);
            (e.target as HTMLFormElement).reset();
            
            setTimeout(() => {
                setFeedbackSuccess(false);
            }, 3000);
        }, 1200);
    };

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
            {/* Header / Control Center Card */}
            <div className="relative overflow-hidden rounded-lg bg-slate-50 dark:bg-zinc-900/50 p-4 md:p-6 border border-slate-200 dark:border-white/10 shadow-sm group transition-all hover:bg-slate-100 dark:hover:bg-zinc-900/80">
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                            <HelpCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                                Support & Help Center
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                                Get help, track your requests, contact the team, or share feedback.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions Navigation Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-2">
                {/* FAQs Card */}
                <Card 
                    className={`p-1 relative group cursor-pointer border-slate-200 dark:border-white/10 transition-all shadow-sm hover:shadow-md overflow-hidden rounded-lg ${activeTab === 'faqs' ? 'ring-2 ring-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10' : 'bg-white dark:bg-zinc-950'}`}
                    onClick={() => setActiveTab("faqs")}
                >
                    <div className="absolute top-0 right-0 p-3 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                        <FileQuestion className="w-12 h-12 text-indigo-500" />
                    </div>
                    <CardHeader className="p-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <FileQuestion className="w-4 h-4" />
                        </div>
                        <CardTitle className="text-sm font-bold truncate">FAQs</CardTitle>
                        <CardDescription className="text-[10px] truncate">Instant answers</CardDescription>
                    </CardHeader>
                </Card>

                {/* Tickets Card */}
                <Card 
                    className={`p-1 relative group cursor-pointer border-slate-200 dark:border-white/10 transition-all shadow-sm hover:shadow-md overflow-hidden rounded-lg ${activeTab === 'tickets' ? 'ring-2 ring-orange-500 bg-orange-50/50 dark:bg-orange-900/10' : 'bg-white dark:bg-zinc-950'}`}
                    onClick={() => { setActiveTab("tickets"); setIsCreatingTicket(false); }}
                >
                    <div className="absolute top-0 right-0 p-3 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                        <Ticket className="w-12 h-12 text-orange-500" />
                    </div>
                    <CardHeader className="p-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <Ticket className="w-4 h-4" />
                        </div>
                        <CardTitle className="text-sm font-bold truncate">Tickets</CardTitle>
                        <CardDescription className="text-[10px] truncate">Team support</CardDescription>
                    </CardHeader>
                </Card>

                {/* Contact Card */}
                <Card 
                    className={`p-1 relative group cursor-pointer border-slate-200 dark:border-white/10 transition-all shadow-sm hover:shadow-md overflow-hidden rounded-lg ${activeTab === 'contact' ? 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : 'bg-white dark:bg-zinc-950'}`}
                    onClick={() => setActiveTab("contact")}
                >
                    <div className="absolute top-0 right-0 p-3 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                        <Phone className="w-12 h-12 text-blue-500" />
                    </div>
                    <CardHeader className="p-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <Phone className="w-4 h-4" />
                        </div>
                        <CardTitle className="text-sm font-bold truncate">Contact Us</CardTitle>
                        <CardDescription className="text-[10px] truncate">Direct reach</CardDescription>
                    </CardHeader>
                </Card>

                {/* Feedback Card */}
                <Card 
                    className={`p-1 relative group cursor-pointer border-slate-200 dark:border-white/10 transition-all shadow-sm hover:shadow-md overflow-hidden rounded-lg ${activeTab === 'feedback' ? 'ring-2 ring-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10' : 'bg-white dark:bg-zinc-950'}`}
                    onClick={() => setActiveTab("feedback")}
                >
                    <div className="absolute top-0 right-0 p-3 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                        <MessageSquare className="w-12 h-12 text-emerald-500" />
                    </div>
                    <CardHeader className="p-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <MessageSquare className="w-4 h-4" />
                        </div>
                        <CardTitle className="text-sm font-bold truncate">Feedback</CardTitle>
                        <CardDescription className="text-[10px] truncate">Share ideas</CardDescription>
                    </CardHeader>
                </Card>

                {/* Resources Card */}
                <Card 
                    className={`p-1 relative group cursor-pointer border-slate-200 dark:border-white/10 transition-all shadow-sm hover:shadow-md overflow-hidden rounded-lg ${activeTab === 'resources' ? 'ring-2 ring-rose-500 bg-rose-50/50 dark:bg-rose-900/10' : 'bg-white dark:bg-zinc-950'}`}
                    onClick={() => setActiveTab("resources")}
                >
                    <div className="absolute top-0 right-0 p-3 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                        <BookOpen className="w-12 h-12 text-rose-500" />
                    </div>
                    <CardHeader className="p-3">
                        <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <BookOpen className="w-4 h-4" />
                        </div>
                        <CardTitle className="text-sm font-bold truncate">Resources</CardTitle>
                        <CardDescription className="text-[10px] truncate">Guides & docs</CardDescription>
                    </CardHeader>
                </Card>
            </div>

            {/* Main Content Area */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
                <div className="flex justify-start md:justify-center mb-8 w-full overflow-x-auto pb-4 no-scrollbar">
                    <TabsList className="inline-flex h-auto p-1 bg-slate-100 dark:bg-zinc-800 rounded-lg min-w-max">
                        <TabsTrigger value="faqs" className="rounded-md px-4 py-1.5 text-sm font-medium">
                            FAQs
                        </TabsTrigger>
                        <TabsTrigger value="tickets" className="rounded-md px-4 py-1.5 text-sm font-medium">
                            Tickets
                        </TabsTrigger>
                        <TabsTrigger value="contact" className="rounded-md px-4 py-1.5 text-sm font-medium">
                            Contact Us
                        </TabsTrigger>
                        <TabsTrigger value="feedback" className="rounded-md px-4 py-1.5 text-sm font-medium">
                            Feedback
                        </TabsTrigger>
                        <TabsTrigger value="resources" className="rounded-md px-4 py-1.5 text-sm font-medium">
                            Resources
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="faqs" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
                    <Card className="border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden flex flex-col rounded-lg">
                        <CardHeader className="pb-4 border-b border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-zinc-900/10">
                            <CardTitle className="text-xl flex items-center gap-2 text-slate-900 dark:text-white font-bold">
                                <FileQuestion className="w-5 h-5 text-indigo-500" />
                                Frequently Asked Questions
                            </CardTitle>
                            <CardDescription className="text-sm font-medium">
                                Find instant answers to the most common questions from our volunteer community.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {faqs.length === 0 ? (
                                <div className="text-center py-10 rounded-lg border border-dashed border-slate-200 dark:border-zinc-800">
                                    <p className="text-sm text-slate-500 font-medium tracking-tight">No FAQs available at this time.</p>
                                </div>
                            ) : (
                                <Accordion type="single" collapsible className="w-full">
                                    {faqs.map((faq) => (
                                        <AccordionItem key={faq.id} value={faq.id} className="border-slate-100 dark:border-zinc-800">
                                            <AccordionTrigger className="text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-indigo-600 transition-colors py-4">
                                                {faq.question}
                                            </AccordionTrigger>
                                            <AccordionContent className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed pb-4">
                                                {faq.answer}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="tickets" className="focus-visible:outline-none focus-visible:ring-0 space-y-4">
                    {!isCreatingTicket ? (
                        <Card className="border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden flex flex-col rounded-lg">
                            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-zinc-900/10">
                                <div>
                                    <CardTitle className="text-xl flex items-center gap-2 text-slate-900 dark:text-white font-bold">
                                        <Ticket className="w-5 h-5 text-indigo-500" />
                                        My Support Tickets
                                    </CardTitle>
                                    <CardDescription className="text-sm font-medium mt-0.5">
                                        Track the real-time status of your support inquiries and requests.
                                    </CardDescription>
                                </div>
                                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm" size="sm" onClick={() => { setIsCreatingTicket(true); setSelectedTicket(null); }}>
                                    <Plus className="w-4 h-4 mr-1.5" /> New Ticket
                                </Button>
                            </CardHeader>
                            <CardContent className="pt-4 px-4">
                                <div className="space-y-2 pb-2">
                                    {tickets.length === 0 ? (
                                        <div className="text-center py-14 rounded-lg border border-dashed border-slate-200 dark:border-zinc-800">
                                            <Ticket className="w-10 h-10 text-slate-300 dark:text-zinc-700 mx-auto mb-3" />
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">No tickets yet</h3>
                                            <p className="text-xs text-slate-400 mt-1">Submit a support request to track it here.</p>
                                        </div>
                                    ) : (
                                        tickets.map((t) => (
                                            <div 
                                                key={t.id} 
                                                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border border-slate-100 dark:border-zinc-900 bg-slate-50/30 dark:bg-zinc-900/20 hover:bg-white dark:hover:bg-zinc-900 hover:border-indigo-500/30 hover:shadow-sm transition-all gap-4 cursor-pointer group"
                                                onClick={() => handleSelectTicket(t)}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TKT-{t.id.slice(0,6)}</span>
                                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-2 bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-400">
                                                            {t.category}
                                                        </Badge>
                                                        {t.attachments?.length > 0 && <Paperclip className="w-3 h-3 text-slate-300" />}
                                                    </div>
                                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 transition-colors truncate">{t.title}</h4>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 uppercase">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(t.created_at).toLocaleDateString()}
                                                        </span>
                                                        <span className="text-slate-200 dark:text-zinc-800">•</span>
                                                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">Priority: {t.priority}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                                                    <div className="flex items-center text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all">
                                                        View <ArrowLeft className="w-3 h-3 ml-1 rotate-180" />
                                                    </div>
                                                    {t.status === "Resolved" && (
                                                        <Badge className="bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest border-emerald-200 px-2 py-0.5"><CheckCircle2 className="w-3 h-3 mr-1" /> Resolved</Badge>
                                                    )}
                                                    {t.status === "In Progress" && (
                                                        <Badge className="bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-widest border-amber-200 px-2 py-0.5"><AlertCircle className="w-3 h-3 mr-1" /> Active</Badge>
                                                    )}
                                                    {t.status === "Open" && (
                                                        <Badge className="bg-blue-100 text-blue-700 text-[9px] font-black uppercase tracking-widest border-blue-200 px-2 py-0.5"><Clock className="w-3 h-3 mr-1" /> Open</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-indigo-200 dark:border-indigo-900/50 bg-white dark:bg-zinc-950 shadow-md overflow-hidden flex flex-col rounded-lg">
                            <CardHeader className="pb-4 border-b border-indigo-50 dark:border-white/5 bg-indigo-50/30 dark:bg-indigo-900/10">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl text-indigo-900 dark:text-indigo-100 font-bold">Raise a Support Ticket</CardTitle>
                                        <CardDescription className="text-sm font-medium mt-0.5">
                                            Create a detailed request. Your ticket will be transparently assigned to the right team.
                                        </CardDescription>
                                    </div>
                                    <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:bg-slate-100" onClick={() => setIsCreatingTicket(false)}>
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 px-6">
                                <form onSubmit={handleTicketSubmit} className="space-y-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="category" className="text-xs font-bold text-slate-500 uppercase">Category</Label>
                                            <Select required value={ticketCategory} onValueChange={setTicketCategory}>
                                                <SelectTrigger className="rounded-lg h-10">
                                                    <SelectValue placeholder="Category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="priority" className="text-xs font-bold text-slate-500 uppercase">Priority</Label>
                                            <Select required value={ticketPriority} onValueChange={setTicketPriority}>
                                                <SelectTrigger className="rounded-lg h-10">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {priorities.map(pri => <SelectItem key={pri} value={pri}>{pri}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="title" className="text-xs font-bold text-slate-500 uppercase">Subject</Label>
                                        <Input id="title" name="title" placeholder="Clear summary of your request" required className="rounded-lg h-10" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="description" className="text-xs font-bold text-slate-500 uppercase">Description</Label>
                                        <Textarea 
                                            id="description" 
                                            name="description"
                                            placeholder="Please provide details..." 
                                            className="min-h-[140px] rounded-lg resize-none" 
                                            required 
                                        />
                                    </div>
                                    
                                    <div className="flex gap-3 justify-end pt-2">
                                        <Button type="button" variant="outline" className="rounded-lg font-bold" onClick={() => setIsCreatingTicket(false)} disabled={isSubmittingTicket}>
                                            Cancel
                                        </Button>
                                        <Button 
                                            type="submit" 
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg px-8 shadow-indigo-500/20 shadow-lg" 
                                            disabled={isSubmittingTicket}
                                        >
                                            {isSubmittingTicket ? "Submitting..." : "Submit Ticket"}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="contact" className="focus-visible:outline-none focus-visible:ring-0">
                    <Card className="border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden flex flex-col rounded-lg">
                        <CardHeader className="pb-4 border-b border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-zinc-900/10">
                            <CardTitle className="text-xl flex items-center gap-2 text-slate-900 dark:text-white font-bold">
                                <Phone className="w-5 h-5 text-indigo-500" />
                                Contact Directory
                            </CardTitle>
                            <CardDescription className="text-sm font-medium mt-0.5">
                                Need instant support? Reach out directly via our verified directory.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 px-4 pb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {directory.length === 0 ? (
                                    <>
                                        <a href="mailto:support@navgurukul.org" className="flex items-center justify-between p-3.5 rounded-lg border border-slate-100 dark:border-zinc-900 bg-slate-50/30 dark:bg-zinc-900/20 hover:bg-white dark:hover:bg-zinc-900 hover:border-indigo-500/30 hover:shadow-sm transition-all group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                    <Mail className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">General Support</h4>
                                                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">support@navgurukul.org</p>
                                                </div>
                                            </div>
                                            <div className="h-8 w-8 rounded-full flex items-center justify-center text-slate-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all opacity-0 group-hover:opacity-100">
                                                <Mail className="w-3.5 h-3.5" />
                                            </div>
                                        </a>
                                        <a href="tel:+919876543210" className="flex items-center justify-between p-3.5 rounded-lg border border-slate-100 dark:border-zinc-900 bg-slate-50/30 dark:bg-zinc-900/20 hover:bg-white dark:hover:bg-zinc-900 hover:border-indigo-500/30 hover:shadow-sm transition-all group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 group-hover:bg-orange-600 group-hover:text-white transition-all">
                                                    <Phone className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Emergency Hotline</h4>
                                                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">+91 98765 43210</p>
                                                </div>
                                            </div>
                                            <div className="h-8 w-8 rounded-full flex items-center justify-center text-slate-300 group-hover:text-orange-600 group-hover:bg-orange-50 transition-all opacity-0 group-hover:opacity-100">
                                                <Phone className="w-3.5 h-3.5" />
                                            </div>
                                        </a>
                                    </>
                                ) : (
                                    directory.map((item) => {
                                        const Icon = item.icon === 'mail' ? Mail : item.icon === 'phone' ? Phone : MessageSquare;
                                        const href = item.type === 'email' ? `mailto:${item.value}` : item.type === 'phone' ? `tel:${item.value}` : '#';
                                        return (
                                            <a href={href} key={item.id} className="flex items-center justify-between p-3.5 rounded-lg border border-slate-100 dark:border-zinc-900 bg-slate-50/30 dark:bg-zinc-900/20 hover:bg-white dark:hover:bg-zinc-900 hover:border-indigo-500/30 hover:shadow-sm transition-all group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h4>
                                                        <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">{item.value}</p>
                                                    </div>
                                                </div>
                                                <div className="h-8 w-8 rounded-full flex items-center justify-center text-slate-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all opacity-0 group-hover:opacity-100">
                                                    <Icon className="w-3.5 h-3.5" />
                                                </div>
                                            </a>
                                        );
                                    })
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="feedback" className="focus-visible:outline-none focus-visible:ring-0">
                    {!activeFeedbackFormId ? (
                        <div className="space-y-4">
                            <Card className="border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden flex flex-col rounded-lg">
                                <CardHeader className="pb-4 border-b border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-zinc-900/10">
                                    <CardTitle className="text-xl flex items-center gap-2 text-slate-900 dark:text-white font-bold">
                                        <MessageCircleHeart className="w-5 h-5 text-rose-500" />
                                        Share Your Feedback
                                    </CardTitle>
                                    <CardDescription className="text-sm font-medium mt-0.5">
                                        Choose an active module below to help us refine your volunteer experience.
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {activeFeedbackForms.map(form => (
                                    <Card key={form.id} className="border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-950 hover:bg-slate-50/50 dark:hover:bg-zinc-900/50 hover:border-rose-500/50 transition-all cursor-pointer group shadow-sm overflow-hidden rounded-lg" onClick={() => setActiveFeedbackFormId(form.id)}>
                                        <div className="p-4 flex items-center gap-4">
                                            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 flex shrink-0 items-center justify-center group-hover:scale-110 transition-transform">
                                                <ClipboardList className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors truncate">{form.title}</h3>
                                                <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">{form.desc}</p>
                                            </div>
                                            <ArrowLeft className="w-4 h-4 ml-auto text-slate-300 rotate-180 opacity-0 group-hover:opacity-100 transition-all" />
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <Card className="border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-950 shadow-lg overflow-hidden flex flex-col rounded-lg max-w-2xl mx-auto">
                            <CardHeader className="pb-4 border-b border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-zinc-900/10">
                                <div className="flex items-start gap-4">
                                    <Button variant="ghost" size="icon" className="shrink-0 rounded-full h-8 w-8 text-slate-400 hover:text-slate-900" onClick={() => setActiveFeedbackFormId(null)}>
                                        <ArrowLeft className="w-4 h-4" />
                                    </Button>
                                    <div>
                                        <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                                            {activeFeedbackForms.find(f => f.id === activeFeedbackFormId)?.title}
                                        </CardTitle>
                                        <CardDescription className="text-[13px] mt-0.5">
                                            {activeFeedbackForms.find(f => f.id === activeFeedbackFormId)?.desc}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <form onSubmit={handleFeedbackSubmit} className="space-y-6">
                                    <div className="space-y-3">
                                        <Label className="text-sm font-bold text-slate-800 dark:text-slate-200">1. Overall Platform Rating <span className="text-rose-500">*</span></Label>
                                        <div className="flex gap-2.5">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Button key={star} type="button" variant="outline" size="sm" className="rounded-lg h-10 w-10 hover:border-amber-500 hover:text-amber-500 bg-white dark:bg-zinc-900 border border-slate-200 transition-all">
                                                    <Star className="w-4 h-4" />
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-bold text-slate-800 dark:text-slate-200">2. Feedback & Suggestions</Label>
                                        <Textarea 
                                            required
                                            placeholder="Tell us what you think..." 
                                            className="min-h-[140px] rounded-lg resize-none text-sm" 
                                        />
                                    </div>
                                    
                                    <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold h-11 transition-all shadow-rose-500/20 shadow-lg" disabled={isSubmittingFeedback || feedbackSuccess}>
                                        {isSubmittingFeedback ? "Submitting..." : feedbackSuccess ? "Received! Thanks." : "Submit Feedback"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="resources" className="focus-visible:outline-none focus-visible:ring-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            {
                                icon: BookOpen,
                                title: "Volunteer Handbook",
                                description: "The essential guide to our values, policies, and volunteer expectations.",
                                badge: "Must Read",
                                badgeColor: "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/30"
                            },
                            {
                                icon: Users,
                                title: "Mentorship Guide",
                                description: "Best practices for mentoring students and organizing effective sessions.",
                                badge: "Featured",
                                badgeColor: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30"
                            },
                            {
                                icon: Settings,
                                title: "Platform Manual",
                                description: "How-to guide for navigating Volunteer Connect and managing your profile.",
                                badge: "Guide",
                                badgeColor: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30"
                            }
                        ].map((resource, i) => (
                            <Card key={i} className="border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden flex flex-col hover:border-indigo-500/30 transition-all group cursor-pointer rounded-lg">
                                <CardHeader className="p-4 pb-2">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                                            <resource.icon className="w-5 h-5" />
                                        </div>
                                        <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-widest ${resource.badgeColor}`}>
                                            {resource.badge}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                                        {resource.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 flex-1">
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                                        {resource.description}
                                    </p>
                                </CardContent>
                                <CardFooter className="p-4 pt-0 flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tight group-hover:translate-x-1 transition-all">
                                    View Document <Send className="w-3 h-3" />
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Ticket Detail Full-Size Modal */}
            <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
                <DialogContent className="max-w-none w-screen h-screen md:w-[98vw] md:h-[95vh] md:max-w-[98vw] p-0 flex flex-col overflow-hidden border-none shadow-2xl bg-slate-50 dark:bg-zinc-950 sm:max-w-none outline-none">
                    <DialogTitle className="sr-only">Support Ticket Detail - {selectedTicket?.title}</DialogTitle>
                    <DialogDescription className="sr-only">View and manage your support ticket timeline and details.</DialogDescription>
                    <div className="flex flex-1 overflow-hidden">
                        {selectedTicket && (
                            <div className="flex flex-1 flex-col overflow-hidden">
                                {/* Desktop Header */}
                                <div className="hidden md:flex items-center justify-between px-8 py-6 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-white/5 shadow-sm z-10 shrink-0">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-mono font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded">TKT-{selectedTicket.id.slice(0, 8)}</span>
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-slate-300 border-none font-bold text-[10px] uppercase tracking-widest">{selectedTicket.category}</Badge>
                                            <Badge className={
                                                selectedTicket.status === "Resolved" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" :
                                                selectedTicket.status === "In Progress" ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" :
                                                "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                                            }>
                                                {selectedTicket.status}
                                            </Badge>
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1 leading-tight">
                                            {selectedTicket.title}
                                        </h2>
                                    </div>
                                    <DialogClose asChild>
                                        <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                                            <X className="w-5 h-5" />
                                        </Button>
                                    </DialogClose>
                                </div>

                                {/* Main Content Splitted */}
                                <div className="flex flex-1 overflow-hidden">
                                    {/* Left: Timeline & Chat */}
                                    <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-zinc-900/20 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                                        <div className="max-w-5xl mx-auto w-full space-y-8">
                                            {/* Top Spacer for Mobile */}
                                            <div className="md:hidden h-12" />
                                            
                                            {/* Original Request Card */}
                                            <div className="group relative">
                                                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                                                <div className="relative p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/5 shadow-sm">
                                                    <div className="flex items-center gap-4 mb-6">
                                                        <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-500/20">
                                                            {user?.fullName?.charAt(0) || 'V'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{user?.fullName || 'Volunteer'}</p>
                                                            <p className="text-xs text-slate-400 font-bold mt-0.5">{formatDate(selectedTicket.created_at)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-base text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap pl-2 border-l-4 border-indigo-500/30">
                                                        {selectedTicket.description}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Dynamic Timeline */}
                                            <div className="relative pl-8 space-y-10">
                                                <div className="absolute left-3.5 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500/20 via-slate-200 to-transparent dark:via-white/5" />
                                                
                                                {isLoadingTimeline ? (
                                                    <div className="flex flex-col items-center py-12">
                                                        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-4">Loading messages...</p>
                                                    </div>
                                                ) : selectedTicket.timeline?.map((event: any) => (
                                                    <div key={event.id} className="relative group/item animate-in fade-in slide-in-from-bottom-2 duration-500">
                                                        <div className="absolute -left-[37px] top-1 w-8 h-8 rounded-xl bg-white dark:bg-zinc-900 border-2 border-slate-100 dark:border-zinc-800 flex items-center justify-center shadow-md z-10 group-hover/item:scale-110 transition-transform">
                                                            {event.type === 'message' && <MessageSquare className="w-4 h-4 text-indigo-500" />}
                                                            {event.type === 'status' && <AlertCircle className="w-4 h-4 text-amber-500" />}
                                                            {event.type === 'assignment' && <Users className="w-4 h-4 text-emerald-500" />}
                                                        </div>
                                                        
                                                        {event.type === 'message' ? (
                                                            <div className={`p-5 rounded-2xl shadow-sm border ${event.author_role === "Staff" ? "bg-indigo-50/40 border-indigo-100 dark:bg-indigo-500/5 dark:border-indigo-500/20" : "bg-white border-slate-100 dark:bg-zinc-800/40 dark:border-white/5"}`}>
                                                                <div className="flex justify-between items-center mb-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{event.author_name}</span>
                                                                        {event.author_role === "Staff" && (
                                                                            <Badge className="bg-indigo-600 text-[8px] h-3.5 px-1 font-black uppercase tracking-widest">Team</Badge>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(event.created_at)}</span>
                                                                </div>
                                                                <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                                                    {event.text_content}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="py-2 pl-4">
                                                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                                    <span className="text-slate-900 dark:text-white">{event.author_name}</span> 
                                                                    <span className="opacity-60">{event.text_content}</span>
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            {/* Footer Padding */}
                                            <div className="h-32" />
                                        </div>
                                    </div>

                                    {/* Right: Info Sidebar (Desktop Only) */}
                                    <div className="hidden lg:flex w-96 flex-col border-l border-slate-200 dark:border-white/5 bg-white dark:bg-zinc-900 p-8 space-y-8 overflow-y-auto shrink-0">
                                        <div className="space-y-6">
                                            <div>
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Priority Level</h4>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-3 h-3 rounded-full animate-pulse ${selectedTicket.priority === 'High' ? 'bg-rose-500 shadow-rose-500/50' : selectedTicket.priority === 'Low' ? 'bg-slate-400' : 'bg-amber-500 shadow-amber-500/50'} shadow-lg`} />
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{selectedTicket.priority} Priority</span>
                                                </div>
                                            </div>
                                            
                                            <div className="h-px bg-slate-100 dark:bg-white/5" />
                                            
                                            <div>
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Assignment Status</h4>
                                                <div className="flex flex-col gap-3">
                                                    <p className="text-xs font-bold text-slate-500 leading-relaxed">
                                                        This ticket is currently being reviewed by our <span className="text-indigo-600 dark:text-indigo-400">{selectedTicket.category || 'Support'}</span> team.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="h-px bg-slate-100 dark:bg-white/5" />

                                            <div>
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Time Elapsed</h4>
                                                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                                                    <Clock className="w-4 h-4 text-slate-400" />
                                                    <span className="text-xs font-bold">{new Date(selectedTicket.created_at).toLocaleDateString(undefined, { dateStyle: 'full' })}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-auto p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/20">
                                            <p className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 leading-relaxed italic">
                                                "Our mission is to ensure your volunteer journey stays smooth. Expect a resolution shortly."
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Reply Box */}
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[95%] md:w-[85%] max-w-4xl z-20">
                                    <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden p-2 flex gap-2 items-center">
                                        <Textarea 
                                            placeholder="Write your message here..." 
                                            className="min-h-[50px] max-h-[150px] py-3 px-4 bg-transparent border-none focus-visible:ring-0 resize-none font-medium custom-scrollbar"
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                        />
                                        <div className="flex gap-2 pr-2">
                                            <Button size="icon" variant="ghost" className="rounded-full h-10 w-10 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all shrink-0">
                                                <Paperclip className="w-5 h-5" />
                                            </Button>
                                            <Button 
                                                className="rounded-xl h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-600/20 transition-all shrink-0"
                                                onClick={handleSendReply}
                                                disabled={isSendingReply || !replyText.trim()}
                                            >
                                                {isSendingReply ? "..." : <><Send className="w-4 h-4 mr-2" /> Send</>}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

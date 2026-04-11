"use client";

import { useState } from "react";
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
import { 
    Trash2, 
    ExternalLink, 
    Users, 
    Calendar, 
    MoreHorizontal,
    Pencil,
    FileText,
    CheckCircle2,
    Clock,
    Target
} from "lucide-react";
import { deleteWebinarAction } from "@/app/actions/webinar-actions";
import { toast } from "sonner";
import { Webinar } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";

type WebinarWithRelations = Webinar & {
    webinar_hosts: { profile_id: string }[];
    webinar_participants: { profile_id: string }[];
};

interface WebinarListProps {
    webinars: WebinarWithRelations[];
    onRefresh: () => void;
    onEdit: (webinar: WebinarWithRelations) => void;
}

export default function WebinarList({ webinars, onRefresh, onEdit }: WebinarListProps) {
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this webinar?")) return;
        
        setIsDeleting(id);
        try {
            await deleteWebinarAction(id);
            toast.success("Webinar deleted successfully");
            onRefresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete webinar");
        } finally {
            setIsDeleting(null);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const drafts = webinars.filter(w => w.status === 'draft');
    const published = webinars.filter(w => w.status !== 'draft');

    const WebinarTable = ({ data }: { data: WebinarWithRelations[] }) => (
        <div className="rounded-xl border bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-zinc-900/50">
                    <TableRow>
                        <TableHead className="w-[300px] py-4 pl-6">Session Details</TableHead>
                        <TableHead className="py-4">Schedule</TableHead>
                        <TableHead className="py-4">Audience</TableHead>
                        <TableHead className="py-4 text-center">Status</TableHead>
                        <TableHead className="py-4 text-right pr-6">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-48 text-center text-slate-400 italic">
                                No sessions found in this category.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((webinar) => (
                            <TableRow key={webinar.id} className="hover:bg-slate-50/30 dark:hover:bg-zinc-900/10 transition-colors">
                                <TableCell className="py-5 pl-6">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-bold text-slate-900 dark:text-zinc-100">{webinar.title}</span>
                                        <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                                            {webinar.department || "General"} • {webinar.type === 'recurring' ? 'Recurring Series' : 'One-time Session'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="py-5">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-zinc-400">
                                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                        {formatDate(webinar.date)}
                                    </div>
                                </TableCell>
                                <TableCell className="py-5">
                                    <Badge variant={webinar.is_open_to_all ? "secondary" : "outline"} className="font-bold text-[10px] gap-1 px-2">
                                        {webinar.is_open_to_all ? (
                                            <>
                                                <Users className="w-3 h-3" />
                                                Open Access
                                            </>
                                        ) : (
                                            <>
                                                <Target className="w-3 h-3" />
                                                {webinar.webinar_participants?.length || 0} Targeted
                                            </>
                                        )}
                                    </Badge>
                                </TableCell>
                                <TableCell className="py-5 text-center">
                                    <Badge variant="outline" className={`font-bold text-[10px] uppercase tracking-wider ${
                                        webinar.status === 'draft' ? 'bg-slate-100 text-slate-600' :
                                        webinar.status === 'ongoing' ? 'bg-emerald-100 text-emerald-700' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                        {webinar.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="py-5 text-right pr-6">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => onEdit(webinar)}
                                            className="w-8 h-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-full"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        
                                        {webinar.gmeet_link && (
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                asChild
                                                className="w-8 h-8 hover:bg-blue-50 hover:text-blue-600 rounded-full"
                                            >
                                                <a href={webinar.gmeet_link} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </Button>
                                        )}
                                        
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => handleDelete(webinar.id)}
                                            disabled={isDeleting === webinar.id}
                                            className="w-8 h-8 hover:bg-rose-50 hover:text-rose-600 rounded-full"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );

    return (
        <div className="space-y-6">
            <Tabs defaultValue="published" className="w-full">
                <div className="flex items-center justify-between mb-4">
                    <TabsList className="bg-slate-100/50 dark:bg-zinc-900 p-1">
                        <TabsTrigger value="published" className="gap-2 font-bold px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <CheckCircle2 className="w-4 h-4" />
                            Published
                            <Badge variant="secondary" className="ml-1 text-[10px]">{published.length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="drafts" className="gap-2 font-bold px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <FileText className="w-4 h-4" />
                            Drafts
                            <Badge variant="secondary" className="ml-1 text-[10px]">{drafts.length}</Badge>
                        </TabsTrigger>
                    </TabsList>
                    
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        Last synced: {new Date().toLocaleTimeString()}
                    </div>
                </div>

                <TabsContent value="published" className="mt-0 focus-visible:outline-none">
                    <WebinarTable data={published} />
                </TabsContent>
                
                <TabsContent value="drafts" className="mt-0 focus-visible:outline-none">
                    <WebinarTable data={drafts} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

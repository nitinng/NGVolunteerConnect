"use client";

import { Video, Plus, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import WebinarList from "./components/WebinarList";
import WebinarModal from "./components/WebinarModal";
import { getWebinarsAction } from "@/app/actions/webinar-actions";
import { Webinar } from "@/lib/supabase";

type WebinarWithRelations = Webinar & {
    webinar_hosts: { profile_id: string }[];
    webinar_participants: { profile_id: string }[];
};

export default function WebinarsManagementPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [webinars, setWebinars] = useState<WebinarWithRelations[]>([]);
    const [selectedWebinar, setSelectedWebinar] = useState<WebinarWithRelations | null>(null);

    const fetchWebinars = async () => {
        setIsLoading(true);
        try {
            const data = await getWebinarsAction();
            setWebinars(data as WebinarWithRelations[]);
        } catch (error) {
            console.error("Failed to load webinars:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchWebinars();
    }, []);

    const handleAdd = () => {
        setSelectedWebinar(null);
        setIsModalOpen(true);
    };

    const handleEdit = (webinar: WebinarWithRelations) => {
        setSelectedWebinar(webinar);
        setIsModalOpen(true);
    };

    const handleSuccess = () => {
        fetchWebinars();
        setIsModalOpen(false);
    };

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="relative overflow-hidden rounded-lg bg-slate-50 dark:bg-zinc-900/50 p-4 md:p-6 border border-slate-200 dark:border-zinc-800 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                            <Video className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Webinar Manager</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                                Schedule new webinars, manage hosts, and target specific volunteer audiences.
                            </p>
                        </div>
                    </div>
                    <Button 
                        onClick={handleAdd}
                        className="w-fit gap-2 text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 px-8"
                    >
                        <Plus className="w-4 h-4" /> Add Webinar
                    </Button>
                </div>
            </div>

            {/* List Area */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed rounded-2xl bg-slate-50/50">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Synchronizing Sessions...</p>
                </div>
            ) : (
                <WebinarList 
                    webinars={webinars} 
                    onRefresh={fetchWebinars} 
                    onEdit={handleEdit} 
                />
            )}

            {/* Modal */}
            <WebinarModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSuccess={handleSuccess}
                webinar={selectedWebinar}
            />
        </div>
    );
}

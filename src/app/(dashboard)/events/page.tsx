"use client";

import { useEffect, useState } from "react";
import { getWebinarsForVolunteerAction } from "@/app/actions/webinar-actions";
import { Webinar } from "@/lib/supabase";
import {
    Video,
    Calendar,
    Building2,
    Loader2,
    Users,
    Lock,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function VolunteerEventsPage() {
    const [webinars, setWebinars] = useState<Webinar[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("this-week");

    useEffect(() => {
        const fetchEvents = async () => {
            setIsLoading(true);
            try {
                const data = await getWebinarsForVolunteerAction();
                setWebinars(data);
            } catch (error) {
                console.error("Failed to fetch events:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return {
            date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
        };
    };

    // Bucket events
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const pastEvents = webinars.filter(e => new Date(e.date) < now);
    const thisWeekEvents = webinars.filter(e => {
        const d = new Date(e.date);
        return d >= now && d <= sevenDaysLater;
    });
    const upcomingEvents = webinars.filter(e => new Date(e.date) > sevenDaysLater);

    const EventCard = ({ event, variant = "upcoming" }: { event: Webinar; variant?: "past" | "this-week" | "upcoming" }) => {
        const { time } = formatDate(event.date);

        const eventTime = new Date(event.date).getTime();
        const nowTime = new Date().getTime();
        const isLocked = eventTime - nowTime > 2 * 60 * 60 * 1000;

        const colors = {
            past: {
                border: "border-l-rose-300 border-slate-200 dark:border-zinc-800 opacity-80",
                chip: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/30",
                month: "text-rose-400 dark:text-rose-400",
                day: "text-rose-600 dark:text-rose-400",
                titleHover: "text-slate-500 dark:text-zinc-400",
                btn: "bg-rose-50 hover:bg-rose-50 text-rose-400 border-rose-200 cursor-not-allowed",
            },
            "this-week": {
                border: "border-l-emerald-500 border-slate-200 dark:border-zinc-800 hover:border-emerald-400/50 dark:hover:border-emerald-700/50",
                chip: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/40",
                month: "text-emerald-500 dark:text-emerald-400",
                day: "text-emerald-700 dark:text-emerald-300",
                titleHover: "text-slate-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors",
                btn: "bg-emerald-600 hover:bg-emerald-700 text-white",
            },
            upcoming: {
                border: "border-l-indigo-500 border-slate-200 dark:border-zinc-800 hover:border-indigo-400/50 dark:hover:border-indigo-700/50",
                chip: "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/40",
                month: "text-indigo-500 dark:text-indigo-400",
                day: "text-indigo-700 dark:text-indigo-300",
                titleHover: "text-slate-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors",
                btn: "bg-indigo-600 hover:bg-indigo-700 text-white",
            },
        }[variant];

        return (
            <div className={`group flex items-center gap-4 px-4 py-3.5 rounded-lg border-l-4 border bg-white dark:bg-zinc-950 shadow-sm hover:shadow-md transition-all duration-200 ${colors.border}`}>
                {/* Calendar chip */}
                <div className={`flex flex-col items-center justify-center w-11 h-11 rounded-lg shrink-0 border ${colors.chip}`}>
                    <span className={`text-[9px] font-bold uppercase leading-none ${colors.month}`}>
                        {new Date(event.date).toLocaleDateString('en-IN', { month: 'short' })}
                    </span>
                    <span className={`text-lg font-black leading-tight ${colors.day}`}>
                        {new Date(event.date).getDate()}
                    </span>
                </div>

                {/* Title + meta */}
                <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-bold truncate leading-snug ${colors.titleHover}`}>
                        {event.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <Building2 className="w-3 h-3 shrink-0" />
                        <span>{event.department || "General"}</span>
                        <span className="text-slate-200 dark:text-zinc-700">·</span>
                        <span className="tabular-nums">{time}</span>
                        <span className="text-slate-200 dark:text-zinc-700">·</span>
                        <Users className="w-3 h-3 shrink-0" />
                        <span>{event.is_open_to_all ? "Open to all" : "Targeted"}</span>
                    </p>
                </div>

                {/* Right: button */}
                <div className="flex items-center gap-3 shrink-0">
                    {variant === "past" ? (
                        <Button size="sm" disabled variant="outline" className="h-8 text-xs font-bold rounded-lg min-w-[110px] border-rose-200 text-rose-400">
                            <Video className="w-3.5 h-3.5 mr-1.5 opacity-50" />
                            Session Ended
                        </Button>
                    ) : !event.gmeet_link ? (
                        <Button size="sm" disabled variant="outline" className="h-8 text-xs font-bold rounded-lg min-w-[110px] border-rose-200 text-rose-500 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-400 disabled:opacity-100">
                            {isLocked ? <Lock className="w-3.5 h-3.5 mr-1.5 opacity-70" /> : <X className="w-3.5 h-3.5 mr-1.5 opacity-70" />}
                            Join Session
                        </Button>
                    ) : isLocked ? (
                        <Button size="sm" disabled className={`h-8 text-xs font-bold rounded-lg min-w-[110px] disabled:opacity-100 ${colors.btn}`}>
                            <Lock className="w-3.5 h-3.5 mr-1.5" />
                            Join Session
                        </Button>
                    ) : (
                        <Button asChild size="sm" className={`h-8 text-xs font-bold rounded-lg min-w-[110px] ${colors.btn}`}>
                            <a href={event.gmeet_link} target="_blank" rel="noopener noreferrer">
                                <Video className="w-3.5 h-3.5 mr-1.5" />
                                Join Session
                            </a>
                        </Button>
                    )}
                </div>
            </div>
        );
    };

    const EmptyState = ({ message }: { message: string }) => (
        <div className="flex flex-col items-center justify-center p-12 border rounded-lg border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/10">
            <Calendar className="w-8 h-8 text-slate-300 dark:text-zinc-700 mb-4" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-tight">{message}</h3>
        </div>
    );

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-lg bg-slate-50 dark:bg-zinc-900/50 p-4 md:p-6 border border-slate-200 dark:border-white/10 shadow-sm group transition-all hover:bg-slate-100 dark:hover:bg-zinc-900/80">
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                            <Video className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                                Expert Sessions & Connect
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                                A space for expert volunteers to lead sessions, collaborate, and share professional expertise.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex justify-start md:justify-center mb-6 w-full overflow-x-auto pb-2 no-scrollbar">
                    <TabsList className="inline-flex h-auto p-1 bg-slate-100 dark:bg-zinc-800 rounded-lg min-w-max">
                        <TabsTrigger value="past" className="rounded-md px-4 py-1.5 text-sm font-medium">
                            Past Events
                        </TabsTrigger>
                        <TabsTrigger value="this-week" className="rounded-md px-4 py-1.5 text-sm font-medium">
                            This Week
                        </TabsTrigger>
                        <TabsTrigger value="upcoming" className="rounded-md px-4 py-1.5 text-sm font-medium">
                            Upcoming
                        </TabsTrigger>
                    </TabsList>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-[300px]">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading schedule...</p>
                    </div>
                ) : (
                    <>
                        <TabsContent value="past" className="focus-visible:outline-none focus-visible:ring-0">
                            {pastEvents.length === 0 ? (
                                <EmptyState message="No past events" />
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {pastEvents.map(event => <EventCard key={event.id} event={event} variant="past" />)}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="this-week" className="focus-visible:outline-none focus-visible:ring-0">
                            {thisWeekEvents.length === 0 ? (
                                <EmptyState message="No sessions scheduled this week" />
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {thisWeekEvents.map(event => <EventCard key={event.id} event={event} variant="this-week" />)}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="upcoming" className="focus-visible:outline-none focus-visible:ring-0">
                            {upcomingEvents.length === 0 ? (
                                <EmptyState message="No upcoming events beyond this week" />
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {upcomingEvents.map(event => <EventCard key={event.id} event={event} variant="upcoming" />)}
                                </div>
                            )}
                        </TabsContent>
                    </>
                )}
            </Tabs>
        </div>
    );
}

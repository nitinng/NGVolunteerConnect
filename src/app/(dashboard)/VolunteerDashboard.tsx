"use client";

import {
    ArrowRight,
    Sparkles,
    Users,
    CheckCircle2,
    BookOpen,
    LifeBuoy,
    Settings,
    HeartHandshake,
    UserCircle,
    Target,
    Lock,
    Play,
    Calendar,
    ExternalLink,
    Video,
    Loader2
} from "lucide-react";
import type { Profile, SkillCategory } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

import { useUserContext } from "@/contexts/user-context";
import { useEffect, useState } from "react";
import { getWebinarsForVolunteerAction } from "@/app/actions/webinar-actions";
import { Webinar } from "@/lib/supabase";

interface VolunteerDashboardProps {
    serverProfile: Profile | null;
    serverCompletion: number;
    serverStats: { totalPages: number; completedPages: number; percentage: number };
    serverUniqRoles: string[];
    isLocked: boolean;
}

export default function VolunteerDashboard({
    serverProfile,
    serverCompletion,
    serverStats,
    serverUniqRoles,
    isLocked
}: VolunteerDashboardProps) {
    const router = useRouter();
    const user = useUserContext();

    const profile = serverProfile;
    const completion = serverCompletion;
    const stats = serverStats;
    const uniqRoles = serverUniqRoles;

    const toTitleCase = (str: string) => {
        return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    };

    const rawName = (user?.firstName || profile?.full_name?.split(' ')[0] || "").trim();
    const displayName = toTitleCase(rawName);

    const [webinars, setWebinars] = useState<Webinar[]>([]);
    const [isLandingWebinars, setIsLandingWebinars] = useState(true);

    useEffect(() => {
        const loadWebinars = async () => {
            try {
                const data = await getWebinarsForVolunteerAction();
                setWebinars(data);
            } catch (error) {
                console.error("Failed to load webinars:", error);
            } finally {
                setIsLandingWebinars(false);
            }
        };
        loadWebinars();
    }, []);

    const activeEvents = webinars.filter(event => new Date(event.date) >= new Date());

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 max-w-7xl mx-auto w-full">
            {/* Header / Control Center Card */}
            <div className="relative overflow-hidden rounded-lg bg-slate-50 dark:bg-zinc-900/50 p-4 md:p-6 border border-slate-200 dark:border-white/10 shadow-sm group transition-all hover:bg-slate-100 dark:hover:bg-zinc-900/80">
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                                {displayName ? `Hi ${displayName} 👋` : 'Welcome to NavGurukul!'}
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                                Welcome to NavGurukul's Volunteer Connect! Join the movement empowering underserved youth through education.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Onboarding Summary Row (Like the onboarding page) */}
            <div className="grid md:grid-cols-2 gap-4">
                <div onClick={() => router.push('/profile')} className="group flex flex-col justify-between p-4 md:p-6 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900/40 backdrop-blur-md shadow-sm hover:shadow-md hover:border-indigo-500/50 transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                            <UserCircle className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-[15px]">
                                {completion === 100 ? "Profile complete" : "Complete your profile"}
                            </h3>
                            <Progress value={completion} className="h-1 mt-2" indicatorClassName="bg-emerald-500" />
                        </div>
                        <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold text-sm min-w-[56px] flex items-center justify-center">
                            {completion}%
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => !isLocked && router.push('/onboarding')}
                    className={`group flex flex-col justify-between p-4 md:p-6 rounded-lg border border-slate-200 dark:border-white/10 ${isLocked ? "bg-slate-50 dark:bg-zinc-900/10 grayscale border-dashed cursor-not-allowed" : "bg-white dark:bg-zinc-900/40 hover:shadow-md hover:border-emerald-500/50 transition-all cursor-pointer"}`}
                >
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${isLocked ? "bg-slate-200 text-slate-400" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50"}`}>
                            {isLocked ? <Lock className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                        </div>
                        <div className="flex-1">
                            <h3 className={`font-bold text-slate-900 dark:text-slate-100 text-[15px] ${isLocked ? "italic text-slate-400" : ""}`}>
                                {isLocked ? "General Onboarding is locked" : stats.percentage === 100 ? "General Onboarding complete!" : "Complete your General Onboarding"}
                            </h3>
                            {isLocked ? (
                                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">It will be unlocked by the administrator once your initial verification is complete.</p>
                            ) : (
                                <Progress value={stats.percentage} className="h-1 mt-2 bg-emerald-200/50" indicatorClassName="bg-emerald-600" />
                            )}
                        </div>
                        {!isLocked && (
                            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold text-sm min-w-[56px] flex items-center justify-center">
                                {stats.percentage}%
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Stats / Actions Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Support Card */}
                <Card
                    className="p-2 relative group cursor-pointer border-slate-200 dark:border-zinc-800 hover:border-amber-500/50 transition-all shadow-sm hover:shadow-md overflow-hidden rounded-lg bg-white dark:bg-zinc-950"
                    onClick={() => router.push('/support')}
                >
                    <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                        <LifeBuoy className="w-16 h-16" />
                    </div>
                    <CardHeader className="p-4">
                        <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <LifeBuoy className="w-5 h-5" />
                        </div>
                        <CardTitle className="text-base text-slate-800 dark:text-slate-200">Support Center</CardTitle>
                        <CardDescription className="text-xs">Need any assistance?</CardDescription>
                    </CardHeader>
                </Card>

                {/* Handbook Card */}
                <Card
                    className="p-2 relative group border-slate-200 dark:border-zinc-800 transition-all shadow-sm overflow-hidden rounded-lg bg-white dark:bg-zinc-950"
                >
                    <div className="absolute top-2 right-2 z-20">
                        <Badge variant="outline" className="text-[8px] bg-slate-50 text-slate-400 border-slate-200 uppercase font-black">Coming Soon</Badge>
                    </div>
                    <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                        <BookOpen className="w-16 h-16" />
                    </div>
                    <CardHeader className="p-4">
                        <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <CardTitle className="text-base text-slate-800 dark:text-slate-200">Our Handbook</CardTitle>
                        <CardDescription className="text-xs">Learn our culture & rules.</CardDescription>
                    </CardHeader>
                </Card>

                {/* Spotlight Card */}
                <Card
                    className="p-2 relative group border-slate-200 dark:border-zinc-800 hover:border-emerald-500/50 transition-all shadow-sm overflow-hidden rounded-lg bg-white dark:bg-zinc-950"
                >
                    <div className="absolute top-2 right-2 z-20">
                        <Badge variant="outline" className="text-[8px] bg-slate-50 text-slate-400 border-slate-200 uppercase font-black">Coming Soon</Badge>
                    </div>
                    <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                        <Sparkles className="w-16 h-16" />
                    </div>
                    <CardHeader className="p-4">
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <CardTitle className="text-base text-slate-800 dark:text-slate-200">Expert Spotlight</CardTitle>
                        <CardDescription className="text-xs">Meet our star contributors.</CardDescription>
                    </CardHeader>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Mission & Orientation Banner */}
                <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-200/50 dark:border-indigo-500/20 rounded-xl p-6 relative overflow-hidden group h-full">
                    <div className="relative z-10 flex flex-col items-start gap-4 h-full">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-indigo-600/10 text-indigo-600">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Orientation</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Welcome to the Journey</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
                                At NavGurukul, we're building a world where one's background doesn't limit their potential.
                                Join our movement and start making an impact today.
                            </p>
                        </div>
                        <Button className="mt-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 rounded-lg">
                            Watch Orientation <Play className="w-4 h-4 ml-2 fill-current" />
                        </Button>
                    </div>
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl opacity-50" />
                </div>

                {/* Upcoming Events Card */}
                <Card className="border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden rounded-lg h-full flex flex-col gap-1 pt-2 ">
                    <CardHeader className="px-4 py-1 flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-2">
                            <Video className="w-4 h-4 text-indigo-500" />
                            <CardTitle className="text-sm font-bold tracking-tight">Upcoming Events</CardTitle>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/events')}
                            className="h-7 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 uppercase tracking-wider"
                        >
                            View All
                        </Button>
                    </CardHeader>
                    <Separator className="bg-slate-100 dark:bg-zinc-800" />
                    <CardContent className="px-4 pb-0 pt-0 space-y-1 flex-1">
                        {isLandingWebinars ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-zinc-800 flex flex-col flex-1">
                                {activeEvents.slice(0, 2).map((event, i) => (
                                    <div key={i} className="py-3 flex items-center justify-between group/dev">
                                        <div className="flex items-center gap-4 min-w-0">
                                            {/* Balanced Date Icon */}
                                            <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shrink-0">
                                                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase leading-none">
                                                    {new Date(event.date).toLocaleDateString([], { month: 'short' })}
                                                </span>
                                                <span className="text-base font-black text-slate-900 dark:text-zinc-100 leading-none mt-1">
                                                    {new Date(event.date).getDate()}
                                                </span>
                                            </div>

                                            <div className="min-w-0">
                                                <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200 truncate group-hover/dev:text-indigo-600 transition-colors">
                                                    {event.title}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs font-semibold text-indigo-600/80 dark:text-indigo-400/80">
                                                        {new Date(event.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                                                    </span>
                                                    <span className="text-slate-300 dark:text-zinc-700">•</span>
                                                    <span className="text-xs font-medium text-slate-500 dark:text-zinc-500">
                                                        {event.department || 'Staff Sync'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {event.gmeet_link && (
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                className="h-8 w-8 rounded-full border-slate-200 dark:border-zinc-800 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-zinc-900"
                                                asChild
                                            >
                                                <a href={event.gmeet_link} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                
                                {activeEvents.length < 2 && (
                                    <div className={`py-4 flex-1 flex items-center justify-center ${activeEvents.length === 0 ? "min-h-[100px]" : "mt-2 border-t border-slate-100 dark:border-zinc-800 border-dashed"}`}>
                                        <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest text-center flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5" />
                                            More events coming soon
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>


        </div>
    );
}

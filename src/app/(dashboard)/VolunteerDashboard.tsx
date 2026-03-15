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
    Circle
} from "lucide-react";
import type { Profile, SkillCategory } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Progress } from "@/components/ui/progress";

import { useUserContext } from "@/contexts/user-context";

interface VolunteerDashboardProps {
    serverProfile: Profile | null;
    serverCompletion: number;
    serverStats: { totalPages: number; completedPages: number; percentage: number };
    serverUniqRoles: string[];
}

export default function VolunteerDashboard({
    serverProfile,
    serverCompletion,
    serverStats,
    serverUniqRoles
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
                    onClick={() => router.push('/onboarding')}
                    className="group flex flex-col justify-between p-4 md:p-6 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900/40 backdrop-blur-md shadow-sm hover:shadow-md hover:border-emerald-500/50 transition-all cursor-pointer"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-[15px]">
                                {stats.percentage === 100 ? "General Onboarding complete!" : "Complete your General Onboarding"}
                            </h3>
                            <Progress value={stats.percentage} className="h-1 mt-2 bg-emerald-200/50" indicatorClassName="bg-emerald-600" />
                        </div>
                        <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold text-sm min-w-[56px] flex items-center justify-center">
                            {stats.percentage}%
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats / Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Skills Hub Card */}
                <Card
                    className="p-2 relative group cursor-pointer border-slate-200 dark:border-white/10 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all shadow-sm hover:shadow-md overflow-hidden rounded-lg"
                    onClick={() => router.push('/onboarding')}
                >
                    <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                        <Sparkles className="w-16 h-16" />
                    </div>
                    <CardHeader className="p-4">
                        <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <CardTitle className="text-base">Skills Registry</CardTitle>
                        <CardDescription className="text-xs" >Update your expertise</CardDescription>
                    </CardHeader>
                </Card>

                {/* Support Card */}
                <Card
                    className="p-2 relative group cursor-pointer border-slate-200 dark:border-white/10 hover:border-amber-500/50 dark:hover:border-amber-500/50 transition-all shadow-sm hover:shadow-md overflow-hidden rounded-lg"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                        <LifeBuoy className="w-16 h-16" />
                    </div>
                    <CardHeader className="p-4">
                        <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <LifeBuoy className="w-5 h-5" />
                        </div>
                        <CardTitle className="text-base">Support Center</CardTitle>
                        <CardDescription className="text-xs">Need any assistance?</CardDescription>
                    </CardHeader>
                </Card>
            </div>

            {/* Bottom Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-0">
                <Card className="lg:col-span-2 border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900/40 backdrop-blur-md overflow-hidden flex flex-col rounded-lg">
                    <CardHeader className="p-4 md:p-6 pb-2 md:pb-3 shrink-0">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            <CardTitle className="text-lg">Getting Started Guide</CardTitle>
                        </div>
                        <CardDescription>Complete these steps for orientation.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 p-4 md:p-6 pt-0">
                        {[
                            {
                                title: "Review Code of Conduct",
                                status: profile?.acknowledgement ? "Completed" : "Pending",
                                color: profile?.acknowledgement ? "text-emerald-500" : "text-slate-400"
                            },
                            {
                                title: "Complete Profile Information",
                                status: completion === 100 ? "Completed" : (completion > 0 ? "In Progress" : "Pending"),
                                color: completion === 100 ? "text-emerald-500" : (completion > 0 ? "text-amber-500" : "text-slate-400")
                            },
                            {
                                title: "Technical Assessment",
                                status: "Locked",
                                color: "text-slate-400"
                            },
                            {
                                title: "First Contribution Task",
                                status: "Locked",
                                color: "text-slate-400"
                            },
                        ].map((step, i) => (
                            <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-800/50 hover:bg-slate-100 dark:hover:bg-zinc-900/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-[10px] font-bold shadow-sm">
                                        {i + 1}
                                    </div>
                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{step.title}</span>
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${step.color}`}>{step.status}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
                <Card className="border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900/40 backdrop-blur-md overflow-hidden rounded-lg">
                    <CardHeader className="p-4 md:p-6 pb-0">
                        <div className="flex items-center gap-2">
                            <HeartHandshake className="w-5 h-5 text-indigo-500" />
                            <CardTitle className="text-lg">Resources</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 mt-2">
                        <div className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                            {[
                                { title: "Handbook", icon: BookOpen },
                                { title: "Guidelines", icon: Settings },
                                { title: "Forum", icon: LifeBuoy },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-zinc-900/50 cursor-pointer transition-colors">
                                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400">
                                        <item.icon className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="text-xs font-medium">{item.title}</span>
                                    <ArrowRight className="w-3.5 h-3.5 ml-auto text-slate-300 dark:text-zinc-700" />
                                </div>
                            ))}
                        </div>
                        <div className="p-3 pt-0 mt-2">
                            <div className="p-3 rounded-lg bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden">
                                <div className="relative z-10">
                                    <h4 className="font-bold text-xs">Need a mentor?</h4>
                                    <p className="text-[10px] opacity-90 mt-0.5">Connect with experienced volunteers.</p>
                                    <Button size="sm" variant="secondary" className="mt-2.5 h-7 text-[10px] font-bold w-full bg-white text-indigo-600 hover:bg-slate-50 border-none">
                                        Request Mentor
                                    </Button>
                                </div>
                                <Sparkles className="absolute -bottom-3 -right-3 w-16 h-16 opacity-20 rotate-12" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

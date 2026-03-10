"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCircle, ArrowRight, BookOpen, HeartHandshake, Globe2, Target, Users2 } from "lucide-react";
import { useUser } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { getMyProfile } from "@/app/actions/profile-actions";
import { getSkillCategories } from "@/app/actions/skills-actions";
import { calculateProfileCompletion } from "@/lib/profile-utils";
import { Profile, SkillCategory } from "@/lib/supabase";
import { Progress } from "@/components/ui/progress";

export default function OnboardingView() {
    const router = useRouter();
    const { user } = useUser();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [completion, setCompletion] = useState(0);

    const [dbCategories, setDbCategories] = useState<SkillCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [p, cats] = await Promise.all([
                    getMyProfile(),
                    getSkillCategories()
                ]);
                setProfile(p);
                setDbCategories(cats);
                if (p) {
                    setCompletion(calculateProfileCompletion(p, user?.publicMetadata || {}, cats.map(c => c.key)));
                }
            } catch (err) {
                console.error("Failed to load onboarding data:", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [user]);

    // Unified Roles from profiles table
    const primaryRoles = profile?.primary_skill_subcategories || [];
    const secondaryRoles = profile?.secondary_skill_subcategories || [];
    const uniqRoles = Array.from(new Set([...primaryRoles, ...secondaryRoles]));

    return (
        <div className="flex flex-1 flex-col gap-8 p-4 md:p-8 max-w-6xl mx-auto w-full">
            <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Onboarding Hub
                </h1>
                <p className="text-muted-foreground mt-1 text-sm md:text-base max-w-2xl">
                    Welcome to NavGurukul! Complete your profile and explore our modules to understand our mission and how you can make an impact.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div onClick={() => router.push('/profile')} className="group flex flex-col justify-between p-7 rounded-[10px] border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm hover:shadow-md hover:border-indigo-500 transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                        <div className="p-3.5 rounded-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                            <UserCircle className="w-7 h-7" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                                {completion === 100 ? "Profile complete - click to update" : "Complete your profile"}
                            </h3>
                            <p className="text-xs text-slate-500">
                                {completion === 100 ? "Your details are up to date. You can always update them later." : "Personalize your experience before starting tasks."}
                            </p>
                            <Progress value={completion} className="h-1.5 mt-3" indicatorClassName="bg-emerald-500" />
                        </div>
                        <div className="p-3.5 rounded-[10px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold text-lg min-w-[64px] flex items-center justify-center">
                            {completion}%
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => router.push('/onboarding/tasks')}
                    className={`group flex flex-col justify-between p-7 rounded-[10px] border cursor-pointer shadow-sm hover:shadow-md transition-all ${uniqRoles.length > 0 ? 'border-emerald-200 bg-emerald-50/20 dark:border-emerald-900/10 hover:border-emerald-500' : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-slate-400'}`}
                >
                    <div className="flex items-center gap-4">
                        <div className={`p-3.5 rounded-[10px] ${uniqRoles.length > 0 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50' : 'bg-slate-100 dark:bg-zinc-900 text-slate-400'}`}>
                            <Target className="w-7 h-7" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Role Specific Tasks</h3>
                                {uniqRoles.length > 0 && (
                                    <span className="bg-emerald-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                                        Active
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500">
                                {uniqRoles.length > 0 ? `${uniqRoles.length} skill modules unlocked.` : "Complete profile to unlock tasks."}
                            </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" />
                    </div>
                </div>
            </div>

            <div className="pt-4 pb-2 border-b border-border/50">
                <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-slate-400" />
                    Learn about NavGurukul
                </h2>
                <p className="text-muted-foreground mt-1 text-sm md:text-base">
                    Explore our divisions, understand our impact, and see how we are changing lives.
                </p>
            </div>

            {/* Bottom Grid: Info Cards */}
            <div className="grid md:grid-cols-3 gap-6 pb-12">
                <Card className="border-border/50 shadow-sm hover:border-slate-300 transition-colors rounded-[10px] overflow-hidden">
                    <CardHeader className="space-y-4 p-8">
                        <div className="w-14 h-14 bg-rose-50 dark:bg-rose-500/10 rounded-[10px] flex items-center justify-center text-rose-600 dark:text-rose-400">
                            <HeartHandshake className="w-7 h-7" />
                        </div>
                        <CardTitle className="text-xl">Our Mission & Impact</CardTitle>
                        <CardDescription className="text-sm">
                            Learn how we offer fully-funded software engineering programs to students from marginalized communities.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="px-8 pb-8">
                        <Button variant="link" className="p-0 h-auto text-rose-600 font-bold hover:no-underline">
                            Read more <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    </CardFooter>
                </Card>

                <Card className="border-border/50 shadow-sm hover:border-slate-300 transition-colors rounded-[10px] overflow-hidden">
                    <CardHeader className="space-y-4 p-8">
                        <div className="w-14 h-14 bg-amber-50 dark:bg-amber-500/10 rounded-[10px] flex items-center justify-center text-amber-600 dark:text-amber-400">
                            <Globe2 className="w-7 h-7" />
                        </div>
                        <CardTitle className="text-xl">Campuses & Reach</CardTitle>
                        <CardDescription className="text-sm">
                            Discover our residential campuses spread across India where students live and learn in a supportive environment.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="px-8 pb-8">
                        <Button variant="link" className="p-0 h-auto text-amber-600 font-bold hover:no-underline">
                            Explore Locations <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    </CardFooter>
                </Card>

                <Card className="border-border/50 shadow-sm hover:border-slate-300 transition-colors rounded-[10px] overflow-hidden">
                    <CardHeader className="space-y-4 p-8">
                        <div className="w-14 h-14 bg-blue-50 dark:bg-blue-500/10 rounded-[10px] flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <Users2 className="w-7 h-7" />
                        </div>
                        <CardTitle className="text-xl">Programs & Divisions</CardTitle>
                        <CardDescription className="text-sm">
                            From software engineering bootcamps to career acceleration, see the different ways we empower our students.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="px-8 pb-8">
                        <Button variant="link" className="p-0 h-auto text-blue-600 font-bold hover:no-underline">
                            View Programs <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}


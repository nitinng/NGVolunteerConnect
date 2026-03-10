"use client";

import { UserPlus, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-auth";

export default function VolunteerDashboard() {
    const router = useRouter();
    const { user } = useUser();

    return (
        <div className="flex flex-1 flex-col gap-5 p-4 md:p-8 max-w-6xl mx-auto w-full">
            <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    {user?.firstName ? `Hi ${user.firstName} 👋 Welcome to NavGurukul!` : 'Welcome to NavGurukul!'}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm md:text-base">
                    We're excited to have you on board. Let's get you set up and ready to contribute.
                </p>
            </div>

            <div className="mt-4 pb-12">
                <div
                    className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[10px] p-6 flex items-center gap-6 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-emerald-200 dark:hover:border-emerald-900"
                    onClick={() => router.push('/onboarding')}
                >
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/50 rounded-[10px] text-emerald-600 dark:text-emerald-400">
                        <UserPlus className="w-6 h-6" />
                    </div>
                    <div className="flex-1 pr-4">
                        <h3 className="font-bold text-[16px] text-slate-900 dark:text-slate-100">Continue Onboarding</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            Complete your profile to personalize your onboarding experience and unlock your specific set of orientation tasks.
                        </p>
                    </div>
                    <div className="pr-2 text-slate-300 dark:text-slate-600">
                        <ArrowRight className="w-5 h-5" />
                    </div>
                </div>
            </div>
        </div>
    );
}

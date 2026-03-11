import { Metadata } from "next"
import OnboardingView from "./OnboardingView"
import { getUserRole } from "@/lib/roles"
import { redirect } from "next/navigation"
import { getMyProfile } from "@/app/actions/profile-actions"
import { getSkillCategories } from "@/app/actions/skills-actions"
import { 
    getGeneralOnboardingModules, 
    getGeneralOnboardingTasks, 
    getAllContentBlocks, 
    getUserTaskProgress 
} from "@/app/actions/general-onboarding-actions"
import { calculateProfileCompletion } from "@/lib/profile-utils"
import { currentUser } from "@/lib/auth"

export const metadata: Metadata = {
    title: "Onboarding | NavGurukul Volunteer Connect",
    description: "Complete your onboarding and learn about NavGurukul.",
}

export default async function OnboardingPage() {
    // Only allow volunteers to access this route. Others get kicked back to dashboard
    const role = await getUserRole();
    if (role !== "Volunteer") {
        redirect("/");
    }

    const user = await currentUser();
    const publicMetadata = user?.publicMetadata || {};

    const [profile, dbCategories, loadedModules, loadedTasks, loadedBlocks, loadedProgress] = await Promise.all([
        getMyProfile(),
        getSkillCategories(),
        getGeneralOnboardingModules(),
        getGeneralOnboardingTasks(),
        getAllContentBlocks(),
        getUserTaskProgress()
    ]);

    const sortedModules = loadedModules.sort((a,b) => a.order_index - b.order_index);
    const categoryKeys = dbCategories.map(c => c.key);
    const completion = calculateProfileCompletion(profile, publicMetadata, categoryKeys);

    let tPages = 0;
    let cPages = 0;
    const completedModules: string[] = [];

    sortedModules.forEach(m => {
        const mTasks = loadedTasks.filter(t => t.module_id === m.id);
        let mTotal = 0;
        let mComp = 0;

        mTasks.forEach(t => {
            const tBlocks = loadedBlocks.filter(b => b.task_id === t.id).sort((a,b) => (a.order_index ?? 0) - (b.order_index ?? 0));
            let pagesForTask = 0;
            if (tBlocks.length === 0) {
                pagesForTask = 1;
            } else {
                pagesForTask = 1; 
                tBlocks.forEach((tb, i) => { if (i > 0 && tb.page_behavior === 'new_page') pagesForTask++; });
            }
            mTotal += pagesForTask;
            tPages += pagesForTask;

            const prog = loadedProgress.find(p => p.task_id === t.id);
            if (prog) {
                if (prog.is_completed) {
                    mComp += pagesForTask;
                    cPages += pagesForTask;
                } else if (prog.completed_pages) {
                    mComp += prog.completed_pages.length;
                    cPages += prog.completed_pages.length;
                }
            }
        });

        // Module counts as officially cleared if all internal page shards are read/checked off
        if (mTotal > 0 && mComp >= mTotal) {
            completedModules.push(m.id);
        }
    });

    const stats = { 
        totalPages: tPages, 
        completedPages: cPages, 
        percentage: tPages > 0 ? Math.round((cPages / tPages) * 100) : 0 
    };

    return (
        <OnboardingView 
            serverModules={sortedModules}
            serverCompletedModules={completedModules}
            serverStats={stats}
            serverCompletion={completion}
        />
    )
}

import { getUserRole } from "@/lib/roles"
import VolunteerDashboard from "./VolunteerDashboard"
import { Zap, ShieldCheck, LayoutDashboard } from "lucide-react"

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
import type { Profile } from "@/lib/supabase"

export default async function Page() {
  const role = await getUserRole();
  const user = await currentUser();
  const firstName = user?.firstName || "";

  let serverProfile: Profile | null = null;
  let serverCompletion = 0;
  let serverStats = { totalPages: 0, completedPages: 0, percentage: 0 };
  let serverUniqRoles: string[] = [];

  if (role === 'Volunteer') {
    const publicMetadata = user?.publicMetadata || {};

    const [profile, dbCategories, loadedModules, loadedTasks, loadedBlocks, loadedProgress] = await Promise.all([
        getMyProfile(),
        getSkillCategories(),
        getGeneralOnboardingModules(),
        getGeneralOnboardingTasks(),
        getAllContentBlocks(),
        getUserTaskProgress()
    ]);

    serverProfile = profile;
    
    if (profile) {
        const categoryKeys = dbCategories.map(c => c.key);
        serverCompletion = calculateProfileCompletion(profile, publicMetadata, categoryKeys);
        const primaryRoles = profile.primary_skill_subcategories || [];
        const secondaryRoles = profile.secondary_skill_subcategories || [];
        serverUniqRoles = Array.from(new Set([...primaryRoles, ...secondaryRoles]));
    }

    let tPages = 0;
    let cPages = 0;

    loadedModules.forEach(m => {
        const mTasks = loadedTasks.filter(t => t.module_id === m.id);
        mTasks.forEach(t => {
            const tBlocks = loadedBlocks.filter(b => b.task_id === t.id).sort((a,b) => (a.order_index ?? 0) - (b.order_index ?? 0));
            let pagesForTask = 0;
            if (tBlocks.length === 0) {
                pagesForTask = 1;
            } else {
                pagesForTask = 1; 
                tBlocks.forEach((tb, i) => { if (i > 0 && tb.page_behavior === 'new_page') pagesForTask++; });
            }
            tPages += pagesForTask;

            const prog = loadedProgress.find(p => p.task_id === t.id);
            if (prog) {
                if (prog.is_completed) {
                    cPages += pagesForTask;
                } else if (prog.completed_pages) {
                    cPages += prog.completed_pages.length;
                }
            }
        });
    });

    serverStats = { 
        totalPages: tPages, 
        completedPages: cPages, 
        percentage: tPages > 0 ? Math.round((cPages / tPages) * 100) : 0 
    };
  }

  return (
    <div className="flex flex-1 flex-col p-2 md:p-4">
      {role === 'Volunteer' ? (
        <VolunteerDashboard 
            serverProfile={serverProfile}
            serverCompletion={serverCompletion}
            serverStats={serverStats}
            serverUniqRoles={serverUniqRoles}
        />
      ) : (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <div className="relative overflow-hidden rounded-[12px] bg-slate-50 dark:bg-zinc-900/50 p-4 md:p-6 border border-slate-200 dark:border-zinc-800 shadow-sm group transition-all hover:bg-slate-100 dark:hover:bg-zinc-900/80">
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-[10px] text-white shadow-lg ${
                  role === 'Admin' ? 'bg-indigo-500 shadow-indigo-500/20' : 
                  role === 'Program' ? 'bg-amber-500 shadow-amber-500/20' : 
                  'bg-blue-500 shadow-blue-500/20'
                }`}>
                  {role === 'Admin' ? <ShieldCheck className="w-6 h-6" /> : 
                   role === 'Program' ? <Zap className="w-6 h-6" /> : 
                   <LayoutDashboard className="w-6 h-6" />}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                    {firstName ? `Hi ${firstName} 👋` : `${role} Control Center`}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                    {role === 'Admin' && "You have administrative oversight of the volunteer lifecycle. Manage skills, review onboarding, and update permissions."}
                    {role === 'Program' && "Lead and coordinate volunteer programs. Track progress and ensure impactful educational experiences."}
                    {role === 'Operations' && "Maintain operational excellence. Monitor system health and streamline volunteer management workflows."}
                    {!['Admin', 'Program', 'Operations'].includes(role || '') && "Welcome to NavGurukul's Volunteer Connect! Manage your dashboard and activities here."}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-start md:items-end gap-1 px-2">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">System Status</div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  OPERATIONAL
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/50 dark:bg-zinc-950/50 border border-slate-200 dark:border-zinc-800 p-6 rounded-[12px] backdrop-blur-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Volunteers</div>
              <div className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">1,284</div>
              <div className="text-xs text-emerald-500 font-bold mt-2 flex items-center gap-1">
                <Zap className="w-3 h-3" /> +12% this month
              </div>
            </div>
            <div className="bg-white/50 dark:bg-zinc-950/50 border border-slate-200 dark:border-zinc-800 p-6 rounded-[12px] backdrop-blur-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Onboarding</div>
              <div className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">42</div>
              <div className="text-xs text-amber-500 font-bold mt-2 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> 8 requiring review
              </div>
            </div>
            <div className="bg-white/50 dark:bg-zinc-950/50 border border-slate-200 dark:border-zinc-800 p-6 rounded-[12px] backdrop-blur-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Skill Tags</div>
              <div className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">156</div>
              <div className="text-xs text-indigo-500 font-bold mt-2">Active across 12 categories</div>
            </div>
          </div>
          
          <div className="bg-white/50 dark:bg-zinc-950/50 border border-slate-200 dark:border-zinc-800 min-h-[400px] flex-1 rounded-[12px] backdrop-blur-sm p-8 flex flex-col items-center justify-center text-center">
             <div className="p-4 rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-400 mb-4">
                <LayoutDashboard className="w-8 h-8" />
             </div>
             <h3 className="text-lg font-bold text-slate-900 dark:text-white">System Activity Feed</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
                Real-time activity logs will appear here as volunteers join, update their skills, and complete onboarding tasks.
             </p>
          </div>
        </div>
      )}
    </div>
  )
}

import { getUserRole } from "@/lib/roles"
import VolunteerDashboard from "./VolunteerDashboard"
import { Zap, ShieldCheck, LayoutDashboard } from "lucide-react"
export default async function Page() {
  const role = await getUserRole();

  return (
    <div className="flex flex-1 flex-col p-2 md:p-4">
      {role === 'Volunteer' ? (
        <VolunteerDashboard />
      ) : (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <div className="relative overflow-hidden rounded-[12px] bg-slate-50 dark:bg-zinc-900/50 p-6 md:p-8 border border-slate-200 dark:border-zinc-800 shadow-sm group transition-all hover:bg-slate-100 dark:hover:bg-zinc-900/80">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
              <ShieldCheck className="w-32 h-32 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="p-4 rounded-[12px] bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
                    {role} Control Center
                    <span className="text-[10px] uppercase px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold tracking-widest">
                      Live
                    </span>
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl font-medium">
                    You have administrative oversight of the volunteer lifecycle. Use the sidebar to manage skills, review onboarding tasks, or update user permissions.
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-start md:items-end gap-2 pr-4">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">System Health</div>
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
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

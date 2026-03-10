import { getUserRole } from "@/lib/roles"
import VolunteerDashboard from "./VolunteerDashboard"
import { Zap, ShieldCheck } from "lucide-react"
export default async function Page() {
  const role = await getUserRole();

  return (
    <div className="flex flex-1 flex-col p-2 md:p-4">
      {role === 'Volunteer' ? (
        <VolunteerDashboard />
      ) : (
        <div className="flex flex-1 flex-col gap-6 p-4">
          <div className="relative overflow-hidden rounded-[10px] bg-slate-50 dark:bg-zinc-900/50 p-6 border border-slate-200 dark:border-zinc-800 shadow-sm group transition-all hover:bg-slate-100 dark:hover:bg-zinc-900">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <ShieldCheck className="w-24 h-24 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="p-4 rounded-[10px] bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
                    {role} Control Center
                    <span className="text-[10px] uppercase px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold tracking-widest">
                      Live
                    </span>
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                    You have administrative oversight of the volunteer lifecycle. Use the sidebar to manage skills, review onboarding tasks, or update user permissions.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 self-start sm:self-center">
                <div className="flex flex-col items-end mr-4">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">System Health</div>
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    OPERATIONAL
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
          </div>
          <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
        </div>
      )}
    </div>
  )
}

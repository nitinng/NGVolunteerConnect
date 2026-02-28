import { getUserRole } from "@/lib/roles"

export default async function Page() {
  const role = await getUserRole();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="bg-primary/10 rounded-xl p-6 border border-primary/20 text-center">
        <h1 className="text-2xl font-black text-primary tracking-tight">
          Welcome to the {role} Dashboard 🚀
        </h1>
        <p className="text-muted-foreground mt-2">
          Your access level and permissions have been securely resolved via Clerk RBAC.
        </p>
      </div>

      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="bg-muted/50 aspect-video rounded-xl" />
        <div className="bg-muted/50 aspect-video rounded-xl" />
        <div className="bg-muted/50 aspect-video rounded-xl" />
      </div>
      <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
    </div>
  )
}

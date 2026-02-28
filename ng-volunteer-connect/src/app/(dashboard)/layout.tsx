import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"

import { getUserRole, isTrueAdmin } from "@/lib/roles"
import { cookies } from "next/headers"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const adminMode = await isTrueAdmin()

    // Read the dev override from cookies directly so the RoleSwitcher can track the "System" tab
    const cookieStore = await cookies()
    const rawDevOverride = cookieStore.get('dev-role-override')?.value

    return (
        <div className="[--header-height:calc(--spacing(14))]">
            <SidebarProvider className="flex flex-col">
                <SiteHeader isTrueAdmin={adminMode} activeRole={rawDevOverride || "System"} />
                <div className="flex flex-1">
                    <AppSidebar />
                    <SidebarInset>
                        {children}
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </div>
    )
}

"use client"

import { SidebarIcon, Fingerprint } from "lucide-react"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import dynamic from "next/dynamic"

// Loaded client-only to avoid Radix UI ID hydration mismatches.
// The user menu uses context data (no SSR needed) so this is safe and correct.
const HeaderUserMenu = dynamic(
  () => import("@/components/header-user-menu").then((m) => ({ default: m.HeaderUserMenu })),
  { ssr: false }
)

const RoleSwitcher = dynamic(
  () => import("@/components/role-switcher").then((m) => ({ default: m.RoleSwitcher })),
  { ssr: false }
)

export function SiteHeader({
  isTrueAdmin,
  activeRole,
  baseRole,
  volunteerEnabled
}: {
  isTrueAdmin?: boolean
  activeRole?: string
  baseRole?: string
  volunteerEnabled?: boolean
}) {
  const { toggleSidebar } = useSidebar()
  const pathname = usePathname()

  // Format pathname like "/dashboard/users" -> "Users"
  const activePage = pathname === "/" ? "Dashboard" :
    pathname.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || "Dashboard"

  return (
    <header className="bg-sidebar sticky top-0 z-50 flex w-full items-center border-b">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <Button
          className="h-8 w-8"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
        >
          <SidebarIcon />
        </Button>
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            {pathname !== "/" && (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/" className="text-muted-foreground hover:text-foreground">
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            )}
            <BreadcrumbItem>
              <BreadcrumbPage className="font-semibold text-foreground">{activePage}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />
          <RoleSwitcher
            isAdmin={isTrueAdmin}
            activeRole={activeRole}
            baseRole={baseRole}
            volunteerEnabled={volunteerEnabled}
          />
          <HeaderUserMenu />
        </div>
      </div>
    </header>
  )
}

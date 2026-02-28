"use client"

import { SidebarIcon, Fingerprint } from "lucide-react"
import { usePathname } from "next/navigation"
import { RoleSwitcher } from "@/components/role-switcher"
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

export function SiteHeader({
  isTrueAdmin,
  activeRole
}: {
  isTrueAdmin?: boolean
  activeRole?: string
}) {
  const { toggleSidebar } = useSidebar()
  const pathname = usePathname()

  // Format pathname like "/dashboard/users" -> "Users"
  const activePage = pathname === "/" ? "Dashboard" :
    pathname.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || "Dashboard"

  return (
    <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b">
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
            <BreadcrumbItem className="flex items-center gap-2">
              <Fingerprint className="h-4 w-4 text-indigo-600" />
              <BreadcrumbLink href="/" className="font-semibold select-none">NG Volunteer Connect</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{activePage}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <RoleSwitcher isAdmin={isTrueAdmin} activeRole={activeRole} />
      </div>
    </header>
  )
}

"use client"

import * as React from "react"
import {
  BookOpen,
  BookOpenCheck,
  Building,
  LifeBuoy,
  PieChart,
  Send,
  UserCircle,
  UserCog,
  LayoutDashboard,
  Ticket,
  Video,
  Briefcase,
} from "lucide-react"

import { NavMain, NavItem } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { UserRole } from "@/lib/roles"
import { Fingerprint } from "lucide-react"
import Link from "next/link"

const data = {
  navSecondary: [
    {
      title: "Handbook",
      url: "#",
      icon: BookOpen,
    },
    {
      title: "Support",
      url: "/support",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
}

export function AppSidebar({ role, devOverride, isLocked, ...props }: React.ComponentProps<typeof Sidebar> & { role?: UserRole, devOverride?: string, isLocked?: boolean }) {
  const { setOpenMobile, isMobile } = useSidebar()
  // Determine if it's a volunteer view
  const activeRole = role || 'Volunteer';
  const isVolunteer = activeRole === 'Volunteer';

  const navGeneral: NavItem[] = [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
      isActive: true,
    },
  ];

  if (isVolunteer) {
    navGeneral.push({
      title: "Events",
      url: "/events",
      icon: Video,
    });
  }

  // Everyone (except Operations which already gets full dashboard) gets a Projects view
  navGeneral.push({
    title: "Projects",
    url: "/projects",
    icon: Briefcase,
  });

  // Top-level Onboarding (for the user's own journey)
  if (isVolunteer) {
    navGeneral.push({
      title: "Onboarding",
      url: "/onboarding",
      icon: BookOpenCheck,
      items: [
        {
          title: "My Journey",
          url: "/onboarding",
        }
      ]
    });
  }

  // Everyone gets Profile at the bottom of the general section
  navGeneral.push({
    title: "My Profile",
    url: "/profile",
    icon: UserCircle,
  });

  const navManagement: NavItem[] = [];

  // Admins & Program staff get Management section
  if (activeRole !== 'Volunteer') {
    navManagement.push(
      {
        title: "User Management",
        url: "#",
        icon: UserCog,
        items: [
          {
            title: "User Registry",
            url: "/users-registry",
          },
          {
            title: "User Trends",
            url: "/users-trends",
          },
        ]
      },
      {
        title: "Projects",
        url: "/management/projects",
        icon: Briefcase,
      },
      {
        title: "Onboarding",
        url: "#",
        icon: BookOpen,
        items: [
          {
            title: "Skills Management",
            url: "/skills",
          },
          {
            title: "Onboarding Config",
            url: "/management/onboarding",
          },
        ]
      },
      {
        title: "Support Ops Hub",
        url: "#",
        icon: LifeBuoy,
        items: [
          {
            title: "Manage Departments",
            url: "/management/departments",
          },
          {
            title: "All Tickets",
            url: "/management/ticketing/all-tickets",
          },
          {
            title: "Ticketing Settings",
            url: "/management/ticketing/settings",
          },
          {
            title: "FAQs Editor",
            url: "/management/support/faqs",
          },
          {
            title: "Contact US Directory",
            url: "/management/support/contact",
          },
          {
            title: "Feedback Forms & Logs",
            url: "/management/support/feedback",
          },
          {
            title: "Webinars",
            url: "/management/support/webinars",
          },
        ]
      },
      {
        title: "Analytics Dashboard",
        url: "/admin",
        icon: PieChart,
      }
    );
  }

  const navComponents: NavItem[] = [];
  if (activeRole === 'Admin') {
    navComponents.push({
      title: "Design System",
      url: "#",
      icon: LayoutDashboard,
      items: [
        {
          title: "Toasts / Sonner",
          url: "/management/components/toasts",
        },
      ]
    });
  }

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link 
                href="/"
                onClick={() => {
                  if (isMobile) setOpenMobile(false)
                }}
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-indigo-600 text-sidebar-primary-foreground">
                  <Fingerprint className="size-6" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">NG Connect</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {activeRole === 'Volunteer' && "Volunteer Hub"}
                    {activeRole === 'Operations' && "Operations Hub"}
                    {activeRole === 'Program' && "Program Hub"}
                    {activeRole === 'Admin' && "Admin Hub"}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navGeneral} />
        {navManagement.length > 0 && (
          <NavMain items={navManagement} label="Management" />
        )}
        {navComponents.length > 0 && (
          <NavMain items={navComponents} label="Components" />
        )}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
    </Sidebar>
  )
}


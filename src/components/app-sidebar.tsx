"use client"

import * as React from "react"
import {
  BookOpen,
  BookOpenCheck,
  Bot,
  Command,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
  LayoutDashboard,
  UserCircle,
  Target,
  Sparkles,
  Settings
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { UserRole } from "@/lib/roles"
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
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
}

export function AppSidebar({ role, devOverride, ...props }: React.ComponentProps<typeof Sidebar> & { role?: UserRole, devOverride?: string }) {
  // Determine if it's a volunteer view
  const activeRole = role || 'Volunteer';
  const isVolunteer = activeRole === 'Volunteer';

  const navMain = [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Onboarding Hub",
      url: "/onboarding",
      icon: BookOpenCheck,
      items: [
        {
          title: "My Journey",
          url: "/onboarding",
        }
      ]
    },
    {
      title: "My Profile",
      url: "/profile",
      icon: UserCircle,
    }
  ];

  // Admins & Program staff get User Management
  if (activeRole !== 'Volunteer') {
    navMain.push({
      title: "Management",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "User Registry",
          url: "/users",
        },
        {
          title: "Skills Management",
          url: "/skills",
        },
        {
          title: "Onboarding Config",
          url: "/management/onboarding",
        },
        {
          title: "Analytics Dashboard",
          url: "/admin",
        }
      ]
    });
  }

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
    </Sidebar>
  )
}


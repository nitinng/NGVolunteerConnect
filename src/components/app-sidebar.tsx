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

import { NavMain, NavItem } from "@/components/nav-main"
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

  const navMain: NavItem[] = [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
      isActive: true,
    },
  ];

  // Top-level Onboarding (for the user's own journey)
  navMain.push({
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

  // Admins & Program staff get Management section
  if (activeRole !== 'Volunteer') {
    navMain.push({
      title: "Management",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Users",
          url: "#",
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
          title: "Onboarding",
          url: "#",
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
          title: "Departments",
          url: "/management/departments",
        },
        {
          title: "Analytics Dashboard",
          url: "/admin",
        }
      ]
    });
  }

  // Everyone gets Profile at the bottom of the main nav
  navMain.push({
    title: "My Profile",
    url: "/profile",
    icon: UserCircle,
  });

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


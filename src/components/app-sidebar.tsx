"use client"

import * as React from "react"
import {
  BookOpen,
  BookOpenCheck,
  Building,
  LifeBuoy,
  PieChart,
  Send,
  UserCog,
  LayoutDashboard,
  UserCircle,
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

  const navGeneral: NavItem[] = [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
      isActive: true,
    },
  ];

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
        title: "Departments",
        url: "/management/departments",
        icon: Building,
      },
      {
        title: "Analytics Dashboard",
        url: "/admin",
        icon: PieChart,
      }
    );
  }

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarContent>
        <NavMain items={navGeneral} />
        {navManagement.length > 0 && (
          <NavMain items={navManagement} label="Management" />
        )}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
    </Sidebar>
  )
}


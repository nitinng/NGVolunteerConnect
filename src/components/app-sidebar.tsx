"use client"

import * as React from "react"
import {
  BookOpen,
  Bot,
  Command,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { BookOpenCheck } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Users",
      url: "/users",
      icon: Bot,
      isActive: false,
      items: [
        {
          title: "Manage Users",
          url: "/users",
        }
      ]
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
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
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

import { UserRole } from "@/lib/roles"

export function AppSidebar({ role, devOverride, ...props }: React.ComponentProps<typeof Sidebar> & { role?: UserRole, devOverride?: string }) {

  // Use the strictly server-resolved role to prevent Hydration mismatches
  const activeRole = devOverride ? (role || 'Volunteer') : (role || 'Volunteer');
  const isVolunteer = activeRole === 'Volunteer';

  let dynamicNavMain = [...data.navMain];

  const canSeeUsers = activeRole !== 'Volunteer';

  if (!canSeeUsers) {
    dynamicNavMain = dynamicNavMain.filter(n => n.title !== "Users");
  }

  // Onboarding should be at the top for everyone, but with different sub-items
  dynamicNavMain.unshift({
    title: "Onboarding Hub",
    url: "/onboarding",
    icon: BookOpenCheck,
    isActive: true,
    items: isVolunteer ? [
      {
        title: "View Tasks & Info",
        url: "/onboarding"
      }
    ] : [
      {
        title: "View Tasks & Info",
        url: "/onboarding"
      },
      {
        title: "Skills Management",
        url: "/skills"
      }
    ]
  });

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarContent>
        <NavMain items={dynamicNavMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
    </Sidebar>
  )
}

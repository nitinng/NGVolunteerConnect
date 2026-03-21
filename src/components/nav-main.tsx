"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import * as React from "react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import Link from "next/link"

export type NavItem = {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  items?: NavItem[]
}

function NavItem({ item, level = 0 }: { item: NavItem, level?: number }) {
  const { setOpenMobile, isMobile } = useSidebar()
  const hasSubItems = !!item.items?.length
  const [isOpen, setIsOpen] = React.useState(!!item.isActive)

  if (!hasSubItems) {
    const Component = level === 0 ? SidebarMenuButton : SidebarMenuSubButton
    const ItemWrapper = level === 0 ? SidebarMenuItem : SidebarMenuSubItem

    return (
      <ItemWrapper key={item.title}>
        <Component
          asChild
          tooltip={item.title}
          isActive={item.isActive}
        >
          <Link 
            href={item.url}
            onClick={() => {
              if (isMobile) setOpenMobile(false)
            }}
          >
            {item.icon && <item.icon />}
            <span>{item.title}</span>
          </Link>
        </Component>
      </ItemWrapper>
    )
  }

  if (level === 0) {
    return (
      <Collapsible
        key={item.title}
        asChild
        open={isOpen}
        onOpenChange={setIsOpen}
        className="group/collapsible"
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton tooltip={item.title} isActive={item.isActive}>
              {item.icon && <item.icon />}
              <span>{item.title}</span>
              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.items?.map((subItem) => (
                <NavItem key={subItem.title} item={subItem} level={level + 1} />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    )
  }

  // Nested levels (e.g. level 1 submenu containing level 2 items)
  return (
    <Collapsible
      key={item.title}
      asChild
      open={isOpen}
      onOpenChange={setIsOpen}
      className="group/collapsible-sub"
    >
      <SidebarMenuSubItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuSubButton isActive={item.isActive} className="justify-between">
            <span>{item.title}</span>
            <ChevronRight className="h-3 w-3 transition-transform duration-200 group-data-[state=open]/collapsible-sub:rotate-90" />
          </SidebarMenuSubButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="ml-2 border-l pl-2 mt-1">
            {item.items?.map((subItem) => (
              <NavItem key={subItem.title} item={subItem} level={level + 1} />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuSubItem>
    </Collapsible>
  )
}

export function NavMain({
  items,
  label,
}: {
  items: NavItem[]
  label?: string
}) {
  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => (
          <NavItem key={item.title} item={item} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

"use client"

import * as React from "react"
import { useSession } from "next-auth/react"

import {
  IconCamera,
  IconChartBar,
  IconScissors,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconTemplate,
  IconReport,
  IconSettings,
  IconBrandInstagram,
  IconNotebook,
  IconHeart
} from "@tabler/icons-react"


import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Cutter",
      url: "/",
      icon: IconScissors,
    },
    {
      title: "Reels",
      url: "/reels",
      icon: IconBrandInstagram,
    },
    {
      title: "Templates",
      url: "/templates",
      icon: IconTemplate,
    },
    {
      title: "Blog",
      url: "/blog",
      icon: IconNotebook,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Analytics",
      url: "#",
      icon: IconChartBar,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Donate",
      url: "#",
      icon: IconHeart,
    },
  ],
  documents: [
    {
      name: "Numdle",
      url: "#",
      icon: IconDatabase,
    },
    {
      name: "Tic Tac Toy",
      url: "#",
      icon: IconReport,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: IconFileWord,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session, status } = useSession()

  const isAuthenticated = status === "authenticated"

  const userFromSession = isAuthenticated && session?.user ? {
    name: session.user.name ?? "User",
    email: session.user.email ?? "",
    avatar: session.user.image ?? "/avatars/default.jpg",
  } : {
    name: "Guest",
    email: "guest@example.com",
    avatar: "/avatars/default.jpg",
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Twizz Code.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userFromSession} />
      </SidebarFooter>
    </Sidebar>
  )
}

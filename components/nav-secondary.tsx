"use client"

import * as React from "react"
import { type Icon } from "@tabler/icons-react"
import { useRouter, usePathname } from "next/navigation"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: Icon
  }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                onClick={() => {
                  if (item.url) router.push(item.url)
                }}
                className={`${pathname === item.url ? "bg-accent border text-accent-foreground font-bold hover:bg-accent pl-4 before:content-[''] before:absolute before:top-1/2 before:-translate-y-1/2 before:left-0 before:rounded-r-full before:w-1 before:h-2/3 before:bg-foreground" : "text-foreground hover:text-accent-foreground"} hover:cursor-pointer overflow-hidden duration-500`}
              >
                <item.icon />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

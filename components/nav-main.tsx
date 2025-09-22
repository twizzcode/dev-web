"use client"

import { type Icon } from "@tabler/icons-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
  }[]
}) {

  const router = useRouter()
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                tooltip={item.title} 
                onClick={() => {
                  if (item.url) {
                    router.push(item.url)
                  }
                }}
                className={`${pathname === item.url ? "bg-accent border text-accent-foreground font-bold hover:bg-accent pl-4 before:content-[''] before:absolute before:top-1/2 before:-translate-y-1/2 before:left-0 before:rounded-r-full before:w-1 before:h-2/3 before:bg-foreground" : "text-foreground hover:text-accent-foreground"} hover:cursor-pointer overflow-hidden duration-500`}
              >
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

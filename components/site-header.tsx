"use client"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import ThemeButton from "@/components/theme-button"
import { CartModal } from "@/components/cart-modal"
import { usePathname } from "next/navigation"

// Helper function to capitalize first letter of a string
const capitalizeFirstLetter = (string: string): string => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export function SiteHeader() {
  const route = usePathname()
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{capitalizeFirstLetter(route.split("/").pop() || "Cutter")}</h1>
        <div className="ml-auto flex items-center gap-2">
          <CartModal />
          <ThemeButton />
        </div>
      </div>
    </header>
  )
}

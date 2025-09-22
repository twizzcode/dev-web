import { AppSidebar } from "@/components/app-sidebar"
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { SessionProvider } from "next-auth/react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <SessionProvider>
        <AppSidebar variant="inset" collapsible="icon" />
      </SessionProvider>
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col @container/main">
          {children}
        </div>
      <SiteFooter />

      </SidebarInset>
    </SidebarProvider>
  );
}
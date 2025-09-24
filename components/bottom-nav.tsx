"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconScissors,
  IconBrandInstagram,
  IconTemplate,
  IconNotebook,
  IconChartBar,
  IconUserCircle,
  IconCreditCard,
  IconNotification,
  IconLogout
} from "@tabler/icons-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const items: NavItem[] = [
  { href: "/", label: "Cutter", icon: <IconScissors className="w-5 h-5" /> },
  { href: "/reels", label: "Reels", icon: <IconBrandInstagram className="w-5 h-5" /> },
  { href: "/templates", label: "Tpl", icon: <IconTemplate className="w-5 h-5" /> },
  { href: "/blog", label: "Blog", icon: <IconNotebook className="w-5 h-5" /> },
  { href: "/analytics", label: "Analytic", icon: <IconChartBar className="w-5 h-5" /> },
];

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const avatar = session?.user?.image || "/avatars/default.svg";

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
  <ul className="grid grid-cols-6 h-14">
        {items.map(item => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={[
                  "relative flex flex-col items-center justify-center h-full text-[10px] font-medium gap-0.5 transition-colors border border-transparent",
                  active
                    ? "bg-accent border text-accent-foreground font-bold hover:bg-accent"
                    : "text-muted-foreground hover:text-foreground"
                ].join(" ")}
                aria-current={active ? "page" : undefined}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
        <li className="flex items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex flex-col items-center justify-center h-full text-[10px] font-medium gap-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none"
                aria-label="User menu"
              >
                <Avatar className="h-6 w-6 ring-1 ring-border">
                  <AvatarImage src={avatar} alt="profile" />
                  <AvatarFallback>P</AvatarFallback>
                </Avatar>
                <span>Me</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" className="min-w-56 mb-2">
              <DropdownMenuLabel className="flex items-center gap-2 py-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatar} alt={session?.user?.name || "User"} />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-medium leading-tight truncate max-w-[140px]">{session?.user?.name || "User"}</span>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">{session?.user?.email || "guest@example.com"}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem className="text-xs gap-2">
                  <IconUserCircle className="size-4" /> Account
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs gap-2">
                  <IconCreditCard className="size-4" /> Billing
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs gap-2">
                  <IconNotification className="size-4" /> Notifications
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-xs gap-2 text-red-500 focus:text-red-500"
                onClick={() => signOut()}
              >
                <IconLogout className="size-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </li>
      </ul>
    </nav>
  );
};

export default BottomNav;
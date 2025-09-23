"use client"

import * as React from "react"
import { IconBrandGithub, IconHeart } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

interface SiteFooterProps {
  className?: string;
}

export function SiteFooter({ className }: SiteFooterProps) {
  return (
    <footer className={cn("border-t py-3 px-4", className)}>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center">
          <span className="text-muted-foreground">
            © {new Date().getFullYear()} Twizz Cutter
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <a 
            href="#" 
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <IconBrandGithub className="h-4 w-4" />
            <span>GitHub</span>
          </a>
          <a 
            href="#" 
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <IconHeart className="h-4 w-4 text-red-500" />
            <span>Sponsor</span>
          </a>
        </div>
      </div>
    </footer>
  )
}
"use client"

import * as React from "react"
import { IconBrandGithub, IconHeart, IconCopy, IconCheck } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

interface SiteFooterProps {
  className?: string;
}

export function SiteFooter({ className }: SiteFooterProps) {
  const PAY_NUMBER = "085174446002";
  const [copied, setCopied] = React.useState<string | null>(null);
  const copy = (val: string) => {
    navigator.clipboard.writeText(val).then(()=>{
      setCopied(val);
      setTimeout(()=> setCopied(null), 1800);
    }).catch(()=>{});
  };
  return (
    <footer className={cn("border-t py-3 px-4", className)}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-sm">
        <span className="text-muted-foreground">© {new Date().getFullYear()} Twizz Cutter</span>
        <div className="flex items-center gap-4 flex-wrap">
          <a
            href="#"
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <IconBrandGithub className="h-4 w-4" />
            <span>GitHub</span>
          </a>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <IconHeart className="h-4 w-4 text-red-500" />
                <span>Donate</span>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="sm:max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <IconHeart className="h-5 w-5 text-red-500" /> Support / Donate
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Terima kasih sudah menggunakan Twizz Cutter. Kamu bisa mendukung pengembangan melalui salah satu metode berikut (nomor sama untuk semua e-wallet):
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="grid gap-4 py-2">
                <Method label="ShopeePay" number={PAY_NUMBER} copied={copied} onCopy={copy} />
                <Method label="DANA" number={PAY_NUMBER} copied={copied} onCopy={copy} />
                <Method label="GoPay" number={PAY_NUMBER} copied={copied} onCopy={copy} />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Close</AlertDialogCancel>
              </AlertDialogFooter>
              <p className="text-[10px] mt-2 text-muted-foreground text-center">Setelah kirim, boleh DM bukti untuk ucapan terima kasih 🙏</p>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </footer>
  )
}

const Method: React.FC<{label:string; number:string; copied:string|null; onCopy:(v:string)=>void}> = ({label, number, copied, onCopy}) => {
  const active = copied === number+label;
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border px-3 py-2 bg-muted/30">
      <div className="flex items-center gap-3">
        <WalletIcon label={label} />
        <div className="flex flex-col">
          <span className="text-xs font-medium">{label}</span>
          <span className="text-sm font-mono tracking-wide select-all">{number}</span>
        </div>
      </div>
      <Button
        type="button"
        size="sm"
        variant={active? "default":"outline"}
        className="h-8 px-2 text-[11px] flex items-center gap-1"
        onClick={()=> onCopy(number+label)}
      >
        {active ? <IconCheck className="h-3.5 w-3.5" /> : <IconCopy className="h-3.5 w-3.5" />}
        {active ? "Copied" : "Copy"}
      </Button>
    </div>
  );
};

const WalletIcon: React.FC<{label:string}> = ({label}) => {
  const key = label.toLowerCase();
  if (key.includes('gopay')) {
    return (
      <span className="h-9 w-9 inline-flex items-center justify-center rounded-md bg-[#00A99D]/10 ring-1 ring-[#00A99D]/30">
        <svg viewBox="0 0 64 64" className="h-6 w-6" aria-label="GoPay" role="img">
          <circle cx="32" cy="32" r="30" fill="#00A99D" />
          <circle cx="32" cy="32" r="18" fill="#fff" />
          <circle cx="32" cy="32" r="9" fill="#00A99D" />
        </svg>
      </span>
    );
  }
  if (key.includes('shopee')) {
    return (
      <span className="h-9 w-9 inline-flex items-center justify-center rounded-md bg-[#EE4D2D]/10 ring-1 ring-[#EE4D2D]/30">
        <svg viewBox="0 0 64 64" className="h-6 w-6" aria-label="ShopeePay" role="img">
          <rect x="8" y="14" width="48" height="40" rx="6" fill="#EE4D2D" />
          <path d="M24 22c0-6 4-10 8-10s8 4 8 10" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M24 32h16v10H24z" fill="#fff" />
        </svg>
      </span>
    );
  }
  if (key.includes('dana')) {
    return (
      <span className="h-9 w-9 inline-flex items-center justify-center rounded-md bg-[#108FE5]/10 ring-1 ring-[#108FE5]/30">
        <svg viewBox="0 0 64 64" className="h-6 w-6" aria-label="DANA" role="img">
          <circle cx="32" cy="32" r="30" fill="#108FE5" />
          <rect x="16" y="24" width="32" height="16" rx="8" fill="#fff" />
        </svg>
      </span>
    );
  }
  return (
    <span className="h-9 w-9 inline-flex items-center justify-center rounded-md bg-muted text-xs font-medium">??</span>
  );
};
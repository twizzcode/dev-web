"use client";

import Checkout from "@/components/checkout"
import { useEffect } from "react"

const Blogpage = () => {
  useEffect(() => {
    const snapScriptUrl = process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL || "https://app.sandbox.midtrans.com/snap/snap.js";
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || process.env.NEXT_PUBLIC_CLIENT

    const script = document.createElement("script");
    script.src = snapScriptUrl;
    script.setAttribute("data-midtrans-snap", "true");
    script.setAttribute("data-client-key", clientKey || "");
    script.async = true;

    document.body.appendChild(script);

    return () => {
      const existing = document.querySelector('script[data-midtrans-snap="true"]');
      if (existing) document.body.removeChild(existing);
    };
    
  }, []);
  return (
    <div className="flex flex-1 flex-col h-[calc(100vh-80px)] overflow-hidden">
      <Checkout />
    </div>
  )
}

export default Blogpage
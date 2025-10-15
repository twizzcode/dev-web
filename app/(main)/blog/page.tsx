"use client";

import Checkout from "@/components/checkout"
import { useEffect } from "react"

const Blogpage = () => {
  useEffect(() => {
    const snapSript = "https://app.sandbox.midtrans.com/snap/snap.js"
    const clientKey = process.env.NEXT_PUBLIC_CLIENT

    const script = document.createElement("script");
    script.src = snapSript;
    script.setAttribute("data-client-key", clientKey || "");
    script.async = true;

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
    
  }, []);
  return (
    <div className="flex flex-1 flex-col h-[calc(100vh-80px)] overflow-hidden">
      <Checkout />
    </div>
  )
}

export default Blogpage
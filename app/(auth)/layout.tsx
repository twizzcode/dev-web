import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Login - Twizz Cutter",
  description: "Sign in to Twizz Cutter",
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user) {
    redirect("/"); // sudah login → kirim ke home
  }
  return children;
}
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - Twizz Cutter",
  description: "Sign in to Twizz Cutter",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
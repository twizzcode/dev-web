import { NextResponse } from "next/server";
import { auth } from "./auth";

export default auth((req) => {
  const { nextUrl } = req;
  const isAdminPath = nextUrl.pathname.startsWith("/admin");

  if (isAdminPath) {
    const role = req.auth?.user && typeof (req.auth.user as { role?: string }).role === 'string' ? (req.auth.user as { role?: string }).role : undefined;
    if (role !== "ADMIN") {
  const login = new URL("/login", req.url);
      return NextResponse.redirect(login);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};

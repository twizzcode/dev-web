import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const isAdminPath = nextUrl.pathname.startsWith("/admin");

  if (isAdminPath) {
    // Lightweight token check at the edge without importing full auth config
  const token = await getToken({ req, secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET });
    const role = (token as { role?: string } | null)?.role;
    if (role !== "ADMIN") {
      const login = new URL("/login", req.url);
      return NextResponse.redirect(login);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

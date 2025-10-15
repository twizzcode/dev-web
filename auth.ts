import NextAuth from "next-auth"
import { prisma } from "@/lib/prisma"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV !== "production",
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // persist custom fields from User to token on first login
        token.id = user.id
        token.role = (user as { role?: string }).role ?? "USER"
      } else if (token?.id) {
        // Keep role in sync with DB if it changes after login (e.g., promoted to ADMIN)
        try {
          const db = await prisma.user.findUnique({ where: { id: token.id as string }, select: { role: true } });
          if (db?.role && db.role !== (token as { role?: string }).role) {
            (token as { role?: string }).role = db.role;
          }
        } catch {
          // ignore sync failures; fall back to existing token role
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token as { id?: string }).id as string
        session.user.role = (token as { role?: string }).role ?? "USER"
      }
      return session
    },
  },
  logger: {
    error: (...args) => console.error("[next-auth][error]", ...args),
    warn: (...args) => console.warn("[next-auth][warn]", ...args),
    debug: (...args) => console.debug("[next-auth][debug]", ...args),
  },
})
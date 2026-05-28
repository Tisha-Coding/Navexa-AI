import type { NextAuthConfig } from "next-auth";

// Edge-safe NextAuth config (NO prisma, NO bcrypt, NO Node-only deps).
// Used by middleware.ts which runs in the Edge runtime.
// auth.ts extends this with the Credentials provider (which uses prisma + bcrypt — server only).
export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [], // attached in auth.ts (server-only)
  callbacks: {
    // Persist user id + role on the JWT
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    // Expose id + role on session.user
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authConfig } from "./auth.config";

// Schema for login form input — Zod validates before DB hit
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Full NextAuth instance (server-only). Extends the Edge-safe authConfig
// by adding the Credentials provider which uses prisma + bcrypt.
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // 1. Validate input shape
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // 2. Find user (soft-delete auto-filtered by extension)
        const user = await prisma.user.findFirst({ where: { email } });
        if (!user) return null;

        // 3. Verify password against hash
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        // 4. Return user data → goes into JWT
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
});

import { handlers } from "@/auth";

// NextAuth v5 catch-all route handler.
// Exposes /api/auth/signin, /api/auth/signout, /api/auth/callback/*,
// /api/auth/session, /api/auth/providers, /api/auth/csrf — all via the
// `handlers` object exported from auth.ts.
export const { GET, POST } = handlers;

// Force Node runtime — Credentials provider uses prisma + bcrypt (Node-only).
export const runtime = "nodejs";

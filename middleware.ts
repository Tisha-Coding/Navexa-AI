import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Use the Edge-safe authConfig here — middleware runs in the Edge runtime,
// which can't import prisma or bcrypt (Node-only). The full auth.ts is for
// route handlers and server components.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const protectedRoutes = ["/dashboard", "/resumes", "/jobs", "/analyses", "/applications"];
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  const authPages = ["/login", "/signup"];
  const isAuthPage = authPages.includes(pathname);

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(loginUrl);
  }

  if (isAuthPage && isLoggedIn) {
    return Response.redirect(new URL("/dashboard", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

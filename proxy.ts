import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Next.js 16 renamed "middleware" → "proxy". Same function, same matcher;
// the file just moved. We import the Edge-safe authConfig (no prisma/bcrypt)
// because proxy still runs in the Edge runtime.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAdmin = req.auth?.user?.role === "ADMIN";
  const { pathname } = req.nextUrl;

  // /admin/* — login + ADMIN role required
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) return Response.redirect(new URL("/login", req.nextUrl.origin));
    if (!isAdmin) return Response.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  // Protected app routes — login required, admin not allowed
  const protectedRoutes = ["/dashboard", "/resumes", "/jobs", "/analyses", "/applications"];
  if (protectedRoutes.some((r) => pathname.startsWith(r))) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return Response.redirect(loginUrl);
    }
    if (isAdmin) return Response.redirect(new URL("/admin", req.nextUrl.origin));
  }

  // Redirect logged-in users away from auth pages
  const authPages = ["/login", "/signup"];
  if (authPages.includes(pathname) && isLoggedIn) {
    return Response.redirect(new URL("/dashboard", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

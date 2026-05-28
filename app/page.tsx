import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Root route — bounce based on auth state:
//   logged in  → /dashboard
//   logged out → /login
export default async function HomePage() {
  const session = await auth();
  redirect(session ? "/dashboard" : "/login");
}

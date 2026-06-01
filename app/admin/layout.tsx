import { auth } from "@/auth";
import { redirect } from "next/navigation";

// Secondary guard — middleware handles redirects at the edge,
// this catches any layout-level rendering after a JWT change.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  return <>{children}</>;
}

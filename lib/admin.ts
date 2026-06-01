import { auth } from "@/auth";
import { NextResponse } from "next/server";

type AdminOk = { session: { user: { id: string; role: string } }; error?: never };
type AdminFail = { error: NextResponse; session?: never };

// Use at the top of every /api/admin/* route handler.
// Returns { session } on success, { error: NextResponse } on failure.
// Double-checks role server-side — middleware is a first line, not the only line.
export async function requireAdmin(): Promise<AdminOk | AdminFail> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (session.user.role !== "ADMIN") {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session: session as { user: { id: string; role: string } } };
}

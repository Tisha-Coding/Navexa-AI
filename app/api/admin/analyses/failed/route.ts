import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { NextResponse } from "next/server";

// GET /api/admin/analyses/failed
// Returns the 50 most recent failed analyses with user + resume + JD context,
// so the admin can diagnose whether failures are API errors or data issues.
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const failed = await prisma.analysis.findMany({
    where: { status: "FAILED" },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      failedReason: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
      resume: { select: { title: true } },
      jobDescription: { select: { title: true, company: true } },
    },
  });

  return NextResponse.json({ failed });
}

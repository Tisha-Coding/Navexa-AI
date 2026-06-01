import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { NextResponse } from "next/server";

// GET /api/admin/stats
// Returns aggregate counts for the admin dashboard overview cards.
// Soft-deleted rows are auto-excluded by the Prisma extension.
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [totalUsers, totalResumes, totalAnalyses, failedAnalyses, todayResumes] =
    await Promise.all([
      prisma.user.count(),
      prisma.resume.count(),
      prisma.analysis.count(),
      prisma.analysis.count({ where: { status: "FAILED" } }),
      prisma.resume.count({ where: { createdAt: { gte: todayStart } } }),
    ]);

  return NextResponse.json({
    totalUsers,
    totalResumes,
    totalAnalyses,
    failedAnalyses,
    todayResumes,
  });
}

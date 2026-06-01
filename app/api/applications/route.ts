import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Kanban-style Application tracker — one row per company application.
//
// GET   /api/applications          → list (grouped client-side by status)
// POST  /api/applications          → create from a JD (and optional analysis)
// PATCH /api/applications?id=...   → update status / notes / appliedDate
// DELETE /api/applications?id=...  → soft delete

const STATUSES = ["SAVED", "APPLIED", "INTERVIEW", "OFFER", "REJECTED"] as const;

const createSchema = z.object({
  // Either link a JD (preferred — auto-fills company/position) or pass them manually.
  jobDescriptionId: z.string().cuid().optional(),
  analysisId: z.string().cuid().optional(),
  company: z.string().trim().min(1).max(120).optional(),
  position: z.string().trim().min(1).max(120).optional(),
  status: z.enum(STATUSES).optional(),
  link: z.string().url().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

const patchSchema = z.object({
  status: z.enum(STATUSES).optional(),
  appliedDate: z.string().datetime().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  link: z.string().url().optional().nullable(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const applications = await prisma.application.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      company: true,
      position: true,
      status: true,
      appliedDate: true,
      link: true,
      notes: true,
      updatedAt: true,
      createdAt: true,
      jobDescription: { select: { id: true, title: true, company: true } },
      analysis: { select: { id: true, matchScore: true } },
    },
  });

  return NextResponse.json({ applications });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const data = parsed.data;

  // If a JD is linked, validate ownership AND pull defaults from it.
  let companyDefault: string | undefined;
  let positionDefault: string | undefined;
  if (data.jobDescriptionId) {
    const jd = await prisma.jobDescription.findFirst({
      where: { id: data.jobDescriptionId, userId: session.user.id },
      select: { id: true, title: true, company: true },
    });
    if (!jd) {
      return NextResponse.json({ error: "Job description not found" }, { status: 404 });
    }
    positionDefault = jd.title;
    companyDefault = jd.company ?? undefined;
  }

  // Same for analysis — must belong to user.
  if (data.analysisId) {
    const a = await prisma.analysis.findFirst({
      where: { id: data.analysisId, userId: session.user.id },
      select: { id: true },
    });
    if (!a) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }
  }

  const position = data.position?.trim() || positionDefault;
  const company = data.company?.trim() || companyDefault;

  if (!position || !company) {
    return NextResponse.json(
      { error: "Company and position are required" },
      { status: 400 }
    );
  }

  const app = await prisma.application.create({
    data: {
      userId: session.user.id,
      jobDescriptionId: data.jobDescriptionId,
      analysisId: data.analysisId,
      company,
      position,
      status: data.status ?? "SAVED",
      link: data.link ?? null,
      notes: data.notes ?? null,
    },
  });

  return NextResponse.json({ success: true, application: app });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing application id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const exists = await prisma.application.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, status: true, appliedDate: true },
  });
  if (!exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Auto-set appliedDate when status flips to APPLIED for the first time.
  // Subtle UX win — user doesn't have to manually date-stamp each move.
  const movingToApplied =
    parsed.data.status === "APPLIED" && exists.status !== "APPLIED" && !exists.appliedDate;

  const updated = await prisma.application.update({
    where: { id },
    data: {
      ...parsed.data,
      appliedDate: parsed.data.appliedDate
        ? new Date(parsed.data.appliedDate)
        : movingToApplied
        ? new Date()
        : undefined,
    },
  });

  return NextResponse.json({ success: true, application: updated });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const app = await prisma.application.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!app) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.application.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { generateCoverLetter } from "@/lib/ai/cover-letter";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Cover-letter endpoint scoped to an analysis.
//
// GET    → return persisted cover letter (or null)
// POST   → generate fresh (overwrites)
// PATCH  → save user-edited version
// DELETE → clear

const patchSchema = z.object({
  coverLetter: z.string().min(50).max(5000),
});

async function loadAnalysis(id: string, userId: string) {
  return prisma.analysis.findFirst({
    where: { id, userId },
    include: {
      user: { select: { name: true } },
      resume: { select: { rawText: true } },
      jobDescription: { select: { title: true, company: true, rawText: true } },
    },
  });
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;

  const analysis = await prisma.analysis.findFirst({
    where: { id, userId: session.user.id },
    select: { coverLetter: true },
  });
  if (!analysis) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ coverLetter: analysis.coverLetter ?? null });
}

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;

  const analysis = await loadAnalysis(id, session.user.id);
  if (!analysis) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const coverLetter = await generateCoverLetter({
      candidateName: analysis.user.name,
      resumeText: analysis.resume.rawText,
      jdTitle: analysis.jobDescription.title,
      jdCompany: analysis.jobDescription.company,
      jdText: analysis.jobDescription.rawText,
      matchedSkills: analysis.matchedSkills,
      missingSkills: analysis.missingSkills,
      semanticSummary: analysis.summary,
    });

    const updated = await prisma.analysis.update({
      where: { id },
      data: { coverLetter },
      select: { coverLetter: true },
    });

    return NextResponse.json({ success: true, coverLetter: updated.coverLetter });
  } catch (error) {
    console.error("Cover letter generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate cover letter. Please try again." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Cover letter must be 50–5000 characters" },
      { status: 400 }
    );
  }

  const analysis = await prisma.analysis.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!analysis) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.analysis.update({
    where: { id },
    data: { coverLetter: parsed.data.coverLetter },
    select: { coverLetter: true },
  });

  return NextResponse.json({ success: true, coverLetter: updated.coverLetter });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;

  const analysis = await prisma.analysis.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!analysis) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.analysis.update({
    where: { id },
    data: { coverLetter: null },
  });

  return NextResponse.json({ success: true });
}

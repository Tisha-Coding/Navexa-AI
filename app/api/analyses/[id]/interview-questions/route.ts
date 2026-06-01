import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  generateInterviewQuestions,
  type InterviewSet,
} from "@/lib/ai/interview-questions";
import { NextRequest, NextResponse } from "next/server";

// Interview-prep questions endpoint scoped to an analysis.
//
// Stored as JSON in Analysis.interviewQuestions — the shape is the
// `InterviewSet` from the AI lib. UI re-validates client-side but trust
// the schema (we wrote it).
//
// GET    → return persisted set (or null)
// POST   → generate fresh (overwrites)
// DELETE → clear

async function loadAnalysis(id: string, userId: string) {
  return prisma.analysis.findFirst({
    where: { id, userId },
    include: {
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
    select: { interviewQuestions: true },
  });
  if (!analysis) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    interviewQuestions: (analysis.interviewQuestions as InterviewSet | null) ?? null,
  });
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
    const set = await generateInterviewQuestions({
      resumeText: analysis.resume.rawText,
      jdTitle: analysis.jobDescription.title,
      jdCompany: analysis.jobDescription.company,
      jdText: analysis.jobDescription.rawText,
      matchedSkills: analysis.matchedSkills,
      missingSkills: analysis.missingSkills,
    });

    await prisma.analysis.update({
      where: { id },
      data: { interviewQuestions: set },
    });

    return NextResponse.json({ success: true, interviewQuestions: set });
  } catch (error) {
    console.error("Interview Qs generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate interview questions. Please try again." },
      { status: 500 }
    );
  }
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
    data: { interviewQuestions: null as never },
  });

  return NextResponse.json({ success: true });
}

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { keywordScore } from "@/lib/scoring/keyword-score";
import { semanticScore } from "@/lib/scoring/semantic-score";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Weighting for the hybrid score:
//   40% deterministic keyword overlap  — explainable, instant
//   60% AI semantic match              — paraphrase + context aware
// Tuned so the AI layer dominates (job fit is rarely a pure keyword game)
// while keeping the keyword anchor visible to the user.
const KEYWORD_WEIGHT = 0.4;
const SEMANTIC_WEIGHT = 0.6;

const createSchema = z.object({
  resumeId: z.string().cuid(),
  jobDescriptionId: z.string().cuid(),
});

// GET /api/analyses — list current user's analyses
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const analyses = await prisma.analysis.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      matchScore: true,
      keywordScore: true,
      semanticScore: true,
      matchedSkills: true,
      missingSkills: true,
      summary: true,
      status: true,
      createdAt: true,
      resume: { select: { id: true, title: true } },
      jobDescription: { select: { id: true, title: true, company: true } },
    },
  });

  return NextResponse.json({ analyses });
}

// POST /api/analyses — run a new analysis
//
// Flow:
//   1. Validate input + load resume & JD (ownership-checked)
//   2. Create PENDING analysis row (gives user a record even if AI fails)
//   3. Run keyword + semantic scoring in parallel
//   4. Update row with COMPLETED + scores, or FAILED on error
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

  const { resumeId, jobDescriptionId } = parsed.data;
  const userId = session.user.id;

  // Load both with ownership check in a single query each — prevents IDOR
  // (user A analysing user B's resume against user C's JD, etc).
  const [resume, jd] = await Promise.all([
    prisma.resume.findFirst({
      where: { id: resumeId, userId },
      select: { id: true, rawText: true, extractedSkills: true },
    }),
    prisma.jobDescription.findFirst({
      where: { id: jobDescriptionId, userId },
      select: { id: true, title: true, rawText: true, extractedSkills: true },
    }),
  ]);

  if (!resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }
  if (!jd) {
    return NextResponse.json({ error: "Job description not found" }, { status: 404 });
  }

  // Step 1: create a PENDING analysis row so the user always has a record.
  const pending = await prisma.analysis.create({
    data: {
      userId,
      resumeId,
      jobDescriptionId,
      matchScore: 0,
      keywordScore: 0,
      semanticScore: 0,
      matchedSkills: [],
      missingSkills: [],
      summary: "",
      status: "PENDING",
    },
    select: { id: true },
  });

  try {
    // Step 2: run both layers in parallel — keyword is instant, semantic is the bottleneck.
    const kw = keywordScore(resume.extractedSkills, jd.extractedSkills);
    const sem = await semanticScore(resume.rawText, jd.rawText, jd.title);

    // Step 3: hybrid score — weighted average, rounded to int for storage.
    const matchScore = Math.round(
      kw.score * KEYWORD_WEIGHT + sem.score * SEMANTIC_WEIGHT
    );

    // Merge gap signals from both layers — keyword misses are facts,
    // semantic gaps are interpretive. De-dupe by lower-case.
    const missingSet = new Map<string, string>();
    for (const m of kw.missing) missingSet.set(m.toLowerCase(), m);
    for (const g of sem.gaps) {
      if (!missingSet.has(g.toLowerCase())) missingSet.set(g.toLowerCase(), g);
    }

    const updated = await prisma.analysis.update({
      where: { id: pending.id },
      data: {
        status: "COMPLETED",
        matchScore,
        keywordScore: kw.score,
        semanticScore: sem.score,
        matchedSkills: kw.matched,
        missingSkills: Array.from(missingSet.values()),
        summary: sem.summary,
      },
      select: {
        id: true,
        matchScore: true,
        keywordScore: true,
        semanticScore: true,
        matchedSkills: true,
        missingSkills: true,
        summary: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      analysis: {
        ...updated,
        // Surface extra signals the schema doesn't persist but UI can render
        strengths: sem.strengths,
        jdSkillCount: kw.jdSkillCount,
        extraSkills: kw.extra,
      },
    });
  } catch (error) {
    console.error("Analysis failed:", error);
    const failedReason =
      error instanceof Error ? error.message.slice(0, 500) : "Unknown error";
    await prisma.analysis.update({
      where: { id: pending.id },
      data: { status: "FAILED", failedReason },
    });
    return NextResponse.json(
      { error: "AI analysis failed. Please try again.", analysisId: pending.id },
      { status: 500 }
    );
  }
}

// DELETE /api/analyses?id=<analysisId> — soft delete with ownership check
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const analysis = await prisma.analysis.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!analysis) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.analysis.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}

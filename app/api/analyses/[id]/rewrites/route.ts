import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { extractBullets } from "@/lib/extract-bullets";
import { rewriteBullet } from "@/lib/ai/rewrite-bullet";
import { NextRequest, NextResponse } from "next/server";

// Bullet rewrites endpoint — scoped to a specific analysis.
//
// GET  /api/analyses/[id]/rewrites  → list existing rewrites
// POST /api/analyses/[id]/rewrites  → generate fresh rewrites (idempotent: clears existing)

// Cap how many bullets we send to the LLM at once — keeps cost + latency bounded
// even if a resume has 30+ bullets. Top ones (extracted earliest) are usually
// from the most recent role, which is what JD matching cares about most.
const MAX_BULLETS = 8;

async function loadAnalysis(id: string, userId: string) {
  return prisma.analysis.findFirst({
    where: { id, userId },
    include: {
      resume: { select: { rawText: true } },
      jobDescription: { select: { title: true } },
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

  // Ownership check via analysis
  const analysis = await prisma.analysis.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!analysis) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const rewrites = await prisma.bulletRewrite.findMany({
    where: { analysisId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ rewrites });
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
  if (!analysis) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Extract bullets from the resume text (deterministic, no AI yet)
  const bullets = extractBullets(analysis.resume.rawText).slice(0, MAX_BULLETS);
  if (bullets.length === 0) {
    return NextResponse.json(
      { error: "No bullet points detected in the resume. The PDF may not be text-based." },
      { status: 422 }
    );
  }

  // Wipe previous rewrites for this analysis — a fresh run replaces them.
  // BulletRewrite is hard-deleted (it's derived data, no audit value).
  await prisma.bulletRewrite.deleteMany({ where: { analysisId: id } });

  // Rewrite all bullets in parallel — Groq is fast, this is the right tradeoff.
  // Use allSettled so one failure doesn't lose the rest.
  const results = await Promise.allSettled(
    bullets.map((original) =>
      rewriteBullet({
        original,
        jdTitle: analysis.jobDescription.title,
        jdSummary: analysis.summary,
        missingSkills: analysis.missingSkills,
      }).then((r) => ({ original, ...r }))
    )
  );

  const successful = results
    .filter((r): r is PromiseFulfilledResult<{ original: string; rewritten: string; rationale: string }> =>
      r.status === "fulfilled"
    )
    .map((r) => r.value);

  if (successful.length === 0) {
    return NextResponse.json({ error: "All rewrites failed. Try again." }, { status: 502 });
  }

  await prisma.bulletRewrite.createMany({
    data: successful.map((r) => ({
      analysisId: id,
      original: r.original,
      rewritten: r.rewritten,
      status: "PENDING" as const,
    })),
  });

  const rewrites = await prisma.bulletRewrite.findMany({
    where: { analysisId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    success: true,
    rewrites,
    totalBullets: bullets.length,
    rewrittenCount: successful.length,
  });
}


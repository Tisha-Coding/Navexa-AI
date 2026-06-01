import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { extractSkills } from "@/lib/extract-skills";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createJobSchema = z.object({
  title: z.string().trim().min(1, "Title required").max(120),
  company: z.string().trim().max(120).optional().nullable(),
  rawText: z.string().trim().min(50, "JD must be at least 50 characters").max(50_000),
  sourceUrl: z.string().url().optional().nullable(),
});

// GET /api/jobs — list current user's JDs
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jobs = await prisma.jobDescription.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      company: true,
      extractedSkills: true,
      sourceUrl: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ jobs });
}

// POST /api/jobs — create a new JD (paste flow)
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

  const parsed = createJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { title, company, rawText, sourceUrl } = parsed.data;
  const extractedSkills = extractSkills(rawText);

  const job = await prisma.jobDescription.create({
    data: {
      userId: session.user.id,
      title,
      company: company ?? null,
      rawText,
      sourceUrl: sourceUrl ?? null,
      extractedSkills,
    },
    select: {
      id: true,
      title: true,
      company: true,
      extractedSkills: true,
      sourceUrl: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ success: true, job });
}

// DELETE /api/jobs?id=<jobId> — soft delete with ownership check
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing job id" }, { status: 400 });
  }

  // IDOR guard — ensure JD belongs to current user
  const job = await prisma.jobDescription.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });

  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.jobDescription.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}

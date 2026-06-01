import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { findGithubUsername } from "@/lib/extract-profiles";
import { scanGithubProfile, type GithubScan } from "@/lib/scanners/github";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// GitHub profile scan endpoint, scoped to one resume.
//
// GET    → return latest persisted scan (with the auto-detected username, if any)
// POST   → run a fresh scan (body may override the username)
// DELETE → clear the persisted scan

const postSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .optional()
    .describe("Optional override — otherwise auto-detected from resume text"),
});

async function ownedResume(resumeId: string, userId: string) {
  return prisma.resume.findFirst({
    where: { id: resumeId, userId },
    select: { id: true, rawText: true },
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

  const resume = await ownedResume(id, session.user.id);
  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const detected = findGithubUsername(resume.rawText);

  const scan = await prisma.profileScan.findFirst({
    where: { resumeId: id, platform: "GITHUB" },
    orderBy: { scannedAt: "desc" },
  });

  return NextResponse.json({
    detectedUsername: detected,
    scan: scan
      ? {
          username: scan.username,
          scannedAt: scan.scannedAt,
          data: scan.data as unknown as GithubScan,
        }
      : null,
  });
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;

  const resume = await ownedResume(id, session.user.id);
  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // empty body is fine — we'll auto-detect from resume
  }
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  const username =
    parsed.data.username?.trim() || findGithubUsername(resume.rawText) || null;

  if (!username) {
    return NextResponse.json(
      { error: "No GitHub username found in resume. Provide one explicitly." },
      { status: 422 }
    );
  }

  let scan: GithubScan;
  try {
    scan = await scanGithubProfile(username);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Scan failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // Replace previous scan — only the latest is interesting.
  // (We could keep a history table, but ProfileScan is one row per (resume,platform).)
  await prisma.profileScan.deleteMany({
    where: { resumeId: id, platform: "GITHUB" },
  });
  const saved = await prisma.profileScan.create({
    data: {
      resumeId: id,
      platform: "GITHUB",
      username: scan.username,
      // Prisma typing for Json is loose; we know our shape.
      data: scan as unknown as Parameters<typeof prisma.profileScan.create>[0]["data"]["data"],
    },
  });

  return NextResponse.json({
    success: true,
    scan: {
      username: saved.username,
      scannedAt: saved.scannedAt,
      data: scan,
    },
  });
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

  const resume = await ownedResume(id, session.user.id);
  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.profileScan.deleteMany({
    where: { resumeId: id, platform: "GITHUB" },
  });

  return NextResponse.json({ success: true });
}

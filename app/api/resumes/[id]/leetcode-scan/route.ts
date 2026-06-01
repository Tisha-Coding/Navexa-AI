import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { findLeetcodeUsername } from "@/lib/extract-profiles";
import { scanLeetcodeProfile, type LeetcodeScan } from "@/lib/scanners/leetcode";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// LeetCode profile scan endpoint — mirrors the GitHub scan shape.
//
// GET    → latest persisted scan + detected username (if any)
// POST   → run a fresh scan (body may override the username)
// DELETE → clear the persisted scan

const postSchema = z.object({
  username: z.string().trim().min(1).max(40).optional(),
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

  const detected = findLeetcodeUsername(resume.rawText);

  const scan = await prisma.profileScan.findFirst({
    where: { resumeId: id, platform: "LEETCODE" },
    orderBy: { scannedAt: "desc" },
  });

  return NextResponse.json({
    detectedUsername: detected,
    scan: scan
      ? {
          username: scan.username,
          scannedAt: scan.scannedAt,
          data: scan.data as unknown as LeetcodeScan,
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
    /* allow empty body */
  }
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  const username =
    parsed.data.username?.trim() || findLeetcodeUsername(resume.rawText) || null;

  if (!username) {
    return NextResponse.json(
      { error: "No LeetCode username found in resume. Provide one explicitly." },
      { status: 422 }
    );
  }

  let scan: LeetcodeScan;
  try {
    scan = await scanLeetcodeProfile(username);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Scan failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  await prisma.profileScan.deleteMany({
    where: { resumeId: id, platform: "LEETCODE" },
  });
  const saved = await prisma.profileScan.create({
    data: {
      resumeId: id,
      platform: "LEETCODE",
      username: scan.username,
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
    where: { resumeId: id, platform: "LEETCODE" },
  });
  return NextResponse.json({ success: true });
}

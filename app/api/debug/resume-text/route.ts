import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { extractBullets } from "@/lib/extract-bullets";
import { NextRequest, NextResponse } from "next/server";

// DEBUG ONLY — inspect how a resume's raw text looks after PDF extraction.
// Remove once bullet extraction is stable.
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resumeId = request.nextUrl.searchParams.get("resumeId");

  const resume = resumeId
    ? await prisma.resume.findFirst({
        where: { id: resumeId, userId: session.user.id },
      })
    : await prisma.resume.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
      });

  if (!resume) return NextResponse.json({ error: "No resume found" }, { status: 404 });

  const lines = resume.rawText.split(/\r?\n/);
  const bullets = extractBullets(resume.rawText);

  return NextResponse.json({
    title: resume.title,
    totalChars: resume.rawText.length,
    totalLines: lines.length,
    bulletsFound: bullets.length,
    bullets,
    firstFewLines: lines.slice(0, 50),
    rawTextSample: resume.rawText.slice(0, 1500),
  });
}

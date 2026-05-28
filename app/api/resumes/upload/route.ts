import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import * as pdfParse from "pdf-parse";
import { z } from "zod";

const uploadSchema = z.object({
  title: z.string().min(1).max(100),
  file: z.instanceof(File).refine((file) => file.type === "application/pdf", "File must be PDF"),
});

function extractSkills(text: string): string[] {
  const commonSkills = [
    "JavaScript",
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "Express",
    "Python",
    "Java",
    "C++",
    "Go",
    "Rust",
    "SQL",
    "PostgreSQL",
    "MongoDB",
    "Redis",
    "Docker",
    "Kubernetes",
    "AWS",
    "GCP",
    "Azure",
    "Git",
    "REST",
    "GraphQL",
    "CSS",
    "HTML",
    "Tailwind",
    "Prisma",
    "Vitest",
    "Jest",
    "Playwright",
    "CI/CD",
    "Linux",
    "Windows",
    "macOS",
  ];

  const foundSkills = new Set<string>();
  const lowerText = text.toLowerCase();

  for (const skill of commonSkills) {
    if (lowerText.includes(skill.toLowerCase())) {
      foundSkills.add(skill);
    }
  }

  return Array.from(foundSkills);
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const title = formData.get("title") as string;
    const file = formData.get("file") as File;

    if (!title || !file) {
      return NextResponse.json({ error: "Missing title or file" }, { status: 400 });
    }

    const validation = uploadSchema.safeParse({ title, file });
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const fileBuffer = await file.arrayBuffer();
    const pdfData = await pdfParse(Buffer.from(fileBuffer));
    const rawText = pdfData.text;
    const extractedSkills = extractSkills(rawText);

    const fileName = `resumes/${session.user.id}/${Date.now()}-${file.name}`;
    const blob = await put(fileName, Buffer.from(fileBuffer), {
      access: "token",
      contentType: "application/pdf",
    });

    const resume = await prisma.resume.create({
      data: {
        userId: session.user.id,
        title: validation.data.title,
        fileUrl: blob.url,
        rawText,
        extractedSkills,
      },
    });

    return NextResponse.json({
      success: true,
      resume: {
        id: resume.id,
        title: resume.title,
        extractedSkills: resume.extractedSkills,
        createdAt: resume.createdAt,
      },
    });
  } catch (error) {
    console.error("Resume upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

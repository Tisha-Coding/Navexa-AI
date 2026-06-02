import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { extractSkills } from "@/lib/extract-skills";
import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";
import { z } from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const uploadSchema = z.object({
  title: z.string().trim().min(4, "Title must be at least 4 characters").max(100),
  file: z.instanceof(File)
    .refine((file) => file.type === "application/pdf", "File must be PDF")
    .refine((file) => file.size <= MAX_FILE_SIZE, "File too large — max 5MB"),
});

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
    const blobBuffer = Buffer.from(fileBuffer);

    let rawText = "";
    try {
      const pdf = await getDocumentProxy(new Uint8Array(fileBuffer.slice(0)));
      const { text } = await extractText(pdf, { mergePages: true });
      rawText = Array.isArray(text) ? text.join("\n") : text;
    } catch (pdfErr: unknown) {
      const msg = pdfErr instanceof Error ? pdfErr.message.toLowerCase() : "";
      if (msg.includes("password") || msg.includes("encrypted")) {
        return NextResponse.json(
          { error: "PDF is password-protected. Please remove the password and try again." },
          { status: 422 }
        );
      }
      return NextResponse.json(
        { error: "Could not read this PDF. Make sure it is a valid, text-based PDF." },
        { status: 422 }
      );
    }

    const extractedSkills = extractSkills(rawText);

    const fileName = `resumes/${session.user.id}/${Date.now()}-${file.name}`;
    const blob = await put(fileName, blobBuffer, {
      access: "public",
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

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

// pg + bcrypt need Node runtime (Edge nahi chalega)
export const runtime = "nodejs";

// ───────────── Validation schema ─────────────
// Strict signup validation:
// - Name: 2-50 chars, trimmed
// - Email: RFC-valid format (Zod built-in .email())
// - Password: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
// - confirmPassword must match password
const signupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name cannot exceed 50 characters"),

    email: z.string().trim().toLowerCase().email("Invalid email format"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], // error attaches to confirmPassword field
  });

// ───────────── POST /api/auth/signup ─────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    // Email uniqueness check (findFirst is soft-delete aware via extension)
    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Hash password — bcrypt with 10 rounds (industry standard)
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user (default role = JOB_SEEKER per schema)
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, email: true, name: true, role: true }, // never expose passwordHash
    });

    return NextResponse.json(
      { user, message: "Account created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

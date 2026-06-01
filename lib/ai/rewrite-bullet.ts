import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { z } from "zod";

// One bullet rewrite — keeps the original truth but sharpens the language and,
// where natural, pulls in keywords from the JD's missing-skills list.
// Hard rules in the prompt prevent hallucination (no inventing tech, no
// fabricating numbers — only restating or estimating what's already there).

const rewriteSchema = z.object({
  rewritten: z
    .string()
    .min(15)
    .max(300)
    .describe("Improved bullet — same achievement, sharper verbs, JD-aligned"),
  rationale: z
    .string()
    .max(160)
    .describe("One short line explaining the change"),
});

export type BulletRewrite = z.infer<typeof rewriteSchema>;

export async function rewriteBullet({
  original,
  jdTitle,
  jdSummary,
  missingSkills,
}: {
  original: string;
  jdTitle: string;
  jdSummary: string;
  missingSkills: string[];
}): Promise<BulletRewrite> {
  const result = await generateObject({
    model: groq("openai/gpt-oss-20b"),
    schema: rewriteSchema,
    temperature: 0.4,
    system: [
      "You rewrite resume bullets to match a specific job description.",
      "Rules — follow strictly:",
      "1. NEVER invent technologies, companies, or metrics not implied by the original.",
      "2. Keep the same achievement and timeline — only sharpen language.",
      "3. Lead with a strong action verb (Led, Built, Shipped, Drove, Reduced…).",
      "4. Naturally weave in 1–2 JD-relevant skills ONLY if they fit the original work.",
      "5. Quantify if the original has any numbers; do NOT fabricate new numbers.",
      "6. Keep it one line, ≤ 280 chars.",
    ].join("\n"),
    prompt: [
      `# Target job: ${jdTitle}`,
      `# JD summary: ${jdSummary}`,
      missingSkills.length > 0
        ? `# JD-relevant skills to naturally incorporate IF appropriate: ${missingSkills.slice(0, 6).join(", ")}`
        : "",
      `# Original bullet:\n${original}`,
      "Return the rewritten bullet and a one-line rationale.",
    ]
      .filter(Boolean)
      .join("\n\n"),
  });

  return result.object;
}

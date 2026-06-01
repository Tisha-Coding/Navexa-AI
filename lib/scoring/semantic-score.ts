import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { z } from "zod";

// Semantic / LLM layer of the hybrid score.
//
// What this catches that keywords don't:
//  - paraphrases ("led migration" ≈ "drove platform refactor")
//  - adjacent skills (resume says "Postgres", JD says "relational DBs")
//  - seniority + scope signals ("mentored 4" ≈ "leadership experience")
//  - domain fit ("payments at 10k tps" ≈ "high-throughput systems")
//
// Returns a structured object (not free text) so the UI can render it
// reliably — Vercel AI SDK's generateObject + zod schema enforces that.

const semanticSchema = z.object({
  score: z.number().min(0).max(100).describe("0-100 overall semantic match"),
  strengths: z
    .array(z.string())
    .max(5)
    .describe("Top 3-5 reasons this candidate fits the JD"),
  gaps: z
    .array(z.string())
    .max(5)
    .describe("Top 3-5 things the JD asks for that the resume lacks"),
  summary: z.string().max(800).describe("One paragraph (≤ 600 chars) hiring-manager view"),
});

export type SemanticScore = z.infer<typeof semanticSchema>;

// We trim inputs aggressively — LLM context is the most expensive resource here
// and resumes/JDs often have boilerplate we don't need for matching.
const RESUME_CHAR_LIMIT = 8_000;
const JD_CHAR_LIMIT = 6_000;

export async function semanticScore(
  resumeText: string,
  jdText: string,
  jdTitle: string
): Promise<SemanticScore> {
  const resume = resumeText.slice(0, RESUME_CHAR_LIMIT);
  const jd = jdText.slice(0, JD_CHAR_LIMIT);

  const result = await generateObject({
    // 120b version handles multi-field schemas reliably — the 20b variant
    // occasionally truncates after the first 1-2 fields ("missing properties:
    // gaps, summary").
    model: groq("openai/gpt-oss-120b"),
    schema: semanticSchema,
    // Low temperature → consistent scores for the same input.
    temperature: 0.2,
    system: [
      "You are a senior technical recruiter scoring a resume against a job description.",
      "Be strict but fair. A 70+ score means the candidate could realistically interview.",
      "A 90+ score means they are a strong fit. Do not inflate scores.",
      "Focus on demonstrated experience, not just keywords.",
      "Identify genuine gaps the candidate would need to address.",
    ].join(" "),
    prompt: [
      `# Job Title\n${jdTitle}`,
      `# Job Description\n${jd}`,
      `# Candidate Resume\n${resume}`,
      "Score the semantic fit and return the structured analysis.",
    ].join("\n\n"),
  });

  return result.object;
}

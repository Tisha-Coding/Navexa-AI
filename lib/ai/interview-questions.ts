import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { z } from "zod";

// Interview prep generator.
//
// Goal — give the candidate a realistic *first-round* question set tailored to
// THIS exact JD + resume pairing. Each question pairs with a short answer
// scaffold so the candidate can practice (not memorise) — the scaffold is
// bullet-style talking points, not a script.
//
// We force a balanced mix across four categories so the user can't game it by
// only studying technical questions.

const categoryEnum = z.enum(["technical", "behavioral", "jd-specific", "gap"]);
const difficultyEnum = z.enum(["easy", "medium", "hard"]);

const questionSchema = z.object({
  question: z.string().min(15).max(280),
  category: categoryEnum,
  difficulty: difficultyEnum,
  // "Why they ask" — interviewer-side intent, helps candidate think strategically
  whyAsked: z.string().max(180),
  // 2-4 bullet-style talking points the candidate can build an answer from
  answerOutline: z.array(z.string().min(10).max(220)).min(2),
});

const interviewSchema = z.object({
  questions: z.array(questionSchema).min(6).max(10),
});

export type InterviewQuestion = z.infer<typeof questionSchema>;
export type InterviewSet = z.infer<typeof interviewSchema>;

const RESUME_CHAR_LIMIT = 6_000;
const JD_CHAR_LIMIT = 4_000;

export async function generateInterviewQuestions({
  resumeText,
  jdTitle,
  jdCompany,
  jdText,
  matchedSkills,
  missingSkills,
}: {
  resumeText: string;
  jdTitle: string;
  jdCompany: string | null;
  jdText: string;
  matchedSkills: string[];
  missingSkills: string[];
}): Promise<InterviewSet> {
  const resume = resumeText.slice(0, RESUME_CHAR_LIMIT);
  const jd = jdText.slice(0, JD_CHAR_LIMIT);

  const result = await generateObject({
    // Larger model — the 20b variant fails on this many nested constraints.
    // 120b reliably emits valid JSON for the full 8-question schema.
    model: groq("openai/gpt-oss-120b"),
    schema: interviewSchema,
    temperature: 0.4,
    system: [
      "You are a senior engineering interviewer preparing a first-round question set.",
      "Generate 8 questions across these categories with a balanced mix:",
      "  - technical    : core CS / framework / system-design relevant to JD",
      "  - behavioral   : STAR-style — collaboration, conflict, ownership",
      "  - jd-specific  : about a specific requirement in THIS job description",
      "  - gap          : probes a skill the resume is light on (so the candidate prepares)",
      "Rules:",
      "1. Questions must be specific to this resume + JD — no generic 'what is React' fluff.",
      "2. Each answerOutline is talking points (2-4 bullets), not a written answer.",
      "3. Mix difficulties — at least 2 easy, 3 medium, 2 hard.",
      "4. Pull concrete examples from the resume when possible.",
    ].join("\n"),
    prompt: [
      `# Target role\n${jdTitle}${jdCompany ? ` at ${jdCompany}` : ""}`,
      `# Job description\n${jd}`,
      `# Candidate resume\n${resume}`,
      matchedSkills.length > 0 ? `# Skills present in resume\n${matchedSkills.join(", ")}` : "",
      missingSkills.length > 0
        ? `# Skills the resume is light on (use these for 'gap' category)\n${missingSkills.slice(0, 8).join(", ")}`
        : "",
      "Generate the interview question set now.",
    ]
      .filter(Boolean)
      .join("\n\n"),
  });

  return {
    questions: result.object.questions.map((q) => ({
      ...q,
      answerOutline: q.answerOutline.slice(0, 4),
    })),
  };
}

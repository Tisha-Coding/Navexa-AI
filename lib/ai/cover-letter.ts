import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";

// Cover-letter generation.
//
// We use generateText (not generateObject) because the output IS the artifact
// the user sees — there's no downstream parsing. Markdown is the friendliest
// format: easy to render in UI, easy to copy into Word/Docs.
//
// The prompt is opinionated on style:
//   - 3 short paragraphs, ≤ 220 words total (recruiters scan, not read)
//   - Mention 2-3 specific JD requirements + concrete resume evidence for each
//   - No clichés ("I am writing to apply…", "passionate", "rockstar")
//   - First person, confident but not arrogant

const RESUME_CHAR_LIMIT = 6_000;
const JD_CHAR_LIMIT = 4_000;

export async function generateCoverLetter({
  candidateName,
  resumeText,
  jdTitle,
  jdCompany,
  jdText,
  matchedSkills,
  missingSkills,
  semanticSummary,
}: {
  candidateName: string;
  resumeText: string;
  jdTitle: string;
  jdCompany: string | null;
  jdText: string;
  matchedSkills: string[];
  missingSkills: string[];
  semanticSummary: string;
}): Promise<string> {
  const resume = resumeText.slice(0, RESUME_CHAR_LIMIT);
  const jd = jdText.slice(0, JD_CHAR_LIMIT);

  const { text } = await generateText({
    model: groq("openai/gpt-oss-20b"),
    temperature: 0.6, // a little warmth, still grounded
    system: [
      "You write tight, specific, no-fluff cover letters for engineering roles.",
      "Style rules — follow strictly:",
      "1. Exactly 3 short paragraphs. ≤ 220 words total.",
      "2. Open with a concrete reason for fit — NEVER 'I am writing to apply…'.",
      "3. Middle paragraph: name 2-3 JD requirements and give specific resume evidence for each.",
      "4. Close paragraph: brief, confident, mentions interest in the company specifically.",
      "5. NEVER use these words: passionate, rockstar, ninja, synergy, leverage, dynamic, exciting opportunity.",
      "6. NEVER invent companies, tools, or metrics not in the resume.",
      "7. Use plain markdown. No headings, no bullets — flowing prose only.",
    ].join("\n"),
    prompt: [
      `# Candidate name\n${candidateName}`,
      `# Target role\n${jdTitle}${jdCompany ? ` at ${jdCompany}` : ""}`,
      `# Job description\n${jd}`,
      `# Candidate resume\n${resume}`,
      matchedSkills.length > 0 ? `# Skills that already match\n${matchedSkills.join(", ")}` : "",
      missingSkills.length > 0
        ? `# JD-mentioned skills the resume is light on (acknowledge naturally only if you can spin them as adjacent learnings — do NOT fabricate experience)\n${missingSkills.slice(0, 5).join(", ")}`
        : "",
      semanticSummary ? `# AI assessment of fit\n${semanticSummary}` : "",
      "Write the cover letter now.",
    ]
      .filter(Boolean)
      .join("\n\n"),
  });

  return text.trim();
}

// Deterministic keyword-match layer of the hybrid score.
//
// Why deterministic at all (and not pure LLM)?
//  1. Cheap + instant — no API call needed for the first pass.
//  2. Explainable — we can show the user *exactly* which skills matched/missed.
//  3. Stable — same input always gives the same output (good for tests + caching).
// The semantic LLM layer (next file) covers what this misses: paraphrases,
// adjacent skills, seniority signals, etc.

export type KeywordScore = {
  score: number;            // 0–100
  matched: string[];        // skills present in BOTH resume + JD
  missing: string[];        // skills required by JD but absent in resume
  extra: string[];          // skills in resume that JD did not ask for
  jdSkillCount: number;     // total skills extracted from JD
};

export function keywordScore(
  resumeSkills: string[],
  jdSkills: string[]
): KeywordScore {
  // Normalize to a case-insensitive set for comparison, but preserve the
  // original casing in the returned arrays (better for UI).
  const resumeSet = new Map(resumeSkills.map((s) => [s.toLowerCase(), s]));
  const jdSet = new Map(jdSkills.map((s) => [s.toLowerCase(), s]));

  const matched: string[] = [];
  const missing: string[] = [];

  for (const [key, original] of jdSet) {
    if (resumeSet.has(key)) {
      matched.push(original);
    } else {
      missing.push(original);
    }
  }

  const extra: string[] = [];
  for (const [key, original] of resumeSet) {
    if (!jdSet.has(key)) extra.push(original);
  }

  // Edge case — JD had no detectable skills (e.g. generic / poorly written).
  // Return a neutral 0 instead of NaN; UI surfaces a warning.
  const score =
    jdSet.size === 0 ? 0 : Math.round((matched.length / jdSet.size) * 100);

  return {
    score,
    matched: matched.sort(),
    missing: missing.sort(),
    extra: extra.sort(),
    jdSkillCount: jdSet.size,
  };
}

// Pull bullet-point lines out of a resume's raw text.
//
// Resume PDFs vary wildly in how text comes out:
//   - Some preserve line breaks → bullets are on their own lines.
//   - Many (unpdf included) collapse everything to ONE long line but keep
//     the bullet glyphs (•, *, –) intact between bullets.
//   - Some strip both line breaks AND bullet glyphs (worst case).
//
// Strategy: split the text on bullet glyphs first to recover bullet boundaries
// even on single-line PDFs, then fall back to newline+marker heuristics.

const BULLET_CHARS = "•*◦›▪▫⋅·●▶►-";  // glyphs we split on (note: - is risky, only when between spaces)
const BULLET_SPLIT_REGEX = new RegExp(`(?:^|\\s)[${BULLET_CHARS}](?=\\s)`, "g");

const LEADING_MARKER = /^\s*(?:[-•*◦›▪▫⋅·●▶►]|\d+[.)])\s+/u;

const REJECT_PATTERNS: RegExp[] = [
  /^\s*$/,
  /^[A-Z\s]{4,}$/,
  /@/,
  /^\+?\d[\d\s\-()]{6,}$/,
  /^https?:\/\//,
  /^(linkedin|github|portfolio)/i,
  /^(experience|education|skills|projects|summary|objective|certifications|achievements|work)[\s:]*$/i,
];

const ACTION_VERBS = new Set([
  "led", "built", "designed", "developed", "shipped", "drove", "delivered",
  "implemented", "engineered", "architected", "created", "launched",
  "managed", "owned", "mentored", "scaled", "optimized", "improved",
  "reduced", "increased", "automated", "integrated", "migrated", "refactored",
  "deployed", "configured", "wrote", "spearheaded", "collaborated",
  "coordinated", "established", "introduced", "pioneered", "executed",
  "achieved", "boosted", "transformed", "streamlined", "redesigned",
  "rebuilt", "founded", "supervised", "presented", "researched",
  "analyzed", "produced", "trained", "supported", "secured",
]);

function isJunk(line: string): boolean {
  return REJECT_PATTERNS.some((re) => re.test(line));
}

function startsWithActionVerb(line: string): boolean {
  const firstWord = line.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "");
  return Boolean(firstWord && ACTION_VERBS.has(firstWord));
}

// Trim a bullet candidate of trailing junk (next section header bleeding in).
// We cut at the first ALL-CAPS multi-word phrase or known section name.
function trimTrailingJunk(s: string): string {
  // Cut at next bullet that snuck in
  const nextBullet = s.search(new RegExp(`\\s[${BULLET_CHARS}]\\s`));
  if (nextBullet > 0) s = s.slice(0, nextBullet);

  // Cut at next section header (ALL CAPS, 2+ words)
  const sectionHeader = s.match(/\b([A-Z]{3,}(\s+[A-Z]{3,})+)\b/);
  if (sectionHeader && sectionHeader.index !== undefined) {
    s = s.slice(0, sectionHeader.index);
  }
  return s.trim();
}

export function extractBullets(resumeText: string): string[] {
  if (!resumeText) return [];

  // Candidate set 1: split on bullet glyphs (handles single-line PDFs)
  const splitCandidates = resumeText
    .split(BULLET_SPLIT_REGEX)
    .map((chunk) => trimTrailingJunk(chunk.trim()))
    .filter(Boolean);

  // Candidate set 2: original line-based splitting (handles multi-line PDFs)
  const lineCandidates = resumeText
    .split(/\r?\n/)
    .map((l) => l.replace(LEADING_MARKER, "").trim())
    .filter(Boolean);

  const all = [...splitCandidates, ...lineCandidates];

  const bullets: string[] = [];
  const seen = new Set<string>();

  for (const raw of all) {
    if (!raw) continue;
    if (isJunk(raw)) continue;

    // A real bullet either has an action verb start OR is just a long
    // sentence-ish chunk (15-400 chars, contains spaces).
    const isLongSentence = raw.length >= 30 && raw.length <= 400 && /\s/.test(raw);
    if (!startsWithActionVerb(raw) && !isLongSentence) continue;

    // Final length sanity
    if (raw.length < 15 || raw.length > 400) continue;

    const key = raw.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    bullets.push(raw);
  }

  return bullets;
}

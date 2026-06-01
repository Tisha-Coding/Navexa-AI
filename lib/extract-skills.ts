// Shared skill dictionary used by both resume parser and JD parser.
// Keep this list curated — too broad → false positives, too narrow → missed skills.
// In Phase 3 we layer AI on top of this for semantic matches.
const SKILL_DICTIONARY = [
  // Languages
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust",
  "Ruby", "PHP", "Swift", "Kotlin", "Scala", "R", "SQL",

  // Frontend
  "React", "Next.js", "Vue", "Angular", "Svelte", "HTML", "CSS",
  "Tailwind", "SASS", "Redux", "Zustand",

  // Backend
  "Node.js", "Express", "NestJS", "Django", "Flask", "FastAPI",
  "Spring", "Rails", "GraphQL", "REST", "gRPC",

  // Databases
  "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "DynamoDB",
  "Prisma", "Mongoose", "TypeORM",

  // Cloud / DevOps
  "AWS", "GCP", "Azure", "Docker", "Kubernetes", "Terraform",
  "CI/CD", "GitHub Actions", "Jenkins", "Vercel", "Netlify",

  // Tools
  "Git", "Linux", "Bash", "Vim", "Postman", "Figma",

  // Testing
  "Jest", "Vitest", "Playwright", "Cypress", "Mocha",

  // AI / Data
  "OpenAI", "LangChain", "TensorFlow", "PyTorch", "Pandas", "NumPy",
];

export function extractSkills(text: string): string[] {
  if (!text) return [];

  const found = new Set<string>();
  const lower = text.toLowerCase();

  for (const skill of SKILL_DICTIONARY) {
    // Word-boundary check to avoid partial matches like "rust" matching inside "trust"
    const pattern = new RegExp(`(?:^|[^a-z0-9+#.])${escapeRegex(skill.toLowerCase())}(?:[^a-z0-9+#.]|$)`, "i");
    if (pattern.test(lower)) {
      found.add(skill);
    }
  }

  return Array.from(found).sort();
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

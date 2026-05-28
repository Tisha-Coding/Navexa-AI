# Navexa AI — Decisions Log

> Har major decision, uska context, aur **kyun ye choose kiya** — taaki future mein refer kar sakein,
> aur interview/viva mein confidently defend kar sakein.
> _Last updated: 2026-05-28_

---

## 1. Project & Scope

### 1.1 Project name
**Navexa AI** (originally working title "ResumeMatch AI", renamed 2026-05-28).

### 1.2 Assignment context
House of Edtech — **Fullstack Developer Fulltime Assignment, Jan 2026**.
- Mandatory: Next.js 16, React.js, Git, Tailwind CSS, PostgreSQL/MongoDB
- Forbidden: basic CRUD, to-do apps, task managers
- Wants: real problem-solving, AI as a core, scalability/security/testing/deployment

### 1.3 Problem we're solving
Job seekers apply blindly. ATS rejects 70%+ resumes on keyword mismatch. **Navexa AI** matches resume × JD with a hybrid score, exposes skill gaps, rewrites bullets, and generates cover letters.

### 1.4 Timeline
**4 days** to ship (as of 2026-05-28).

### 1.5 Scope = focused
Tier 1 CRUD + 4 core AI features + 3 unique differentiators — polished, not bloated.
Slip-buffer cut order: Interview Q's → GitHub scanner → skill-recovery self-check quiz.
**Never cut:** auth, core CRUD, match score, LeetCode scanner, deploy, footer.

---

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16** (App Router) | Mandatory. Full-stack in one. SSR/SSG. |
| Language | **TypeScript** | Mandatory. Type-safety. Fewer runtime bugs. |
| Styling | **Tailwind CSS** + **shadcn/ui** | Mandatory Tailwind. shadcn = Radix base → accessibility built-in. |
| Database | **PostgreSQL + Prisma** | Relational data (User → Resume → Analysis → Application). Prisma = indexes, migrations, type-safety. |
| DB hosting | **Neon** (serverless Postgres) | Free, Vercel-native, branching. |
| Auth | **NextAuth (Auth.js v5)** + Credentials + JWT | App-Router native. JWT = no extra DB tables. Granular role-based authz easy. |
| Validation | **Zod** | Schema-first, single source of truth for input validation. |
| AI | **Vercel AI SDK (`ai`)** + **Groq** (Llama 3.3 70B) | AI SDK explicitly mentioned in assignment. Groq free + very fast (≤200ms TTFT). |
| State / data | **TanStack Query** + Context | Server state caching, idiomatic Next.js patterns. |
| File upload | **Vercel Blob** + `pdf-parse` | Native to Vercel deploy, easy resume text extraction. |
| Rate limit | **Upstash Redis** + `@upstash/ratelimit` | Free tier, edge-friendly, AI cost control. |
| Testing | **Vitest** (unit/integration) + **Playwright** (E2E) | Industry standard, fast, modern. |
| CI/CD | **Vercel** + **GitHub Actions** | Mandatory deploy + assignment criteria for CI/CD. |

### 2.1 Why Postgres over Mongo
Data is relational (User→Resume→Analysis→JD→Application). Postgres + Prisma showcases proper schema design, indexes, FK constraints, soft-delete — stronger demonstration of "scalability" criteria.

### 2.2 Why Groq (not OpenAI/Gemini)
- **Free** — no demo cost
- **Fast** — Llama 3.3 70B at low latency, snappy UX
- AI SDK abstracts provider — swap to Gemini/OpenAI in 1 line if needed.

### 2.3 Why NOT Neon Auth
- Stack already locked to NextAuth + own User table (with `passwordHash`, `role`, `deletedAt`)
- Neon Auth creates `neon_auth.users_sync` — would conflict with our schema
- Assignment criteria values **demonstrating** auth + authz; managed auth hides that skill
- Vendor lock-in (Stack Auth)

---

## 3. Database Schema

File: [`prisma/schema.prisma`](prisma/schema.prisma)

### 3.1 Entities (9 models)
- **User** — auth + role
- **Resume** — uploaded resume + parsed text + extracted skills
- **JobDescription** — pasted JD + extracted required skills
- **Analysis** — Resume × JD result (scores, summary, AI outputs)
- **BulletRewrite** — per-bullet AI rewrites (accept/reject status)
- **SkillRecovery** — interactive missing-skill prompts
- **ProfileScan** — LeetCode/GitHub enrichment data
- **LinkCheck** — broken link checker results
- **Application** — applied jobs tracker with funnel status

### 3.2 Soft delete vs Hard delete

**Rule:** user-authored entities = soft delete · derived/computed data = hard delete (cascade).

| Entity | Type | Why |
|---|---|---|
| User | 🟢 Soft (`deletedAt`) | Account recovery, audit trail. |
| Resume | 🟢 Soft | Galti se delete ho sakti hai, valuable work. |
| JobDescription | 🟢 Soft | User-created, analyses reference it. |
| Analysis | 🟢 Soft | "Analysis history" is a product feature. |
| Application | 🟢 Soft | Funnel history valuable for the user. |
| BulletRewrite | 🔴 Hard (cascade) | Derived AI output, regenerable. |
| SkillRecovery | 🔴 Hard | Computed from Analysis. |
| ProfileScan | 🔴 Hard | Just re-scan, no audit value. |
| LinkCheck | 🔴 Hard | Re-check on demand. |

**Interview talking point:** "User-authored entities ko soft-delete kiya recovery/audit ke liye, derived data ko hard-delete kyunki regenerable hai — DB bloat avoid hota."

### 3.3 Hybrid score = 3 columns
`Analysis.matchScore` (final 0-100), `keywordScore` (deterministic layer), `semanticScore` (AI layer). Visible in schema → strong interview talking point: **"keyword + AI ka hybrid, fully transparent in DB."**

### 3.4 JSON vs separate table for AI outputs

| AI Output | Storage | Why |
|---|---|---|
| Match score, skills | Columns | Queryable, indexable. |
| Cover letter | `String?` | One-shot text, no per-item interactivity. |
| Interview questions | `Json?` | List of objects, displayed read-only. |
| **Bullet rewrites** | **Separate table** | User accepts/rejects **per bullet** → needs `status` column → not a Json blob. |
| Skill recovery | Separate table | Stateful (PENDING/KNOWN/UNKNOWN), interactive. |

### 3.5 Email unique + soft delete — known edge
Soft-deleted user's email stays "occupied" (can't re-register same email). Acceptable for assignment scope; document in README as "intentional — reactivation flow planned, not silent re-registration".

### 3.6 Indexes
Every FK + every status column + every `deletedAt` = `@@index([col])`. Scalability talking point.

---

## 4. Authentication & Authorization

### 4.1 Provider
**Credentials provider** (email + password). No social OAuth in scope.

### 4.2 Session strategy
**JWT** (`session: { strategy: "jwt" }`). No DB adapter tables (Account/Session) needed → lean schema.

### 4.3 Password hashing
**bcrypt** (`bcryptjs`), 10 rounds. Industry-standard balance.

### 4.4 Roles
Enum `Role` = `JOB_SEEKER | ADMIN`. Default `JOB_SEEKER`. Persisted in JWT + session via callbacks.

### 4.5 Edge runtime split (CRITICAL pattern)
**Problem:** Middleware runs in Edge runtime; Prisma + bcrypt are Node-only. Importing full `auth.ts` into middleware = build break (`node:path` not found).

**Solution:** Split config into two files —
- [`auth.config.ts`](auth.config.ts) — Edge-safe (only callbacks/session/pages, no providers). Used by middleware.
- [`auth.ts`](auth.ts) — Spreads `authConfig` + adds Credentials provider with `prisma` + `bcrypt`. Used by route handlers + RSCs.

**Interview talking point:** _"Auth.js v5 ke saath Prisma use karne ka standard pattern — Edge vs Node runtime split."_

### 4.6 Type augmentation
[`types/next-auth.d.ts`](types/next-auth.d.ts) extends `User`, `Session`, `JWT` to include `id` + `role`. Without this, TS errors on `session.user.role`.

### 4.7 Route protection
[`middleware.ts`](middleware.ts) protects `/dashboard`, `/resumes`, `/jobs`, `/analyses`, `/applications`. Auto-redirects:
- Logged out + protected route → `/login?callbackUrl=...`
- Logged in + auth page → `/dashboard`

### 4.8 Root route smart redirect
[`app/page.tsx`](app/page.tsx) checks session and bounces — `/login` or `/dashboard`. No "default Next.js page" ever shown.

### 4.9 Snappy login UX
After successful `signIn()`, use `window.location.replace("/dashboard")` (hard nav) instead of `router.push + refresh`. Browser sends fresh request with new session cookie → server-render dashboard in one round-trip → no client-state flicker.

---

## 5. Validation & Sanitization

> **Validation** = "is this input shape correct?" · **Sanitization** = "transform/clean it to be safe to use."
> Zod does both.

### 5.1 Why it matters — attacks blocked

| Attack | Example payload | How we block |
|---|---|---|
| **XSS** | `<script>alert(document.cookie)</script>` in name | React JSX auto-escapes; future: DOMPurify on JD/resume paste. |
| **SQL injection** | `' OR 1=1 --` in email | **Prisma parameterized queries** — no raw concat. |
| **Mass assignment / role injection** | `{ ..., role: "ADMIN" }` in signup body | Zod schema lists ONLY allowed fields. Extra fields stripped. |
| **NoSQL injection** | `{ email: { $ne: null } }` | Zod enforces `z.string().email()` → object rejected. |
| **SSRF** (future) | URL pointing to `127.0.0.1` in resume | Server-side DNS resolve + block private IPs before fetch. |
| **File upload abuse** | `.exe` renamed `.pdf` | MIME + magic-byte check (`%PDF-` first 4 bytes). |

### 5.2 What we sanitize where (current code)

| Place | Validation / sanitization |
|---|---|
| **Signup API** ([`app/api/auth/signup/route.ts`](app/api/auth/signup/route.ts)) | Zod: `name` 2–50 chars trimmed · `email` valid + `.toLowerCase().trim()` · `password` 8+ chars + regex (upper, lower, digit, special) · `confirmPassword` must match (via `.refine`) · **only these 4 fields allowed** — role can't be injected. |
| **NextAuth Credentials authorize** ([`auth.ts`](auth.ts)) | Zod re-validates email + password shape before DB hit. |
| **All Prisma queries** | Parameterized by default — SQL injection impossible. |
| **All React rendering** | JSX auto-escapes user-controlled strings. |
| **Future: JD/resume paste** | Server-side HTML strip via DOMPurify or similar before saving `rawText`. |
| **Future: file upload** | MIME check + magic bytes + max size 5MB. |
| **Future: Broken Link Checker** | SSRF guard — DNS resolve URL → reject `10.*`, `127.*`, `192.168.*`, `::1`, link-local. Fetch with 5s timeout + custom UA. |

### 5.3 Interview talking point
> "Maine input ko 3 layers pe protect kiya — (1) Zod schema validates shape + transforms (trim/lowercase), (2) Prisma parameterized queries SQL injection rokta hai, (3) React JSX XSS rokta hai. Future ke liye SSRF guards aur file upload checks bhi planned hain."

---

## 6. UI / UX

### 6.1 Design language
- **Vibe:** modern AI/SaaS — Linear / Stripe / Notion feel
- **Layout:** split-screen on auth (left = branded resume preview with match score, right = form)
- **Resume-themed:** floating subtle icons (FileText, Briefcase, BarChart3, Target, CheckCircle2, Sparkles) hint at the product without screaming

### 6.2 Color system
- **Base:** slate-50 background, slate-900/500/400 text hierarchy
- **Accent:** **violet-600** (single, consistent — gradients used only on the brand panel)
- **Glass cards:** `bg-white/85` + `ring-1 ring-slate-200/70` + `backdrop-blur-xl`
- **Brand panel gradient:** slate-900 → violet-900 → fuchsia-900

### 6.3 Components (reusable)
- [`components/app-background.tsx`](components/app-background.tsx) — mesh + grid + floating resume icons
- [`components/auth-brand-panel.tsx`](components/auth-brand-panel.tsx) — split-screen left panel with mock resume + match badge + feature row

### 6.4 Micro-interactions
- **Error auto-dismiss** — general errors fade out after 4s, field errors after 5s, "coming soon" toast after 2.5s
- **Button loading states** — animated SVG spinner + "Creating account…" / "Logging in…" text
- **Smooth transitions** — `transition-all duration-300` on collapsing error containers (`max-h` + `opacity`)
- **Snappy nav** — `window.location.replace` after login

### 6.5 Accessibility
- shadcn = Radix base → keyboard nav + ARIA roles built in
- `aria-live="polite"` on all toast/error containers
- `aria-hidden="true"` on decorative icons/blurs
- Touch targets ≥ 44px (`h-11` inputs/buttons)

---

## 7. File structure

```
navexa_ai/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── signup/route.ts          # POST signup — Zod + bcrypt + Prisma
│   │       └── [...nextauth]/route.ts   # NextAuth catch-all (GET/POST handlers)
│   ├── login/page.tsx                   # Login form (client)
│   ├── signup/page.tsx                  # Signup form (client)
│   ├── dashboard/page.tsx               # Protected dashboard (server, calls auth())
│   ├── page.tsx                         # Root — smart redirect based on session
│   ├── layout.tsx                       # Root layout
│   └── globals.css                      # Tailwind + shadcn CSS variables
├── components/
│   ├── ui/                              # shadcn primitives (button, input, label, card)
│   ├── app-background.tsx               # Shared mesh + icons background
│   └── auth-brand-panel.tsx             # Split-screen left panel for auth
├── lib/
│   ├── db.ts                            # Prisma client singleton + soft-delete extension
│   ├── utils.ts                         # cn() helper from shadcn
│   └── generated/prisma/                # Prisma 7 generated client (gitignored)
├── prisma/
│   └── schema.prisma                    # DB schema
├── types/
│   └── next-auth.d.ts                   # NextAuth type augmentation (id, role)
├── auth.ts                              # Full NextAuth instance (server-only)
├── auth.config.ts                       # Edge-safe NextAuth config (middleware uses this)
├── middleware.ts                        # Route protection
├── prisma.config.ts                     # Prisma 7 config (DB URL via dotenv)
├── .env                                 # DATABASE_URL + AUTH_SECRET (gitignore'd)
└── DECISIONS.md                         # This file
```

---

## 8. Prisma 7 gotchas (we hit these)

1. **`url` no longer allowed in `datasource`** → moved to `prisma.config.ts` (`datasource.url`).
2. **Enums must be multi-line** — single-line `enum X { A B }` rejected.
3. **Default generator changed** to `prisma-client` (new) — generates to a custom output folder (we use `../lib/generated/prisma`). Import from there, NOT from `@prisma/client`.
4. **Driver adapter required** at runtime — `@prisma/adapter-pg` + `pg` installed; `new PrismaClient({ adapter })`.
5. Soft-delete extension via `$extends({ query: { $allModels: { $allOperations } } })` — filters `deletedAt: null` on read ops automatically for the 5 soft-deletable models.

---

## 9. Open items / Future work

- [ ] Phase 2: Resume CRUD + PDF upload + parse
- [ ] Phase 2: JD CRUD + URL fetch (SSRF guarded)
- [ ] Phase 3: Hybrid match score (keyword + AI)
- [ ] Phase 3: Skill Recovery interactive flow
- [ ] Phase 3: LeetCode + GitHub scanners
- [ ] Phase 3: Broken Link Checker (SSRF guard)
- [ ] Phase 3: Bullet rewriter (accept/reject UI)
- [ ] Phase 3: Cover letter + Interview Q's
- [ ] Phase 4: Application tracker (Kanban funnel)
- [ ] Phase 4: Vitest unit + integration tests
- [ ] Phase 4: Playwright E2E
- [ ] Phase 4: Upstash rate limiting on AI routes
- [ ] Phase 4: Vercel deploy + GitHub Actions CI
- [ ] Phase 4: Footer with name + GitHub + LinkedIn (assignment mandatory)
- [ ] README with architecture diagram, security mitigations, screenshots

---

## 10. Talking points cheat-sheet (for interview/viva)

1. **"Hybrid match score"** — deterministic keyword + AI semantic, both stored separately in DB.
2. **"Soft-delete user-authored data, hard-delete derived"** — production-grade pattern.
3. **"Edge vs Node runtime split for Auth.js + Prisma"** — common pitfall, I handled it.
4. **"3-layer input safety"** — Zod validation, Prisma parameterized queries, React JSX escape.
5. **"SSRF mitigation on link checker"** — DNS resolve + private IP block + timeout + custom UA.
6. **"Interactive Skill Recovery"** — surfaces forgotten skills via AI dialog (my signature feature).
7. **"LeetCode/GitHub auto-enrichment"** — recruiter doesn't need to visit profiles.
8. **"AI result caching by content hash"** — cost control, faster reruns.
9. **"Prisma soft-delete via `$extends`"** — single source of truth, no manual `where` clauses scattered.
10. **"`window.location.replace` for snappy auth nav"** — single round-trip, no client state.

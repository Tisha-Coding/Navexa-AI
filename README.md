<div align="center">

# Navexa AI

**AI-powered resume × job-description matcher with hybrid scoring, AI rewrites, interview prep, and full pipeline tracking.**

Built for the *House of Edtech — Fullstack Developer Assignment*.

[Live demo](https://navexa-ai.vercel.app) · [GitHub](https://github.com/Tisha-Coding/Navexa-AI)

</div>

---

## Why this project

Job seekers do four things badly, across four different tabs:

1. Read a JD and *guess* how close their resume is.
2. Hand-rewrite bullets trying to match it.
3. Track 30+ applications in a Notes app.
4. Hope LinkedIn/GitHub links still work when a recruiter clicks.

Navexa AI puts all four into one focused workflow — with an AI layer that is strict, not flattering.

---

## Features

### Core flow

- **Auth** — NextAuth.js v5 (JWT sessions) with role support (`JOB_SEEKER` / `ADMIN`)
- **Resume upload** — PDF → text extraction + skill detection → Vercel Blob storage
- **JD intake** — paste raw text, skills auto-extracted
- **Hybrid Match Score** — 40% deterministic keyword overlap + 60% AI semantic match
- **AI Bullet Rewriter** — sharpened, JD-aligned versions of your bullets with one-click copy
- **Cover Letter** — ≤220 words, no clichés, editable and downloadable
- **Interview Prep** — 8 questions across technical / behavioural / JD-specific / gap categories, each with answer outlines
- **GitHub Scanner** — public profile, all repos sorted by stars, top languages, stargazers
- **LeetCode Scanner** — solved counts by difficulty, contest rating, languages
- **Application Tracker** — Kanban board with drag-and-drop across `SAVED → APPLIED → INTERVIEW → OFFER → REJECTED`
- **Admin Panel** — user stats, per-user activity breakdown, failed analyses log

### Cross-cutting

- Soft delete on user-authored data; hard delete on derived AI output
- IDOR guard on every API — ownership re-checked from the session, never the request body
- Zod validation on every API input and every AI output (structured-output schemas)
- Optimistic UI on drag-drop and status changes

---

## Tech stack

| Layer | Choice |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript (strict) |
| **Auth** | NextAuth.js v5 — Credentials provider + JWT sessions |
| **Database** | PostgreSQL on Neon (serverless) |
| **ORM** | Prisma 7 + `@prisma/adapter-pg` with soft-delete `$extends` |
| **AI** | Vercel AI SDK + Groq (`openai/gpt-oss-120b`) |
| **File storage** | Vercel Blob (public store) |
| **PDF parsing** | `unpdf` — serverless-friendly, no worker file issues |
| **UI** | Tailwind CSS 4 + shadcn/ui + Lucide icons |
| **Drag-drop** | `@dnd-kit/core` — accessible, headless |
| **Validation** | Zod — one schema for parse + type inference |
| **Password hashing** | bcryptjs (10 rounds) |
| **Hosting** | Vercel |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      Next.js App Router                      │
│                                                              │
│  ┌────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  Server Pages  │  │ Client Components│  │Route Handlers│  │
│  │ (RSC + auth()) │  │ (forms, kanban)  │  │ (REST + JSON)│  │
│  └───────┬────────┘  └────────┬─────────┘  └──────┬───────┘  │
│          └───────────────────┼────────────────────┘          │
│                              ▼                               │
│  ┌──────────┐  ┌───────────┐  ┌────────────┐  ┌───────────┐  │
│  │  lib/db  │  │ lib/ai/*  │  │lib/scoring │  │lib/scanner│  │
│  │ Prisma + │  │Groq calls │  │keyword +   │  │GitHub +   │  │
│  │soft-del  │  │+ zod      │  │semantic    │  │LeetCode   │  │
│  └────┬─────┘  └─────┬─────┘  └──────┬─────┘  └─────┬─────┘  │
└───────┼──────────────┼───────────────┼───────────────┼────────┘
        ▼              ▼               ▼               ▼
   PostgreSQL       Groq API      (in-process)   GitHub / LC
    (Neon)       (gpt-oss-120b)                  public APIs
```

### Hybrid Match Score

```
             matchScore (0–100)
                    │
             weighted sum
          ┌──────────┴──────────┐
          │                     │
   keyword score (40%)   semantic score (60%)
          │                     │
  matched / total JD      Groq LLM — strengths,
  skills from a 70+        gaps, summary
  word dictionary          json_schema + Zod
```

### Soft-delete strategy

User-authored entities (`User`, `Resume`, `JobDescription`, `Analysis`, `Application`) carry `deletedAt`. A Prisma `$extends` query layer auto-injects `deletedAt: null` on every read — no manual `where` clauses scattered across the codebase.

Derived AI output (`BulletRewrite`, `ProfileScan`, `LinkCheck`) is hard-deleted on re-run — regenerable, no audit value.

---

## Getting started

### Prerequisites

- Node 20+
- A [Neon](https://neon.tech) PostgreSQL database (free tier)
- A [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) store
- A [Groq](https://console.groq.com) API key

### Environment variables

```bash
DATABASE_URL="postgresql://…/neondb?sslmode=require&channel_binding=require"
AUTH_SECRET="run: openssl rand -hex 32"
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_…"
GROQ_API_KEY="gsk_…"
```

### Run locally

```bash
npm install
npx prisma db push      # apply schema to your Neon DB
npm run dev             # http://localhost:3000
```

### Create an admin account

Sign up normally through the app, then run in your Neon SQL editor:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your@email.com';
```

Log out and log back in — the app will redirect you to `/admin` automatically.

### Deploy

Connect the GitHub repo to Vercel, add the four env vars, and push to `main`. The build command (`prisma generate && next build`) generates the Prisma client automatically.

---

## Folder layout

```
app/
  (auth)/login            ← split-screen auth layout
  (auth)/signup
  admin/                  ← admin panel (ADMIN role only)
  api/
    auth/[…nextauth]      ← NextAuth catch-all
    auth/signup           ← email + password create
    resumes               ← list / delete
    resumes/upload        ← PDF → Blob → DB
    resumes/[id]/github-scan
    resumes/[id]/leetcode-scan
    jobs                  ← list / create / delete
    analyses              ← list / create / delete
    analyses/[id]/rewrites
    analyses/[id]/cover-letter
    analyses/[id]/interview-questions
    applications          ← Kanban CRUD
    admin/stats
    admin/analyses/failed
  dashboard
  resumes
  jobs
  analyses / analyses/[id]
  applications

components/
  app-background, auth-brand-panel
  bullet-rewriter, cover-letter, interview-questions
  github-scanner, leetcode-scanner
  footer, ui/             ← shadcn primitives

lib/
  db.ts                   ← Prisma client + soft-delete extension
  extract-skills.ts       ← 70+ skill dictionary
  extract-bullets.ts      ← marker + action-verb detection
  extract-profiles.ts     ← GitHub / LeetCode handle detection from resume text
  admin.ts                ← requireAdmin() guard
  ai/
    rewrite-bullet.ts
    cover-letter.ts
    interview-questions.ts
  scoring/
    keyword-score.ts
    semantic-score.ts
  scanners/
    github.ts
    leetcode.ts

prisma/schema.prisma
proxy.ts                  ← auth gate (Next.js 16 middleware replacement)
auth.ts                   ← NextAuth instance (server-only, Prisma + bcrypt)
auth.config.ts            ← Edge-safe NextAuth config (no Node deps)
```

---

## Security

| Risk | Mitigation |
|---|---|
| SQL injection | Prisma parameterised queries everywhere |
| XSS | React JSX auto-escapes all user content |
| IDOR | Every API re-checks `userId` from session before touching a row |
| Password attacks | bcrypt 10 rounds; no account enumeration on failure |
| Session theft | JWT signed with `AUTH_SECRET`; no server-side session store |
| AI prompt injection | Clear prompt delimiters + strict Zod schema on all AI output |
| Soft-deleted data leaking | Prisma `$extends` filters `deletedAt: null` on every read |

---

## Built by

**Tisha** · [GitHub](https://github.com/Tisha-Coding) · [LinkedIn](https://www.linkedin.com/in/tisha-3835a8319) · [Portfolio](https://portfolio-six-rho-73.vercel.app)

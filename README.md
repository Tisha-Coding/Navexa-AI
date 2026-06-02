<div align="center">

<img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" />
<img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript" />
<img src="https://img.shields.io/badge/Groq-AI%20Powered-F55036?style=for-the-badge" />
<img src="https://img.shields.io/badge/Deployed-Vercel-black?style=for-the-badge&logo=vercel" />

<br /><br />

# Navexa AI

### AI-powered Resume × Job Description Matcher

**Stop guessing. Start matching.**  
Upload your resume, paste a JD — get a hybrid AI + keyword score, skill gap analysis, AI-rewritten bullets, a tailored cover letter, interview prep, and a full application pipeline. All in one place.

<br />

[**🚀 Live Demo**](https://navexa-ai.vercel.app) &nbsp;·&nbsp; [**📂 GitHub**](https://github.com/Tisha-Coding/Navexa-AI)

</div>

---

## The Problem

Most job seekers apply blindly. ATS systems reject **70%+ of resumes** before a human ever sees them — usually due to keyword mismatch, not lack of skill.

Navexa AI fixes this by:
- Showing **exactly** how well your resume matches a JD (not just a vague score)
- Pointing out **which skills are missing** and why they matter
- **Rewriting your bullets** to speak the JD's language
- Generating a **cover letter** that doesn't sound like a template
- Preparing you for the **actual interview questions** that role will ask

---

## Features

### Core AI Pipeline

| Feature | What it does |
|---|---|
| **Hybrid Match Score** | 40% keyword overlap + 60% AI semantic analysis = one honest score |
| **Skill Gap Analysis** | Exactly which skills the JD needs that your resume doesn't show |
| **AI Bullet Rewriter** | JD-aligned rewrites of your resume bullets — one-click copy |
| **Cover Letter Generator** | ≤220 words, no clichés, tailored to the specific JD |
| **Interview Prep** | 8 questions across technical / behavioural / JD-specific / gap, with answer outlines |

### Profile Enrichment

| Feature | What it does |
|---|---|
| **GitHub Scanner** | Pulls all public repos (sorted by stars), top languages, stargazers |
| **LeetCode Scanner** | Solved counts by difficulty, contest rating, language breakdown |

### Job Search Pipeline

| Feature | What it does |
|---|---|
| **Application Tracker** | Kanban board — drag cards across `Saved → Applied → Interview → Offer → Rejected` |
| **Admin Panel** | User activity, failed analysis monitoring, platform-wide stats |

---

## Tech Stack

```
Frontend    Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui
Backend     Next.js Route Handlers · Prisma 7 · PostgreSQL (Neon)
Auth        NextAuth.js v5 · JWT sessions · Role-based access (User / Admin)
AI          Vercel AI SDK · Groq (openai/gpt-oss-120b) · Zod structured outputs
Storage     Vercel Blob · unpdf (serverless PDF parsing)
Drag-drop   @dnd-kit/core (accessible, headless)
Deploy      Vercel (CI/CD on push to main)
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      Next.js App Router                      │
│                                                              │
│  Server Pages (RSC)    Client Components    Route Handlers   │
│  ─────────────────     ─────────────────    ───────────────  │
│  auth() + Prisma        forms, kanban        REST + JSON     │
│        │                      │                   │          │
└────────┼──────────────────────┼───────────────────┼──────────┘
         ▼                      ▼                   ▼
    ┌─────────┐          ┌────────────┐       ┌───────────┐
    │ lib/db  │          │  lib/ai/*  │       │lib/scoring│
    │ Prisma  │          │ Groq calls │       │keyword +  │
    │+soft-del│          │ + Zod      │       │semantic   │
    └────┬────┘          └─────┬──────┘       └─────┬─────┘
         ▼                     ▼                    ▼
    PostgreSQL             Groq API           (in-process)
     (Neon)            gpt-oss-120b
```

### Hybrid Score — How it works

```
         Final Match Score (0–100%)
                    │
         ┌──────────┴──────────┐
         │                     │
   Keyword Score (40%)   Semantic Score (60%)
         │                     │
   Deterministic:          Groq LLM:
   matched skills /        strengths, gaps,
   total JD skills         summary, score
   from 70+ word dict      enforced via Zod
```

The keyword layer is **fast and explainable** — the UI shows exactly which skills matched. The semantic layer is **opinionated** — the model is instructed to be a strict-but-fair recruiter, not a yes-man.

---

## Security

| Threat | Mitigation |
|---|---|
| SQL Injection | Prisma parameterised queries — no raw SQL |
| XSS | React JSX auto-escapes all output |
| IDOR | Every API re-checks `userId` from the JWT session, never the request body |
| Session theft | JWT signed with `AUTH_SECRET`, no server-side session store |
| Mass-assignment | Zod schemas allowlist exact fields — role injection impossible at signup |
| AI prompt injection | Clear delimiters + strict Zod schema on every AI output |
| Soft-deleted data leaks | Prisma `$extends` injects `deletedAt: null` on every read automatically |

---

## Getting Started

### Prerequisites

- Node 20+
- [Neon](https://neon.tech) PostgreSQL database (free tier works)
- [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) store
- [Groq](https://console.groq.com) API key

### Environment Variables

```bash
DATABASE_URL="postgresql://…?sslmode=require&channel_binding=require"
AUTH_SECRET="run: openssl rand -hex 32"
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_…"
GROQ_API_KEY="gsk_…"
```

### Run Locally

```bash
npm install
npx prisma db push     # sync schema to your Neon DB
npm run dev            # → http://localhost:3000
```

### Deploy to Vercel

1. Connect the GitHub repo to Vercel
2. Add the 4 env vars above in **Project → Settings → Environment Variables**
3. Push to `main` — Vercel runs `prisma generate && next build` automatically

### Create an Admin Account

Sign up normally, then run in your Neon SQL editor:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your@email.com';
```

Log out and log back in — the app redirects admins to `/admin` automatically.

---

## Testing a Failed Analysis

The admin panel tracks failed analyses in real time. To trigger one for demo/testing:

**Step 1** — Go to Vercel → **Settings → Environment Variables** → set `GROQ_API_KEY` to any invalid value (e.g. `gsk_invalid`)

**Step 2** — Go to **Deployments** → latest → **Redeploy** (env vars only apply after redeploy)

**Step 3** — Run any analysis in the app → it will fail

**Step 4** — Open **Admin Panel** → the failed analysis appears with the error reason

**Step 5** — Restore the real `GROQ_API_KEY` and redeploy to go back to normal

> This simulates a real-world scenario where an AI provider goes down or a key expires — exactly the kind of production failure the admin panel is designed to surface.

---

## Folder Structure

```
app/
  (auth)/login · signup     ← split-screen auth layout
  admin/                    ← admin panel (ADMIN role only)
  dashboard/                ← user home
  resumes/ · jobs/          ← CRUD pages
  analyses/ · analyses/[id] ← list + detail with all AI panels
  applications/             ← Kanban tracker
  api/…                     ← all route handlers

components/
  app-header.tsx            ← shared header with logout (all pages)
  app-background.tsx        ← mesh gradient + floating icons
  bullet-rewriter.tsx       ← AI bullet rewrites with copy
  cover-letter.tsx          ← cover letter panel
  interview-questions.tsx   ← interview prep panel
  github-scanner.tsx        ← GitHub profile panel
  leetcode-scanner.tsx      ← LeetCode profile panel

lib/
  db.ts                     ← Prisma + soft-delete extension
  extract-skills.ts         ← 70+ skill dictionary
  extract-profiles.ts       ← GitHub/LeetCode handle detection
  ai/ · scoring/ · scanners/
```

---

## Built by

**Tisha** · [GitHub](https://github.com/Tisha-Coding) · [LinkedIn](https://www.linkedin.com/in/tisha-3835a8319) · [Portfolio](https://portfolio-six-rho-73.vercel.app)

*Built as part of the House of Edtech — Fullstack Developer Assignment.*

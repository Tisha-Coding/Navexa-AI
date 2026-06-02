<div align="center">

# ✦ Navexa AI

### AI-Powered Resume × Job Description Matcher

<p>
  <img src="https://img.shields.io/badge/Next.js_16-App_Router-black?style=flat-square&logo=next.js" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Groq-AI_Powered-F55036?style=flat-square" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-00E699?style=flat-square&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Deployed-Vercel-black?style=flat-square&logo=vercel" />
</p>

**Stop guessing. Start matching.**

Upload your resume · Paste a JD · Get your score · Fix the gaps · Land the job.

<br />

[**🚀 Try it Live**](https://navexa-ai-git-main-tishas-projects-a05cea24.vercel.app/login)

</div>

---

## What is Navexa AI?

Most job seekers apply blindly. ATS systems reject **70%+ of resumes** before a human ever reads them — usually due to keyword mismatch, not lack of skill.

Navexa AI is a full-stack AI platform that puts the job seeker back in control:

- **Know your score** before you apply — hybrid AI + keyword match, not just a guess
- **See exactly what's missing** — skill gaps with context, not a vague "improve your resume"
- **Fix it instantly** — AI rewrites your bullets to match the JD's language
- **Apply with confidence** — tailored cover letter + interview prep in seconds
- **Track everything** — all your applications in one Kanban pipeline

---

## What Makes This Different?

| Other Resume Matchers | Navexa AI |
|---|---|
| Keyword-only scoring (easily gamed) | **Hybrid score** — 40% keyword + 60% AI semantic |
| Generic feedback | **JD-specific** bullet rewrites, cover letter, interview questions |
| Just a score | Full pipeline — from match score → apply → interview → offer |
| No profile validation | **GitHub + LeetCode scanner** to validate skills with real proof |
| No admin visibility | **Admin panel** with user analytics and failure monitoring |

---

## User Features

Everything a job seeker needs, in one flow:

### Match & Analyse
- Upload resume (PDF) → instant skill extraction
- Paste any JD → automatic required-skill detection
- Run analysis → **Hybrid Match Score** (0–100%) with breakdown
- See **matched skills** and **skill gaps** side-by-side

### AI Tools (per analysis)
- **Bullet Rewriter** — AI rewrites up to 8 resume bullets aligned to the JD, one-click copy
- **Cover Letter** — ≤220 words, no clichés, tailored to the role and company
- **Interview Prep** — 8 questions (technical / behavioural / JD-specific / gap) with answer outlines

### Profile Enrichment
- **GitHub Scanner** — public repos sorted by stars, top languages, contribution stats
- **LeetCode Scanner** — solved counts by difficulty, contest rating, language breakdown

### Application Tracker
- Kanban board — drag cards across `Saved → Applied → Interview → Offer → Rejected`
- Link applications to JDs and analyses for full context

---

## Admin Features

Admins get a dedicated panel at `/admin` (auto-redirected on login):

- **Platform stats** — total users, resumes, analyses, failed analyses
- **User table** — every user's name, email, resume count, analysis count, failed count, join date
- **Failed analyses log** — which user, which resume, which JD, exact error reason, timestamp

---

## Hybrid Score — How it Works

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
   from 70+ skill dict     enforced via Zod
```

The keyword layer is **fast and transparent** — you see exactly which skills matched. The semantic layer is **honest, not flattering** — the model is instructed to act as a strict-but-fair recruiter.

---

## Tech Stack

```
Framework     Next.js 16 (App Router, Turbopack)
Language      TypeScript (strict mode)
Styling       Tailwind CSS 4 + shadcn/ui + Lucide icons
Auth          NextAuth.js v5 — Credentials + JWT — Role-based (User / Admin)
Database      PostgreSQL on Neon (serverless)
ORM           Prisma 7 + soft-delete via $extends
AI            Vercel AI SDK + Groq (openai/gpt-oss-120b)
Storage       Vercel Blob (PDF storage)
PDF Parsing   unpdf (serverless-friendly, no worker issues)
Drag & Drop   @dnd-kit/core (accessible, headless)
Validation    Zod (API inputs + AI outputs)
Hashing       bcryptjs (10 rounds)
Deployment    Vercel (auto-deploy on push to main)
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js App Router                      │
│                                                             │
│   Server Pages       Client Components     Route Handlers  │
│   (RSC + auth())     (forms, kanban)        (REST + JSON)  │
│        │                   │                     │         │
└────────┼───────────────────┼─────────────────────┼─────────┘
         ▼                   ▼                     ▼
    ┌─────────┐        ┌──────────┐          ┌──────────┐
    │ Prisma  │        │ lib/ai/* │          │lib/score │
    │+softdel │        │Groq+Zod  │          │kw+semant │
    └────┬────┘        └─────┬────┘          └─────┬────┘
         ▼                   ▼                     ▼
    PostgreSQL           Groq API            in-process
     (Neon)           gpt-oss-120b
```

---

## Security

| Threat | How it's handled |
|---|---|
| SQL Injection | Prisma parameterised queries everywhere |
| XSS | React JSX auto-escapes all output |
| IDOR | Every API re-checks `userId` from JWT — never from request body |
| Session hijacking | JWT signed with `AUTH_SECRET`, no server-side session store |
| Role injection | Zod allowlists exact fields at signup — `role` cannot be set by client |
| AI prompt injection | Strict delimiters + Zod schema enforced on every AI output |
| Soft-delete leaks | Prisma `$extends` auto-injects `deletedAt: null` on every read |
| Password attacks | bcrypt 10 rounds + no account enumeration on failed login |

---

## Project Structure

```
navexa_ai/
├── app/
│   ├── (auth)/
│   │   ├── login/              ← login page (split-screen layout)
│   │   └── signup/             ← signup page
│   ├── admin/                  ← admin panel (ADMIN role only)
│   ├── dashboard/              ← user home with stats
│   ├── resumes/                ← resume list + upload
│   ├── jobs/                   ← job description list + add
│   ├── analyses/               ← analyses list
│   ├── analyses/[id]/          ← analysis detail (all AI panels)
│   ├── applications/           ← kanban tracker
│   ├── not-found.tsx           ← custom 404
│   └── api/
│       ├── auth/signup         ← email+password registration
│       ├── resumes/            ← list, delete
│       ├── resumes/upload      ← PDF → Blob → DB
│       ├── resumes/[id]/github-scan
│       ├── resumes/[id]/leetcode-scan
│       ├── jobs/               ← list, create, delete
│       ├── analyses/           ← list, create (hybrid score), delete
│       ├── analyses/[id]/rewrites
│       ├── analyses/[id]/cover-letter
│       ├── analyses/[id]/interview-questions
│       ├── applications/       ← kanban CRUD
│       └── admin/stats · admin/analyses/failed
│
├── components/
│   ├── app-header.tsx          ← shared header with logout (all pages)
│   ├── app-background.tsx      ← animated mesh background
│   ├── bullet-rewriter.tsx     ← AI bullet rewrites panel
│   ├── cover-letter.tsx        ← cover letter panel
│   ├── interview-questions.tsx ← interview prep panel
│   ├── github-scanner.tsx      ← GitHub profile panel
│   ├── leetcode-scanner.tsx    ← LeetCode profile panel
│   ├── providers.tsx           ← SessionProvider wrapper
│   └── ui/                     ← shadcn primitives
│
├── lib/
│   ├── db.ts                   ← Prisma client + soft-delete extension
│   ├── extract-skills.ts       ← 70+ skill keyword dictionary
│   ├── extract-bullets.ts      ← resume bullet detection
│   ├── extract-profiles.ts     ← GitHub/LeetCode handle detection
│   ├── admin.ts                ← requireAdmin() guard
│   ├── ai/
│   │   ├── rewrite-bullet.ts
│   │   ├── cover-letter.ts
│   │   └── interview-questions.ts
│   ├── scoring/
│   │   ├── keyword-score.ts
│   │   └── semantic-score.ts
│   └── scanners/
│       ├── github.ts
│       └── leetcode.ts
│
├── prisma/schema.prisma        ← DB schema (9 models)
├── auth.ts                     ← NextAuth instance (server-only)
├── auth.config.ts              ← Edge-safe NextAuth config
└── proxy.ts                    ← auth gate middleware
```

---

## Local Setup

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) PostgreSQL database — free tier is enough
- A [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) store
- A [Groq](https://console.groq.com) API key (free)

### Step 1 — Clone & Install

```bash
git clone https://github.com/Tisha-Coding/Navexa-AI.git
cd Navexa-AI/navexa_ai
npm install
```

### Step 2 — Environment Variables

Create a `.env` file in the `navexa_ai/` folder:

```bash
DATABASE_URL="postgresql://user:pass@host/neondb?sslmode=require&channel_binding=require"
AUTH_SECRET="generate with: openssl rand -hex 32"
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_…"
GROQ_API_KEY="gsk_…"
```

### Step 3 — Database Setup

```bash
npx prisma db push      # creates all tables in your Neon DB
```

### Step 4 — Run

```bash
npm run dev             # → http://localhost:3000
```

### Step 5 — Create Admin Account

Sign up through the app, then run in your Neon SQL editor:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your@email.com';
```

Log out and log back in — you'll be redirected to `/admin` automatically.

---

## Testing a Failed Analysis

The admin panel tracks failed analyses live. To trigger one for testing:

1. Vercel dashboard → **Settings → Environment Variables** → set `GROQ_API_KEY` to any fake value (e.g. `gsk_fake`)
2. **Deployments** → latest → **Redeploy** (env vars apply only after redeploy)
3. Run any analysis in the app → it fails
4. Open **Admin Panel** → failed analysis appears with the exact error reason
5. Restore the real key → Redeploy → back to normal

> This simulates a real production scenario where an AI provider goes down or an API key expires.

---

<div align="center">

Built with ❤️ by **Tisha**

[Portfolio](https://portfolio-six-rho-73.vercel.app) · [LinkedIn](https://www.linkedin.com/in/tisha-3835a8319) · [GitHub](https://github.com/Tisha-Coding)

*Fullstack Developer Assignment — House of Edtech*

</div>

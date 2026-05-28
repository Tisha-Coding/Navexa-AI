import {
  Sparkles,
  BarChart3,
  Target,
  FileText,
  Briefcase,
  TrendingUp,
  GraduationCap,
  Mail,
} from "lucide-react";

// Left-side branded panel for auth pages (signup + login).
// Mock resume card with a floating match score — gentle animations
// so the surface feels alive without distracting.
export function AuthBrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-gradient-to-br from-slate-900 via-violet-900 to-fuchsia-900 lg:flex lg:w-[45%] lg:flex-col lg:justify-between lg:p-12 lg:text-white">
      {/* Drifting blurs */}
      <div
        aria-hidden="true"
        className="nx-blur-drift pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-violet-500/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="nx-blur-drift pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-fuchsia-500/30 blur-3xl"
        style={{ animationDelay: "-4s" }}
      />
      <div
        aria-hidden="true"
        className="nx-pulse-soft pointer-events-none absolute right-1/3 top-1/2 h-40 w-40 rounded-full bg-indigo-400/20 blur-3xl"
      />

      {/* Faint grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      {/* Top — logo */}
      <div className="relative z-10 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20 backdrop-blur">
          <Sparkles className="nx-twinkle h-4 w-4 text-white" />
        </div>
        <span className="text-base font-semibold tracking-tight">Navexa AI</span>
      </div>

      {/* Middle — mock resume preview + heading */}
      <div className="relative z-10">
        <div className="relative mx-auto max-w-sm">
          {/* Floating match score badge */}
          <div className="nx-pulse-soft absolute -right-3 -top-4 z-20 flex items-center gap-1 rounded-full bg-emerald-400 px-3 py-1 text-xs font-semibold text-emerald-950 shadow-lg shadow-emerald-500/30">
            <TrendingUp className="h-3 w-3" />
            Match · 92%
          </div>

          {/* Second card tilted behind (depth) */}
          <div
            aria-hidden="true"
            className="nx-float-tilt absolute -left-3 top-3 -z-0 h-full w-full rounded-2xl bg-white/5 ring-1 ring-white/10"
          />

          {/* Main mock resume — gentle float */}
          <div className="nx-float relative z-10 overflow-hidden rounded-2xl bg-white/[0.08] p-6 shadow-xl ring-1 ring-white/15 backdrop-blur-xl">
            {/* Shimmer sweep */}
            <div
              aria-hidden="true"
              className="nx-shimmer pointer-events-none absolute inset-0 rounded-2xl"
            />

            {/* Header */}
            <div className="relative flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-300 to-fuchsia-300 text-sm font-bold text-violet-950 shadow-md">
                PS
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold leading-tight text-white">
                  Priya Sharma
                </div>
                <div className="text-[11px] text-violet-100/80">
                  Senior Full-Stack Engineer
                </div>
              </div>
              <Mail className="h-3.5 w-3.5 text-violet-200/70" />
            </div>

            <div className="my-4 h-px w-full bg-white/15" />

            {/* Experience section */}
            <div className="relative mb-2 flex items-center gap-1.5">
              <Briefcase className="h-3 w-3 text-violet-200" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-100/90">
                Experience
              </span>
            </div>
            <div className="relative mb-1 flex items-center justify-between pl-4 text-[11px]">
              <span className="font-medium text-white/90">Stripe · SF</span>
              <span className="text-white/50">2023 – Present</span>
            </div>
            <ul className="space-y-1 pl-4 text-[10px] leading-snug text-white/75">
              <li className="flex gap-1.5">
                <span className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-emerald-300" />
                Led Next.js migration, cut TTFB by 38%
              </li>
              <li className="flex gap-1.5">
                <span className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-emerald-300" />
                Built payments pipeline @ 10k tps
              </li>
              <li className="flex gap-1.5">
                <span className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-violet-300" />
                Mentored 4 engineers · 2 quarters
              </li>
            </ul>

            <div className="my-4 h-px w-full bg-white/15" />

            {/* Education (one-liner) */}
            <div className="relative mb-2 flex items-center gap-1.5">
              <GraduationCap className="h-3 w-3 text-violet-200" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-100/90">
                Education
              </span>
            </div>
            <div className="pl-4 text-[11px] text-white/80">
              B.Tech · Computer Science · IIIT
            </div>

            <div className="my-4 h-px w-full bg-white/15" />

            {/* Skills — matched (emerald) + gap (amber) */}
            <div className="relative mb-2 flex items-center gap-1.5">
              <Target className="h-3 w-3 text-emerald-300" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-100/90">
                Skills
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-medium text-emerald-200 ring-1 ring-emerald-300/30">
                React
              </span>
              <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-medium text-emerald-200 ring-1 ring-emerald-300/30">
                Node.js
              </span>
              <span className="rounded-full bg-violet-400/20 px-2 py-0.5 text-[10px] font-medium text-violet-200 ring-1 ring-violet-300/30">
                Next.js
              </span>
              <span className="rounded-full bg-violet-400/20 px-2 py-0.5 text-[10px] font-medium text-violet-200 ring-1 ring-violet-300/30">
                Prisma
              </span>
              <span className="nx-twinkle rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-medium text-amber-200 ring-1 ring-amber-300/30">
                +3 gaps
              </span>
            </div>
          </div>
        </div>

        <h2 className="mt-10 text-3xl font-semibold leading-tight tracking-tight">
          Land your next role <br /> with AI on your side.
        </h2>
        <p className="mt-3 max-w-md text-sm text-violet-100/80">
          Match your resume to any job description, find skill gaps,
          and get AI-rewritten bullets — all in one place.
        </p>
      </div>

      {/* Bottom — feature row */}
      <div className="relative z-10 grid grid-cols-2 gap-3 text-sm">
        <Feature icon={<BarChart3 className="h-4 w-4" />} text="Hybrid match score" />
        <Feature icon={<Target className="h-4 w-4" />} text="Skill gap recovery" />
        <Feature icon={<FileText className="h-4 w-4" />} text="AI bullet rewrites" />
        <Feature icon={<Briefcase className="h-4 w-4" />} text="Cover letters & Q&A" />
      </div>
    </aside>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-violet-100/90">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
        {icon}
      </span>
      <span>{text}</span>
    </div>
  );
}

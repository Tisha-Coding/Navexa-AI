import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Briefcase, BarChart3, ArrowUpRight, KanbanSquare } from "lucide-react";
import { AppBackground } from "@/components/app-background";
import { AppHeader } from "@/components/app-header";
import { Footer } from "@/components/footer";

export default async function DashboardPage() {
  // auth() only decodes the JWT cookie (no DB hit) — so the page shell
  // renders instantly. The slow DB counts are streamed in via <Suspense>.
  const session = await auth();
  const userId = session?.user?.id;

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-slate-50">
      <AppBackground />

      <AppHeader />

      {/* Content */}
      <section className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <div className="mb-8">
          <span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
            {session?.user?.role}
          </span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Welcome back, {session?.user?.name?.split(" ")[0] ?? "there"}.
          </h1>
          <p className="mt-2 max-w-xl text-slate-500">
            Upload a resume, paste a job description, and let AI score the match — with skill gaps, bullet rewrites, and more.
          </p>
        </div>

        {/* Stat cards stream in once the DB responds; skeletons show meanwhile. */}
        <Suspense fallback={<StatsSkeleton />}>
          <StatsGrid userId={userId} />
        </Suspense>
      </section>

      <Footer />
    </main>
  );
}

// Async server component — isolates the slow DB counts so they can stream
// independently of the page shell (Neon serverless can be slow to wake).
async function StatsGrid({ userId }: { userId?: string }) {
  const [resumeCount, jobCount, analysisCount, applicationCount] = userId
    ? await Promise.all([
        prisma.resume.count({ where: { userId } }),
        prisma.jobDescription.count({ where: { userId } }),
        prisma.analysis.count({ where: { userId } }),
        prisma.application.count({ where: { userId } }),
      ])
    : [0, 0, 0, 0];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        href="/resumes"
        icon={<FileText className="h-4 w-4" />}
        label="Resumes"
        value={String(resumeCount)}
        hint={resumeCount === 0 ? "Upload your first resume" : "Manage your resumes"}
      />
      <StatCard
        href="/jobs"
        icon={<Briefcase className="h-4 w-4" />}
        label="Job descriptions"
        value={String(jobCount)}
        hint="Add a JD to analyse"
      />
      <StatCard
        href="/analyses"
        icon={<BarChart3 className="h-4 w-4" />}
        label="Analyses"
        value={String(analysisCount)}
        hint="Match resumes ↔ JDs"
      />
      <StatCard
        href="/applications"
        icon={<KanbanSquare className="h-4 w-4" />}
        label="Applications"
        value={String(applicationCount)}
        hint="Kanban tracker"
      />
    </div>
  );
}

// Skeleton placeholders — same outer dimensions as StatCard so the layout
// doesn't shift when real data swaps in.
function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl bg-white/80 p-5 shadow-sm shadow-slate-900/[0.04] ring-1 ring-slate-200/70 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 animate-pulse rounded bg-slate-200/80" />
            <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-200/80" />
          </div>
          <div className="mt-3 h-8 w-12 animate-pulse rounded bg-slate-200/80" />
          <div className="mt-2 h-3 w-28 animate-pulse rounded bg-slate-200/70" />
        </div>
      ))}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl bg-white/80 p-5 shadow-sm shadow-slate-900/[0.04] ring-1 ring-slate-200/70 backdrop-blur-xl transition hover:shadow-md hover:ring-slate-300"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-700 ring-1 ring-violet-100">
          {icon}
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-tight text-slate-900">{value}</span>
        <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-violet-600" />
      </div>
      <div className="mt-1 text-xs text-slate-500">{hint}</div>
    </Link>
  );
}

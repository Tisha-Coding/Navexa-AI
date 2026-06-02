import { Suspense } from "react";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { Sparkles, LogOut, Users, FileText, BarChart3, AlertTriangle, Calendar } from "lucide-react";
import { AppBackground } from "@/components/app-background";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Admin — Navexa AI" };

export default async function AdminPage() {
  const session = await auth();

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-slate-50">
      <AppBackground />

      {/* Header */}
      <header className="relative z-10 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 shadow-sm">
              <Sparkles className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <span className="text-base font-semibold tracking-tight text-slate-900">Navexa AI</span>
            <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-violet-700">
              ADMIN
            </span>
          </div>

          <div className="flex items-center gap-3">
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white/70 hover:bg-white"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Logout
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Admin Panel
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Logged in as <span className="font-medium text-slate-700">{session?.user?.email}</span>
          </p>
        </div>

        {/* Stats — streams in independently */}
        <Suspense fallback={<StatsSkeleton />}>
          <StatsGrid />
        </Suspense>

        {/* Users table */}
        <Suspense fallback={<TableSkeleton />}>
          <UsersTable />
        </Suspense>

        {/* Failed analyses */}
        <div className="mt-10">
          <Suspense fallback={<TableSkeleton />}>
            <FailedAnalysesTable />
          </Suspense>
        </div>
      </section>

      <Footer />
    </main>
  );
}

// ─── Stats ───────────────────────────────────────────────────────────────────

async function StatsGrid() {
  const [totalUsers, totalResumes, totalAnalyses, failedAnalyses] =
    await Promise.all([
      prisma.user.count({ where: { role: "JOB_SEEKER" } }),
      prisma.resume.count(),
      prisma.analysis.count(),
      prisma.analysis.count({ where: { status: "FAILED" } }),
    ]);

  const cards = [
    { label: "Total Users",     value: totalUsers,     icon: <Users className="h-4 w-4" />,        accent: "violet" },
    { label: "Total Resumes",   value: totalResumes,   icon: <FileText className="h-4 w-4" />,      accent: "violet" },
    { label: "Total Analyses",  value: totalAnalyses,  icon: <BarChart3 className="h-4 w-4" />,     accent: "violet" },
    { label: "Failed Analyses", value: failedAnalyses, icon: <AlertTriangle className="h-4 w-4" />, accent: failedAnalyses > 0 ? "red" : "violet" },
  ] as const;

  return (
    <div
      className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      role="region"
      aria-label="Overview statistics"
    >
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl bg-white/80 p-5 shadow-sm shadow-slate-900/[0.04] ring-1 ring-slate-200/70 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">{card.label}</span>
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-lg ring-1 ${
                card.accent === "red"
                  ? "bg-red-50 text-red-600 ring-red-100"
                  : "bg-violet-50 text-violet-700 ring-violet-100"
              }`}
            >
              {card.icon}
            </span>
          </div>
          <p
            className={`mt-3 text-3xl font-semibold tracking-tight ${
              card.accent === "red" && card.value > 0 ? "text-red-600" : "text-slate-900"
            }`}
          >
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Users Table ─────────────────────────────────────────────────────────────

async function UsersTable() {
  const users = await prisma.user.findMany({
    where: { role: "JOB_SEEKER" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      _count: {
        select: { resumes: true, analyses: true },
      },
    },
  });

  const failedCounts = await prisma.analysis.groupBy({
    by: ["userId"],
    where: { status: "FAILED" },
    _count: { _all: true },
  });
  const failedMap = new Map(failedCounts.map((f) => [f.userId, f._count._all]));

  return (
    <section aria-labelledby="users-heading">
      <div className="mb-4 flex items-center gap-2">
        <Users className="h-4 w-4 text-violet-600" />
        <h2 id="users-heading" className="text-lg font-semibold tracking-tight text-slate-900">
          All Users
        </h2>
        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
          {users.length}
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white/80 shadow-sm shadow-slate-900/[0.04] ring-1 ring-slate-200/70 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="All users">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {["User", "Resumes", "Analyses", "Failed", "Joined"].map((h) => (
                  <th key={h} scope="col" className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="transition hover:bg-slate-50/60">
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-900">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-700">{u._count.resumes}</td>
                  <td className="px-5 py-4 text-slate-700">{u._count.analyses}</td>
                  <td className="px-5 py-4">
                    {(failedMap.get(u.id) ?? 0) > 0 ? (
                      <span className="font-medium text-red-600">{failedMap.get(u.id)}</span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(u.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ─── Failed Analyses Table ────────────────────────────────────────────────────

async function FailedAnalysesTable() {
  const failed = await prisma.analysis.findMany({
    where: { status: "FAILED" },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      failedReason: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
      resume: { select: { title: true } },
      jobDescription: { select: { title: true, company: true } },
    },
  });

  return (
    <section aria-labelledby="failed-heading">
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-red-500" aria-hidden="true" />
        <h2
          id="failed-heading"
          className="text-lg font-semibold tracking-tight text-slate-900"
        >
          Failed Analyses
        </h2>
        {failed.length > 0 && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
            {failed.length}
          </span>
        )}
      </div>

      {failed.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white/70 py-16 ring-1 ring-slate-200/70 backdrop-blur-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <BarChart3 className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-700">No failed analyses</p>
          <p className="mt-1 text-xs text-slate-500">All analyses have completed successfully.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white/80 shadow-sm shadow-slate-900/[0.04] ring-1 ring-slate-200/70 backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Failed analyses list">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    User
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Resume
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Job
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Reason
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {failed.map((a) => (
                  <tr key={a.id} className="transition hover:bg-slate-50/60">
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">{a.user.name}</p>
                      <p className="text-xs text-slate-500">{a.user.email}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {a.resume?.title ?? <span className="text-slate-400 italic">deleted</span>}
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      <p>{a.jobDescription?.title ?? <span className="text-slate-400 italic">deleted</span>}</p>
                      {a.jobDescription?.company && (
                        <p className="text-xs text-slate-500">{a.jobDescription.company}</p>
                      )}
                    </td>
                    <td className="max-w-xs px-5 py-4">
                      {a.failedReason ? (
                        <span
                          title={a.failedReason}
                          className="line-clamp-2 rounded bg-red-50 px-2 py-1 text-xs text-red-700 ring-1 ring-red-100"
                        >
                          {a.failedReason}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No reason recorded</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                      {new Date(a.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function StatsSkeleton() {
  return (
    <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true" aria-label="Loading statistics">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white/80 p-5 ring-1 ring-slate-200/70">
          <div className="flex items-center justify-between">
            <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
            <div className="h-7 w-7 animate-pulse rounded-lg bg-slate-200" />
          </div>
          <div className="mt-3 h-8 w-10 animate-pulse rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading failed analyses">
      <div className="mb-4 h-6 w-40 animate-pulse rounded bg-slate-200" />
      <div className="overflow-hidden rounded-2xl bg-white/80 ring-1 ring-slate-200/70">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-6 border-b border-slate-100 px-5 py-4 last:border-0">
            <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

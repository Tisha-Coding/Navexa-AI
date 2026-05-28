import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { Sparkles, LogOut, FileText, Briefcase, BarChart3, ArrowUpRight } from "lucide-react";
import { AppBackground } from "@/components/app-background";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50">
      <AppBackground />

      {/* Top nav */}
      <header className="relative z-10 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 shadow-sm">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-semibold tracking-tight text-slate-900">Navexa AI</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium text-slate-900">{session?.user?.name}</div>
              <div className="text-xs text-slate-500">{session?.user?.email}</div>
            </div>
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
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-10">
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard icon={<FileText className="h-4 w-4" />} label="Resumes" value="0" hint="Upload your first resume" />
          <StatCard icon={<Briefcase className="h-4 w-4" />} label="Job descriptions" value="0" hint="Add a JD to analyse" />
          <StatCard icon={<BarChart3 className="h-4 w-4" />} label="Analyses" value="0" hint="Match resumes ↔ JDs" />
        </div>

        <p className="mt-10 text-center text-xs text-slate-400">
          CRUD pages and the analysis flow come next — this is the auth landing.
        </p>
      </section>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="group rounded-2xl bg-white/80 p-5 shadow-sm shadow-slate-900/[0.04] ring-1 ring-slate-200/70 backdrop-blur-xl transition hover:shadow-md hover:ring-slate-300">
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
    </div>
  );
}

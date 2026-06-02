import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  ArrowLeft,
  Briefcase,
  FileText,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Target,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppBackground } from "@/components/app-background";
import { Footer } from "@/components/footer";
import { BulletRewriter } from "@/components/bullet-rewriter";
import { CoverLetterPanel } from "@/components/cover-letter";
import { InterviewQuestionsPanel } from "@/components/interview-questions";
import { GithubScannerPanel } from "@/components/github-scanner";
import { LeetcodeScannerPanel } from "@/components/leetcode-scanner";
import { AppHeader } from "@/components/app-header";

export default async function AnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) notFound();

  const analysis = await prisma.analysis.findFirst({
    where: { id, userId: session.user.id },
    include: {
      resume: { select: { id: true, title: true, fileUrl: true } },
      jobDescription: { select: { id: true, title: true, company: true } },
    },
  });

  if (!analysis) notFound();

  const isCompleted = analysis.status === "COMPLETED";
  const isFailed = analysis.status === "FAILED";
  const date = new Date(analysis.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const scoreColor =
    analysis.matchScore >= 75
      ? "text-emerald-600"
      : analysis.matchScore >= 50
      ? "text-amber-600"
      : "text-red-600";
  const scoreGradient =
    analysis.matchScore >= 75
      ? "from-emerald-500 to-emerald-600"
      : analysis.matchScore >= 50
      ? "from-amber-500 to-amber-600"
      : "from-red-500 to-red-600";

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50">
      <AppBackground />

      <AppHeader backHref="/analyses" backLabel="All analyses" maxWidth="max-w-5xl" />

      <section className="relative z-10 mx-auto max-w-5xl px-6 py-10">
        {/* Header card — JD + resume context */}
        <div className="mb-6 rounded-2xl bg-white/85 p-6 shadow-sm shadow-slate-900/[0.04] ring-1 ring-slate-200/70 backdrop-blur-xl">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar className="h-3 w-3" />
            {date}
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {analysis.jobDescription.title}
          </h1>
          {analysis.jobDescription.company && (
            <p className="text-sm text-slate-500">{analysis.jobDescription.company}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1">
              <Briefcase className="h-3.5 w-3.5 text-slate-500" />
              <span className="font-medium">JD</span>
            </div>
            <span className="text-slate-300">×</span>
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1 text-violet-700 ring-1 ring-violet-100">
              <FileText className="h-3.5 w-3.5" />
              <span className="font-medium">{analysis.resume.title}</span>
            </div>
          </div>
        </div>

        {isFailed && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-5 w-5" />
              Analysis failed
            </div>
            <p className="mt-2 text-sm">
              The AI scoring step errored out. Delete this analysis and run a fresh one — usually it&apos;s a transient API issue.
            </p>
          </div>
        )}

        {isCompleted && (
          <>
            {/* Hero score */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className={`overflow-hidden rounded-2xl bg-gradient-to-br ${scoreGradient} p-6 text-white shadow-lg md:col-span-1`}>
                <div className="text-xs font-medium uppercase tracking-wider text-white/70">Hybrid match</div>
                <div className="mt-1 text-6xl font-semibold">{analysis.matchScore}%</div>
                <div className="mt-1 inline-flex items-center gap-1 text-xs text-white/80">
                  <TrendingUp className="h-3 w-3" />
                  40% keyword · 60% AI
                </div>
              </div>

              <ScoreBar label="Keyword match" value={analysis.keywordScore} hint="Skills directly named in your resume" />
              <ScoreBar label="AI semantic" value={analysis.semanticScore} hint="Paraphrases, scope, seniority" accent />
            </div>

            {/* Summary */}
            {analysis.summary && (
              <div className="mt-6 rounded-2xl bg-white/85 p-6 shadow-sm shadow-slate-900/[0.04] ring-1 ring-slate-200/70 backdrop-blur-xl">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Sparkles className="h-4 w-4 text-violet-600" />
                  Hiring-manager summary
                </div>
                <p className={`mt-3 text-sm leading-relaxed text-slate-700 ${scoreColor}`}>{analysis.summary}</p>
              </div>
            )}

            {/* Matched + missing */}
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <SkillPanel
                title="Matched skills"
                count={analysis.matchedSkills.length}
                icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                skills={analysis.matchedSkills}
                tone="emerald"
                emptyText="No direct skill keyword matches — rely on the AI semantic score."
              />
              <SkillPanel
                title="Gaps to address"
                count={analysis.missingSkills.length}
                icon={<Target className="h-4 w-4 text-amber-600" />}
                skills={analysis.missingSkills}
                tone="amber"
                emptyText="No major gaps detected. 🎉"
              />
            </div>

            {/* Bullet rewriter — AI rewrites resume bullets aligned to this JD */}
            <BulletRewriter analysisId={analysis.id} />

            {/* Cover letter — JD-tailored, editable */}
            <CoverLetterPanel analysisId={analysis.id} />

            {/* Interview prep — categorized + difficulty + answer outlines */}
            <InterviewQuestionsPanel analysisId={analysis.id} />

            {/* GitHub scanner — validate skills via public repos */}
            <GithubScannerPanel resumeId={analysis.resume.id} />

            {/* LeetCode scanner — DSA proof via solved problems & contests */}
            <LeetcodeScannerPanel resumeId={analysis.resume.id} />
          </>
        )}
      </section>

      <Footer />
    </main>
  );
}

function ScoreBar({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: number;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white/85 p-5 shadow-sm shadow-slate-900/[0.04] ring-1 ring-slate-200/70 backdrop-blur-xl">
      <div className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 flex items-baseline justify-between">
        <span className="text-3xl font-semibold text-slate-900">{value}%</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${accent ? "bg-violet-500" : "bg-slate-700"}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

function SkillPanel({
  title,
  count,
  icon,
  skills,
  tone,
  emptyText,
}: {
  title: string;
  count: number;
  icon: React.ReactNode;
  skills: string[];
  tone: "emerald" | "amber";
  emptyText: string;
}) {
  const chip =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : "bg-amber-50 text-amber-700 ring-amber-100";

  return (
    <div className="rounded-2xl bg-white/85 p-5 shadow-sm shadow-slate-900/[0.04] ring-1 ring-slate-200/70 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          {icon}
          {title}
        </div>
        <span className="text-xs font-medium text-slate-500">{count}</span>
      </div>
      {skills.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">{emptyText}</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <span
              key={s}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${chip}`}
            >
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

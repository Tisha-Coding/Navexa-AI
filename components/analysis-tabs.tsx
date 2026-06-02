"use client";

import { useState } from "react";
import {
  BarChart3,
  Sparkles,
  CheckCircle2,
  Target,
  TrendingUp,
  Wand2,
  User,
} from "lucide-react";
import { BulletRewriter } from "./bullet-rewriter";
import { CoverLetterPanel } from "./cover-letter";
import { InterviewQuestionsPanel } from "./interview-questions";
import { GithubScannerPanel } from "./github-scanner";
import { LeetcodeScannerPanel } from "./leetcode-scanner";

type Tab = "overview" | "ai-tools" | "profile";

type Props = {
  analysisId: string;
  resumeId: string;
  matchScore: number;
  keywordScore: number;
  semanticScore: number;
  summary: string;
  matchedSkills: string[];
  missingSkills: string[];
};

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview",  label: "Overview",  icon: <BarChart3 className="h-4 w-4" /> },
  { id: "ai-tools",  label: "AI Tools",  icon: <Wand2 className="h-4 w-4" /> },
  { id: "profile",   label: "Profile",   icon: <User className="h-4 w-4" /> },
];

export function AnalysisTabs({
  analysisId,
  resumeId,
  matchScore,
  keywordScore,
  semanticScore,
  summary,
  matchedSkills,
  missingSkills,
}: Props) {
  const [active, setActive] = useState<Tab>("overview");

  const scoreGradient =
    matchScore >= 75
      ? "from-emerald-500 to-emerald-600"
      : matchScore >= 50
      ? "from-amber-500 to-amber-600"
      : "from-red-500 to-red-600";

  const scoreColor =
    matchScore >= 75
      ? "text-emerald-600"
      : matchScore >= 50
      ? "text-amber-600"
      : "text-red-600";

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-6 flex gap-1 rounded-xl bg-white/70 p-1 shadow-sm ring-1 ring-slate-200/70 backdrop-blur-xl">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              active === tab.id
                ? "bg-violet-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {active === "overview" && (
        <div className="space-y-6">
          {/* Score cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className={`overflow-hidden rounded-2xl bg-gradient-to-br ${scoreGradient} p-6 text-white shadow-lg md:col-span-1`}>
              <div className="text-xs font-medium uppercase tracking-wider text-white/70">Hybrid match</div>
              <div className="mt-1 text-6xl font-semibold">{matchScore}%</div>
              <div className="mt-1 inline-flex items-center gap-1 text-xs text-white/80">
                <TrendingUp className="h-3 w-3" />
                40% keyword · 60% AI
              </div>
            </div>
            <ScoreBar label="Keyword match" value={keywordScore} hint="Skills directly named in your resume" />
            <ScoreBar label="AI semantic" value={semanticScore} hint="Paraphrases, scope, seniority" accent />
          </div>

          {/* Summary */}
          {summary && (
            <div className="rounded-2xl bg-white/85 p-6 shadow-sm shadow-slate-900/[0.04] ring-1 ring-slate-200/70 backdrop-blur-xl">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Sparkles className="h-4 w-4 text-violet-600" />
                Hiring-manager summary
              </div>
              <p className={`mt-3 text-sm leading-relaxed ${scoreColor}`}>{summary}</p>
            </div>
          )}

          {/* Skills */}
          <div className="grid gap-4 md:grid-cols-2">
            <SkillPanel
              title="Matched skills"
              count={matchedSkills.length}
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              skills={matchedSkills}
              tone="emerald"
              emptyText="No direct skill keyword matches — rely on the AI semantic score."
            />
            <SkillPanel
              title="Gaps to address"
              count={missingSkills.length}
              icon={<Target className="h-4 w-4 text-amber-600" />}
              skills={missingSkills}
              tone="amber"
              emptyText="No major gaps detected."
            />
          </div>
        </div>
      )}

      {/* AI Tools tab */}
      {active === "ai-tools" && (
        <div>
          <BulletRewriter analysisId={analysisId} />
          <CoverLetterPanel analysisId={analysisId} />
          <InterviewQuestionsPanel analysisId={analysisId} />
        </div>
      )}

      {/* Profile tab */}
      {active === "profile" && (
        <div>
          <GithubScannerPanel resumeId={resumeId} />
          <LeetcodeScannerPanel resumeId={resumeId} />
        </div>
      )}
    </div>
  );
}

function ScoreBar({ label, value, hint, accent }: { label: string; value: number; hint: string; accent?: boolean }) {
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

function SkillPanel({ title, count, icon, skills, tone, emptyText }: {
  title: string; count: number; icon: React.ReactNode; skills: string[]; tone: "emerald" | "amber"; emptyText: string;
}) {
  const chip = tone === "emerald"
    ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
    : "bg-amber-50 text-amber-700 ring-amber-100";

  return (
    <div className="rounded-2xl bg-white/85 p-5 shadow-sm shadow-slate-900/[0.04] ring-1 ring-slate-200/70 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">{icon}{title}</div>
        <span className="text-xs font-medium text-slate-500">{count}</span>
      </div>
      {skills.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">{emptyText}</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <span key={s} className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${chip}`}>{s}</span>
          ))}
        </div>
      )}
    </div>
  );
}

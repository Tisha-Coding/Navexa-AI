"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  MessageSquare,
  ChevronDown,
  Code2,
  Users,
  Briefcase,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Category = "technical" | "behavioral" | "jd-specific" | "gap";
type Difficulty = "easy" | "medium" | "hard";

type Question = {
  question: string;
  category: Category;
  difficulty: Difficulty;
  whyAsked: string;
  answerOutline: string[];
};

type InterviewSet = { questions: Question[] };

const CATEGORY_META: Record<
  Category,
  { label: string; icon: React.ReactNode; tone: string }
> = {
  technical: {
    label: "Technical",
    icon: <Code2 className="h-3 w-3" />,
    tone: "bg-blue-50 text-blue-700 ring-blue-100",
  },
  behavioral: {
    label: "Behavioral",
    icon: <Users className="h-3 w-3" />,
    tone: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  },
  "jd-specific": {
    label: "JD-specific",
    icon: <Briefcase className="h-3 w-3" />,
    tone: "bg-violet-50 text-violet-700 ring-violet-100",
  },
  gap: {
    label: "Gap-focused",
    icon: <Target className="h-3 w-3" />,
    tone: "bg-amber-50 text-amber-700 ring-amber-100",
  },
};

const DIFFICULTY_DOT: Record<Difficulty, string> = {
  easy: "bg-emerald-500",
  medium: "bg-amber-500",
  hard: "bg-red-500",
};

export function InterviewQuestionsPanel({ analysisId }: { analysisId: string }) {
  const [set, setSet] = useState<InterviewSet | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Category | "all">("all");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/analyses/${analysisId}/interview-questions`);
      const data = await res.json();
      setSet(data.interviewQuestions ?? null);
    } catch {
      setError("Failed to load interview questions");
    } finally {
      setLoading(false);
    }
  }, [analysisId]);

  useEffect(() => {
    load();
  }, [load]);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/analyses/${analysisId}/interview-questions`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to generate questions");
        return;
      }
      setSet(data.interviewQuestions);
      setOpenIndex(0);
    } catch {
      setError("Network error");
    } finally {
      setGenerating(false);
    }
  }

  const filteredQuestions = set
    ? filter === "all"
      ? set.questions
      : set.questions.filter((q) => q.category === filter)
    : [];

  return (
    <div className="mt-6 rounded-2xl bg-white/85 p-6 shadow-sm shadow-slate-900/[0.04] ring-1 ring-slate-200/70 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <MessageSquare className="h-4 w-4 text-violet-600" />
            Interview prep questions
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Tailored mock interview — technical, behavioral, JD-specific, and gap-focused.
          </p>
        </div>
        {set && (
          <Button
            onClick={generate}
            disabled={generating}
            size="sm"
            className="h-9 gap-1.5 rounded-md bg-violet-600 px-3 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-80"
          >
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Re-run
          </Button>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
        </div>
      ) : !set ? (
        <div className="mt-5 flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
          <Sparkles className="h-6 w-6 text-slate-300" />
          <div>
            <p className="text-sm font-medium text-slate-700">No questions yet</p>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              Generate a first-round question set based on this resume + JD pairing.
            </p>
          </div>
          <Button
            onClick={generate}
            disabled={generating}
            size="sm"
            className="mt-1 h-9 gap-1.5 rounded-md bg-violet-600 px-3 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-80"
          >
            {generating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" /> Generate questions
              </>
            )}
          </Button>
        </div>
      ) : (
        <>
          {/* Category filter chips */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            <FilterChip
              label={`All · ${set.questions.length}`}
              active={filter === "all"}
              onClick={() => setFilter("all")}
            />
            {(Object.keys(CATEGORY_META) as Category[]).map((c) => {
              const count = set.questions.filter((q) => q.category === c).length;
              if (count === 0) return null;
              return (
                <FilterChip
                  key={c}
                  label={`${CATEGORY_META[c].label} · ${count}`}
                  icon={CATEGORY_META[c].icon}
                  active={filter === c}
                  onClick={() => setFilter(c)}
                />
              );
            })}
          </div>

          {/* Questions list */}
          <ul className="mt-4 space-y-3">
            {filteredQuestions.map((q, idx) => {
              const open = openIndex === idx;
              const meta = CATEGORY_META[q.category];
              return (
                <li
                  key={`${q.category}-${idx}`}
                  className="rounded-xl border border-slate-200 bg-white transition hover:border-slate-300"
                >
                  <button
                    onClick={() => setOpenIndex(open ? null : idx)}
                    className="flex w-full items-start gap-3 p-4 text-left"
                  >
                    <span className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${DIFFICULTY_DOT[q.difficulty]}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${meta.tone}`}
                        >
                          {meta.icon}
                          {meta.label}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400">
                          {q.difficulty}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-slate-900">{q.question}</p>
                    </div>
                    <ChevronDown
                      className={`mt-2 h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
                    />
                  </button>
                  {open && (
                    <div className="border-t border-slate-100 px-4 py-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Why they ask
                      </div>
                      <p className="mt-1 text-xs italic text-slate-600">{q.whyAsked}</p>

                      <div className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-violet-700">
                        Answer outline
                      </div>
                      <ul className="mt-1.5 space-y-1.5">
                        {q.answerOutline.map((bullet, i) => (
                          <li key={i} className="flex gap-2 text-sm text-slate-700">
                            <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-violet-400" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function FilterChip({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon?: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition ${
        active
          ? "bg-violet-600 text-white"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

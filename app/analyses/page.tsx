"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowLeft,
  Plus,
  BarChart3,
  Trash2,
  Loader2,
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  FileText,
  Briefcase,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppBackground } from "@/components/app-background";
import { AppHeader } from "@/components/app-header";
import { Footer } from "@/components/footer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Analysis = {
  id: string;
  matchScore: number;
  keywordScore: number;
  semanticScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  summary: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  createdAt: string;
  resume: { id: string; title: string };
  jobDescription: { id: string; title: string; company: string | null };
};

type Picker = { id: string; title: string; company?: string | null };
type ToastType = "success" | "error" | "warning";

export default function AnalysesPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [runOpen, setRunOpen] = useState(false);
  const [toast, setToast] = useState<{ type: ToastType; text: string } | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = useCallback((type: ToastType, text: string) => setToast({ type, text }), []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const loadAnalyses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analyses");
      const data = await res.json();
      setAnalyses(data.analyses ?? []);
    } catch {
      showToast("error", "Failed to load analyses");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAnalyses();
  }, [loadAnalyses]);

  function handleDelete(id: string) {
    setPendingDeleteId(id);
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/analyses?id=${pendingDeleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setAnalyses((prev) => prev.filter((a) => a.id !== pendingDeleteId));
      showToast("success", "Analysis deleted");
    } catch {
      showToast("error", "Failed to delete");
    } finally {
      setDeleting(false);
      setPendingDeleteId(null);
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-slate-50">
      <AppBackground />

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur-xl ${
              toast.type === "success"
                ? "border-emerald-200 bg-white/95 text-emerald-700"
                : toast.type === "warning"
                ? "border-amber-200 bg-white/95 text-amber-700"
                : "border-red-200 bg-white/95 text-red-700"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            )}
            <span className="font-medium">{toast.text}</span>
          </div>
        </div>
      )}

      <AppHeader backHref="/dashboard" />

      <section className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Match analyses</h1>
            <p className="mt-1 text-sm text-slate-500">
              Score your resume against any JD — hybrid AI + keyword model.
            </p>
          </div>
          <Button
            onClick={() => setRunOpen(true)}
            className="h-10 gap-1.5 rounded-lg bg-violet-600 px-4 font-medium text-white shadow-sm hover:bg-violet-700"
          >
            <Plus className="h-4 w-4" />
            Run new analysis
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded-2xl bg-white/70 py-20 ring-1 ring-slate-200/70">
            <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
          </div>
        ) : analyses.length === 0 ? (
          <EmptyState onAdd={() => setRunOpen(true)} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {analyses.map((a) => (
              <AnalysisCard key={a.id} analysis={a} onDelete={() => handleDelete(a.id)} />
            ))}
          </div>
        )}
      </section>

      {runOpen && (
        <RunAnalysisModal
          onClose={() => setRunOpen(false)}
          onSuccess={(id) => {
            setRunOpen(false);
            loadAnalyses();
            showToast("success", "Analysis ready");
            window.location.assign(`/analyses/${id}`);
          }}
          onFailed={(id) => {
            setRunOpen(false);
            loadAnalyses();
            showToast("error", "Analysis failed — check the detail page for the reason");
            window.location.assign(`/analyses/${id}`);
          }}
          onError={(msg) => showToast("error", msg)}
        />
      )}

      <ConfirmDialog
        open={!!pendingDeleteId}
        title="Delete this analysis?"
        description="This action can be undone by an admin."
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />

      <Footer />
    </main>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-white/70 py-20 ring-1 ring-slate-200/70 backdrop-blur-xl">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 ring-1 ring-violet-100">
        <BarChart3 className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">No analyses yet</h3>
      <p className="mt-1 max-w-sm text-center text-sm text-slate-500">
        Pick a resume and a job description to see your match score, gaps, and AI insights.
      </p>
      <Button onClick={onAdd} className="mt-5 gap-1.5 rounded-lg bg-violet-600 px-4 font-medium text-white hover:bg-violet-700">
        <Plus className="h-4 w-4" />
        Run your first analysis
      </Button>
    </div>
  );
}

function AnalysisCard({ analysis, onDelete }: { analysis: Analysis; onDelete: () => void }) {
  const date = new Date(analysis.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const isFailed = analysis.status === "FAILED";

  const scoreColor =
    analysis.matchScore >= 75
      ? "text-emerald-600"
      : analysis.matchScore >= 50
      ? "text-amber-600"
      : "text-red-600";
  const scoreBg =
    analysis.matchScore >= 75
      ? "bg-emerald-50 ring-emerald-100"
      : analysis.matchScore >= 50
      ? "bg-amber-50 ring-amber-100"
      : "bg-red-50 ring-red-100";

  return (
    <div className="group relative flex flex-col gap-3 rounded-2xl bg-white/85 p-5 shadow-sm shadow-slate-900/[0.04] ring-1 ring-slate-200/70 backdrop-blur-xl transition hover:shadow-md hover:ring-violet-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Briefcase className="h-3 w-3" />
            <span className="line-clamp-1">
              {analysis.jobDescription.title}
              {analysis.jobDescription.company && ` · ${analysis.jobDescription.company}`}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
            <FileText className="h-3 w-3" />
            <span className="line-clamp-1">{analysis.resume.title}</span>
          </div>
        </div>
        <button
          onClick={onDelete}
          className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
          aria-label="Delete analysis"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {isFailed ? (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-100">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Analysis failed — please retry
        </div>
      ) : (
        <div className={`flex items-center justify-between rounded-xl px-4 py-3 ring-1 ${scoreBg}`}>
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-slate-600">Match</div>
            <div className={`text-3xl font-semibold ${scoreColor}`}>{analysis.matchScore}%</div>
          </div>
          <div className="text-right text-[10px] text-slate-500">
            <div>KW {analysis.keywordScore}%</div>
            <div>AI {analysis.semanticScore}%</div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Calendar className="h-3 w-3" />
          {date}
        </div>
        <Link
          href={`/analyses/${analysis.id}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-violet-700 hover:text-violet-800"
        >
          View <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

function RunAnalysisModal({
  onClose,
  onSuccess,
  onFailed,
  onError,
}: {
  onClose: () => void;
  onSuccess: (id: string) => void;
  onFailed: (id: string) => void;
  onError: (msg: string) => void;
}) {
  const [resumes, setResumes] = useState<Picker[]>([]);
  const [jobs, setJobs] = useState<Picker[]>([]);
  const [resumeId, setResumeId] = useState("");
  const [jobId, setJobId] = useState("");
  const [loadingPickers, setLoadingPickers] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [rRes, jRes] = await Promise.all([
          fetch("/api/resumes").then((r) => r.json()),
          fetch("/api/jobs").then((r) => r.json()),
        ]);
        setResumes(rRes.resumes ?? []);
        setJobs(jRes.jobs ?? []);
      } catch {
        onError("Failed to load resumes & JDs");
      } finally {
        setLoadingPickers(false);
      }
    })();
  }, [onError]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resumeId || !jobId) {
      onError("Please select both a resume and a job description");
      return;
    }
    setRunning(true);
    try {
      const res = await fetch("/api/analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, jobDescriptionId: jobId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.analysisId) {
          onFailed(data.analysisId);
        } else {
          onError(data.error ?? "Analysis failed");
          setRunning(false);
        }
        return;
      }
      onSuccess(data.analysis.id);
    } catch {
      onError("Network error. Please try again.");
      setRunning(false);
    }
  }

  const noResumes = !loadingPickers && resumes.length === 0;
  const noJobs = !loadingPickers && jobs.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          disabled={running}
          className="absolute right-4 top-4 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-lg font-semibold text-slate-900">Run new analysis</h2>
        <p className="mt-1 text-sm text-slate-500">Pick one resume and one job description.</p>

        {loadingPickers ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
          </div>
        ) : noResumes || noJobs ? (
          <div className="mt-5 space-y-3">
            {noResumes && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-700">
                You haven&apos;t uploaded any resumes yet.{" "}
                <Link href="/resumes" className="font-medium underline">
                  Upload one →
                </Link>
              </div>
            )}
            {noJobs && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-700">
                No job descriptions yet.{" "}
                <Link href="/jobs" className="font-medium underline">
                  Add one →
                </Link>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Resume</Label>
              <Select value={resumeId} onValueChange={setResumeId} disabled={running} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a resume…" />
                </SelectTrigger>
                <SelectContent>
                  {resumes.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Job description</Label>
              <Select value={jobId} onValueChange={setJobId} disabled={running} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a JD…" />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.title}{j.company ? ` · ${j.company}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={running}
              className="h-11 w-full rounded-lg bg-violet-600 font-medium text-white hover:bg-violet-700 disabled:opacity-80"
            >
              {running ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Running AI analysis…
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  Run analysis <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
            <p className="text-center text-xs text-slate-400">Usually takes 5–15 seconds.</p>
          </form>
        )}
      </div>
    </div>
  );
}

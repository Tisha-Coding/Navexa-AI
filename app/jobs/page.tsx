"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowLeft,
  Plus,
  Briefcase,
  Trash2,
  Calendar,
  Loader2,
  X,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppBackground } from "@/components/app-background";
import { Footer } from "@/components/footer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Job = {
  id: string;
  title: string;
  company: string | null;
  extractedSkills: string[];
  createdAt: string;
};

type ToastType = "success" | "error" | "warning";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [toast, setToast] = useState<{ type: ToastType; text: string } | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = useCallback((type: ToastType, text: string) => {
    setToast({ type, text });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      setJobs(data.jobs ?? []);
    } catch {
      showToast("error", "Failed to load job descriptions");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  function handleDelete(id: string) {
    setPendingDeleteId(id);
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/jobs?id=${pendingDeleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setJobs((prev) => prev.filter((j) => j.id !== pendingDeleteId));
      showToast("success", "Job description deleted");
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

      {/* Toast */}
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

      {/* Top nav */}
      <header className="relative z-10 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 shadow-sm">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-semibold tracking-tight text-slate-900">Navexa AI</span>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white/70">
              <ArrowLeft className="h-3.5 w-3.5" />
              Dashboard
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <section className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Job descriptions</h1>
            <p className="mt-1 text-sm text-slate-500">
              Paste a JD — we&apos;ll extract required skills for matching.
            </p>
          </div>
          <Button
            onClick={() => setAddOpen(true)}
            className="h-10 gap-1.5 rounded-lg bg-violet-600 px-4 font-medium text-white shadow-sm hover:bg-violet-700"
          >
            <Plus className="h-4 w-4" />
            Add JD
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded-2xl bg-white/70 py-20 ring-1 ring-slate-200/70">
            <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState onAdd={() => setAddOpen(true)} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((j) => (
              <JobCard key={j.id} job={j} onDelete={() => handleDelete(j.id)} />
            ))}
          </div>
        )}
      </section>

      {addOpen && (
        <AddJobModal
          onClose={() => setAddOpen(false)}
          onSuccess={() => {
            setAddOpen(false);
            loadJobs();
            showToast("success", "Job description added");
          }}
          onError={(msg) => showToast("error", msg)}
        />
      )}

      <ConfirmDialog
        open={!!pendingDeleteId}
        title="Delete this job description?"
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
        <Briefcase className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">No job descriptions yet</h3>
      <p className="mt-1 max-w-sm text-center text-sm text-slate-500">
        Add a JD by pasting the text — we&apos;ll extract required skills.
      </p>
      <Button onClick={onAdd} className="mt-5 gap-1.5 rounded-lg bg-violet-600 px-4 font-medium text-white hover:bg-violet-700">
        <Plus className="h-4 w-4" />
        Add your first JD
      </Button>
    </div>
  );
}

function JobCard({ job, onDelete }: { job: Job; onDelete: () => void }) {
  const date = new Date(job.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="group flex flex-col gap-3 rounded-2xl bg-white/85 p-5 shadow-sm shadow-slate-900/[0.04] ring-1 ring-slate-200/70 backdrop-blur-xl transition hover:shadow-md hover:ring-violet-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700 ring-1 ring-violet-100">
            <Briefcase className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="line-clamp-1 text-sm font-semibold text-slate-900">{job.title}</h3>
            {job.company && <p className="line-clamp-1 text-xs text-slate-500">{job.company}</p>}
          </div>
        </div>
        <button
          onClick={onDelete}
          className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
          aria-label="Delete JD"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Calendar className="h-3 w-3" />
        {date}
      </div>

      {job.extractedSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {job.extractedSkills.slice(0, 6).map((s) => (
            <span
              key={s}
              className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700 ring-1 ring-violet-100"
            >
              {s}
            </span>
          ))}
          {job.extractedSkills.length > 6 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200">
              +{job.extractedSkills.length - 6}
            </span>
          )}
        </div>
      )}

    </div>
  );
}

function AddJobModal({
  onClose,
  onSuccess,
  onError,
}: {
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [rawText, setRawText] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (rawText.trim().length < 50) {
      onError("JD text must be at least 50 characters");
      return;
    }
    if (!title.trim()) {
      onError("Title is required");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          company: company.trim() || null,
          rawText: rawText.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onError(data.error ?? "Failed to save");
        setBusy(false);
        return;
      }
      onSuccess();
    } catch {
      onError("Network error. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          disabled={busy}
          className="absolute right-4 top-4 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-lg font-semibold text-slate-900">Add job description</h2>
        <p className="mt-1 text-sm text-slate-500">Paste the JD text — we&apos;ll extract required skills.</p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-sm font-medium text-slate-700">
                Job title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={120}
                disabled={busy}
                placeholder="Senior Frontend Engineer"
                className="h-10 rounded-lg border-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company" className="text-sm font-medium text-slate-700">
                Company
              </Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                maxLength={120}
                disabled={busy}
                placeholder="Stripe"
                className="h-10 rounded-lg border-slate-200"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rawText" className="text-sm font-medium text-slate-700">
              JD text <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="rawText"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              required
              minLength={50}
              maxLength={50_000}
              disabled={busy}
              rows={8}
              placeholder="Paste the full job description here…"
              className="w-full resize-y rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-60"
            />
            <p className="text-xs text-slate-400">{rawText.length.toLocaleString()} / 50,000 chars</p>
          </div>

          <Button
            type="submit"
            disabled={busy}
            className="h-11 w-full rounded-lg bg-violet-600 font-medium text-white hover:bg-violet-700 disabled:opacity-80"
          >
            {busy ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </span>
            ) : (
              "Save job description"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

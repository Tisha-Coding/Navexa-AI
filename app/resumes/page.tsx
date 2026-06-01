"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowLeft,
  Upload,
  FileText,
  Trash2,
  Calendar,
  Loader2,
  X,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppBackground } from "@/components/app-background";
import { Footer } from "@/components/footer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Resume = {
  id: string;
  title: string;
  fileUrl: string;
  extractedSkills: string[];
  createdAt: string;
};

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = useCallback((type: "success" | "error" | "warning", text: string) => {
    setToast({ type, text });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const loadResumes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/resumes");
      const data = await res.json();
      setResumes(data.resumes ?? []);
    } catch {
      showToast("error", "Failed to load resumes");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  function handleDelete(id: string) {
    setPendingDeleteId(id);
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/resumes?id=${pendingDeleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setResumes((prev) => prev.filter((r) => r.id !== pendingDeleteId));
      showToast("success", "Resume deleted");
    } catch {
      showToast("error", "Failed to delete resume");
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
                ? "border-emerald-200 bg-white/95 text-emerald-700 shadow-emerald-900/10"
                : toast.type === "warning"
                ? "border-amber-200 bg-white/95 text-amber-700 shadow-amber-900/10"
                : "border-red-200 bg-white/95 text-red-700 shadow-red-900/10"
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
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Your resumes</h1>
            <p className="mt-1 text-sm text-slate-500">
              Upload a PDF resume — we&apos;ll extract skills and prep it for JD matching.
            </p>
          </div>
          <Button
            onClick={() => setUploadOpen(true)}
            className="h-10 gap-1.5 rounded-lg bg-violet-600 px-4 font-medium text-white shadow-sm hover:bg-violet-700"
          >
            <Upload className="h-4 w-4" />
            Upload resume
          </Button>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center rounded-2xl bg-white/70 py-20 ring-1 ring-slate-200/70">
            <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
          </div>
        ) : resumes.length === 0 ? (
          <EmptyState onUpload={() => setUploadOpen(true)} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resumes.map((r) => (
              <ResumeCard key={r.id} resume={r} onDelete={() => handleDelete(r.id)} />
            ))}
          </div>
        )}
      </section>

      {/* Upload modal */}
      {uploadOpen && (
        <UploadModal
          onClose={() => setUploadOpen(false)}
          onSuccess={(warning) => {
            setUploadOpen(false);
            loadResumes();
            if (warning) {
              showToast("warning", warning);
            } else {
              showToast("success", "Resume uploaded successfully");
            }
          }}
          onError={(msg) => showToast("error", msg)}
        />
      )}

      <ConfirmDialog
        open={!!pendingDeleteId}
        title="Delete this resume?"
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

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-white/70 py-20 ring-1 ring-slate-200/70 backdrop-blur-xl">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 ring-1 ring-violet-100">
        <FileText className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">No resumes yet</h3>
      <p className="mt-1 max-w-sm text-center text-sm text-slate-500">
        Upload your first PDF resume to start matching it against job descriptions.
      </p>
      <Button onClick={onUpload} className="mt-5 gap-1.5 rounded-lg bg-violet-600 px-4 font-medium text-white hover:bg-violet-700">
        <Upload className="h-4 w-4" />
        Upload PDF
      </Button>
    </div>
  );
}

function ResumeCard({ resume, onDelete }: { resume: Resume; onDelete: () => void }) {
  const date = new Date(resume.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="group relative flex flex-col gap-3 rounded-2xl bg-white/85 p-5 shadow-sm shadow-slate-900/[0.04] ring-1 ring-slate-200/70 backdrop-blur-xl transition hover:shadow-md hover:ring-violet-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-700 ring-1 ring-violet-100">
            <FileText className="h-4 w-4" />
          </div>
          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">{resume.title}</h3>
        </div>
        <button
          onClick={onDelete}
          className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
          aria-label="Delete resume"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Calendar className="h-3 w-3" />
        {date}
      </div>

      {resume.extractedSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {resume.extractedSkills.slice(0, 6).map((s) => (
            <span
              key={s}
              className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700 ring-1 ring-violet-100"
            >
              {s}
            </span>
          ))}
          {resume.extractedSkills.length > 6 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200">
              +{resume.extractedSkills.length - 6}
            </span>
          )}
        </div>
      )}

      <a
        href={resume.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 text-xs font-medium text-violet-700 hover:text-violet-800 hover:underline"
      >
        Open PDF →
      </a>
    </div>
  );
}

function UploadModal({
  onClose,
  onSuccess,
  onError,
}: {
  onClose: () => void;
  onSuccess: (warning?: string) => void;
  onError: (msg: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [titleError, setTitleError] = useState<string | null>(null);

  useEffect(() => {
    if (!titleError) return;
    const t = setTimeout(() => setTitleError(null), 3000);
    return () => clearTimeout(t);
  }, [titleError]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = (fd.get("title") as string ?? "").trim();
    const file = fd.get("file") as File | null;

    if (title.length < 4) {
      setTitleError("Title must be at least 4 characters");
      return;
    }
    setTitleError(null);

    if (!file || file.size === 0) {
      onError("Please select a PDF file");
      return;
    }
    if (file.type !== "application/pdf") {
      onError("Only PDF files are supported");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onError("File too large — max 5MB");
      return;
    }

    setUploading(true);
    try {
      const res = await fetch("/api/resumes/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        onError(data.error ?? "Upload failed");
        setUploading(false);
        return;
      }
      // Image-PDF detection — very little text extracted
      const skillCount = data.resume?.extractedSkills?.length ?? 0;
      const warning =
        skillCount === 0
          ? "Resume uploaded — but text extraction was weak. Re-export from Word/Google Docs (not a scan/screenshot)."
          : undefined;
      onSuccess(warning);
    } catch {
      onError("Network error. Please try again.");
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          disabled={uploading}
          className="absolute right-4 top-4 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-lg font-semibold text-slate-900">Upload resume</h2>
        <p className="mt-1 text-sm text-slate-500">PDF only · max 5MB · text-based (no scans)</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-sm font-medium text-slate-700">
              Title
            </Label>
            <Input
              id="title"
              name="title"
              required
              maxLength={100}
              disabled={uploading}
              placeholder="e.g. Frontend Resume 2026"
              onChange={() => setTitleError(null)}
              className={`h-11 rounded-lg transition ${titleError ? "border-red-400 focus-visible:border-red-400 focus-visible:ring-red-200" : "border-slate-200"}`}
            />
            <div className={`transition-all duration-300 overflow-hidden ${titleError ? "max-h-6 opacity-100 mt-1" : "max-h-0 opacity-0"}`}>
              <p className="text-xs text-red-500">{titleError}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="file" className="text-sm font-medium text-slate-700">
              PDF file
            </Label>
            <label
              htmlFor="file"
              className={`flex h-28 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 text-sm text-slate-600 transition hover:border-violet-300 hover:bg-violet-50/30 ${
                uploading ? "pointer-events-none opacity-60" : ""
              }`}
            >
              <Upload className="h-4 w-4 text-slate-400" />
              {fileName ? (
                <span className="px-3 text-center text-xs font-medium text-violet-700">{fileName}</span>
              ) : (
                <>
                  <span className="font-medium">Click to choose PDF</span>
                  <span className="text-xs text-slate-400">or drag & drop</span>
                </>
              )}
            </label>
            <input
              id="file"
              name="file"
              type="file"
              accept="application/pdf,.pdf"
              required
              disabled={uploading}
              className="sr-only"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
            />
          </div>

          <Button
            type="submit"
            disabled={uploading}
            className="h-11 w-full rounded-lg bg-violet-600 font-medium text-white hover:bg-violet-700 disabled:opacity-80"
          >
            {uploading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Uploading & parsing…
              </span>
            ) : (
              "Upload"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

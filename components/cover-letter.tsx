"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Download,
  Edit3,
  Save,
  X,
  AlertTriangle,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function CoverLetterPanel({ analysisId }: { analysisId: string }) {
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [draft, setDraft] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/analyses/${analysisId}/cover-letter`);
      const data = await res.json();
      setCoverLetter(data.coverLetter ?? null);
    } catch {
      setError("Failed to load cover letter");
    } finally {
      setLoading(false);
    }
  }, [analysisId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/analyses/${analysisId}/cover-letter`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to generate cover letter");
        return;
      }
      setCoverLetter(data.coverLetter);
      setEditing(false);
    } catch {
      setError("Network error");
    } finally {
      setGenerating(false);
    }
  }

  async function save() {
    if (draft.trim().length < 50) {
      setError("Cover letter must be at least 50 characters");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/analyses/${analysisId}/cover-letter`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverLetter: draft.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save");
        return;
      }
      setCoverLetter(data.coverLetter);
      setEditing(false);
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  function startEdit() {
    setDraft(coverLetter ?? "");
    setEditing(true);
  }

  async function copyToClipboard() {
    if (!coverLetter) return;
    try {
      await navigator.clipboard.writeText(coverLetter);
      setCopied(true);
    } catch {
      setError("Copy failed");
    }
  }

  function downloadAsText() {
    if (!coverLetter) return;
    const blob = new Blob([coverLetter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cover-letter.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-6 rounded-2xl bg-white/85 p-6 shadow-sm shadow-slate-900/[0.04] ring-1 ring-slate-200/70 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Mail className="h-4 w-4 text-violet-600" />
            Cover letter
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Tailored to this JD — uses your resume, matched skills, and the AI summary as context.
          </p>
        </div>
        {coverLetter && !editing && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={copyToClipboard}
              size="sm"
              variant="outline"
              className="h-8 gap-1 rounded-md border-slate-200 text-xs"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button
              onClick={downloadAsText}
              size="sm"
              variant="outline"
              className="h-8 gap-1 rounded-md border-slate-200 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
            <Button
              onClick={startEdit}
              size="sm"
              variant="outline"
              className="h-8 gap-1 rounded-md border-slate-200 text-xs"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              onClick={generate}
              disabled={generating}
              size="sm"
              className="h-8 gap-1 rounded-md bg-violet-600 px-3 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-80"
            >
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Re-run
            </Button>
          </div>
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
      ) : editing ? (
        <div className="mt-4 space-y-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={saving}
            rows={14}
            className="w-full resize-y rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-sm leading-relaxed text-slate-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-60"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">{draft.length.toLocaleString()} / 5,000 chars</p>
            <div className="flex gap-2">
              <Button
                onClick={() => setEditing(false)}
                disabled={saving}
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 rounded-md border-slate-200 text-xs"
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </Button>
              <Button
                onClick={save}
                disabled={saving}
                size="sm"
                className="h-9 gap-1.5 rounded-md bg-violet-600 px-3 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-80"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save
              </Button>
            </div>
          </div>
        </div>
      ) : !coverLetter ? (
        <div className="mt-5 flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
          <Sparkles className="h-6 w-6 text-slate-300" />
          <div>
            <p className="text-sm font-medium text-slate-700">No cover letter yet</p>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              Generate a tailored cover letter for this role in a few seconds.
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
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Writing…
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Generate cover letter
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="mt-4 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50/50 p-5 text-sm leading-relaxed text-slate-800">
          {coverLetter}
        </div>
      )}
    </div>
  );
}

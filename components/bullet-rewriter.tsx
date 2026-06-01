"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Sparkles,
  Loader2,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  PencilLine,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Bullet = {
  id: string;
  original: string;
  rewritten: string;
};

export function BulletRewriter({ analysisId }: { analysisId: string }) {
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/analyses/${analysisId}/rewrites`);
      const data = await res.json();
      setBullets(data.rewrites ?? []);
    } catch {
      setError("Failed to load bullet rewrites");
    } finally {
      setLoading(false);
    }
  }, [analysisId]);

  useEffect(() => {
    load();
  }, [load]);

  async function generate() {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch(`/api/analyses/${analysisId}/rewrites`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to generate rewrites");
        setRunning(false);
        return;
      }
      setBullets(data.rewrites);
    } catch {
      setError("Network error");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl bg-white/85 p-6 shadow-sm shadow-slate-900/[0.04] ring-1 ring-slate-200/70 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <PencilLine className="h-4 w-4 text-violet-600" />
            AI bullet rewrites
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Sharpened versions of your resume bullets aligned to this JD. Copy whichever ones you want to use.
          </p>
        </div>
        <Button
          onClick={generate}
          disabled={running}
          className="h-9 gap-1.5 rounded-lg bg-violet-600 px-3 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-80"
        >
          {running ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Rewriting…
            </>
          ) : bullets.length === 0 ? (
            <>
              <Sparkles className="h-3.5 w-3.5" /> Generate rewrites
            </>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5" /> Re-run
            </>
          )}
        </Button>
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
      ) : bullets.length === 0 ? (
        <div className="mt-5 flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
          <Sparkles className="h-6 w-6 text-slate-300" />
          <p className="text-sm font-medium text-slate-700">No rewrites yet</p>
          <p className="max-w-sm text-xs text-slate-500">
            We&apos;ll pick up to 8 bullets from your resume and rewrite them to better match this JD.
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-4">
          {bullets.map((b) => (
            <BulletRow key={b.id} bullet={b} />
          ))}
        </ul>
      )}
    </div>
  );
}

function BulletRow({ bullet }: { bullet: Bullet }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(bullet.rewritten).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Original</div>
          <p className="mt-1 text-sm text-slate-700">{bullet.original}</p>
        </div>
        <div className="hidden self-center text-slate-300 sm:block">
          <ArrowRight className="h-4 w-4" />
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-violet-600">Rewritten</div>
          <p className="mt-1 text-sm text-slate-900">{bullet.rewritten}</p>
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <Button
          onClick={copy}
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 rounded-md border-slate-200 text-xs"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </Button>
      </div>
    </li>
  );
}

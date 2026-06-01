"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  Loader2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Trophy,
  Code2,
  Award,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DifficultyCount = {
  difficulty: "All" | "Easy" | "Medium" | "Hard";
  count: number;
  submissions: number;
};

type LeetcodeScan = {
  username: string;
  realName: string | null;
  avatarUrl: string | null;
  country: string | null;
  ranking: number | null;
  reputation: number | null;
  starRating: number | null;
  submitStats: DifficultyCount[];
  totalSolved: number;
  contestRating: number | null;
  contestGlobalRanking: number | null;
  contestAttended: number | null;
  languages: { languageName: string; problemsSolved: number }[];
  badges: string[];
  scannedAt: string;
};

// Inline LeetCode mark — yellow square with stylized "L". Lucide doesn't ship
// brand icons in v1, so we render our own to match the GitHub panel.
function LeetcodeMark({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="#FFA116"
        d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"
      />
    </svg>
  );
}

const DIFFICULTY_META: Record<
  Exclude<DifficultyCount["difficulty"], "All">,
  { tone: string; label: string }
> = {
  Easy: { tone: "bg-emerald-50 text-emerald-700 ring-emerald-100", label: "Easy" },
  Medium: { tone: "bg-amber-50 text-amber-700 ring-amber-100", label: "Medium" },
  Hard: { tone: "bg-red-50 text-red-700 ring-red-100", label: "Hard" },
};

export function LeetcodeScannerPanel({ resumeId }: { resumeId: string }) {
  const [scan, setScan] = useState<LeetcodeScan | null>(null);
  const [detected, setDetected] = useState<string | null>(null);
  const [override, setOverride] = useState("");
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/resumes/${resumeId}/leetcode-scan`);
      const data = await res.json();
      setDetected(data.detectedUsername ?? null);
      setScan(data.scan?.data ?? null);
    } catch {
      setError("Failed to load LeetCode scan");
    } finally {
      setLoading(false);
    }
  }, [resumeId]);

  useEffect(() => {
    load();
  }, [load]);

  async function runScan() {
    setScanning(true);
    setError(null);
    try {
      const res = await fetch(`/api/resumes/${resumeId}/leetcode-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(override.trim() ? { username: override.trim() } : {}),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Scan failed");
        return;
      }
      setScan(data.scan.data);
      setOverride("");
    } catch {
      setError("Network error");
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl bg-white/85 p-6 shadow-sm shadow-slate-900/[0.04] ring-1 ring-slate-200/70 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <LeetcodeMark className="h-4 w-4" />
            LeetCode profile scan
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Pulls problems solved, difficulty mix, and contest rating to back up your DSA claims.
          </p>
        </div>
        {scan && (
          <Button
            onClick={runScan}
            disabled={scanning}
            size="sm"
            variant="outline"
            className="h-8 gap-1 rounded-md border-slate-200 text-xs"
          >
            {scanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Rescan
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
      ) : !scan ? (
        <div className="mt-5 flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
          <Sparkles className="h-6 w-6 text-slate-300" />
          <div>
            <p className="text-sm font-medium text-slate-700">No scan yet</p>
            {detected ? (
              <p className="mt-1 text-xs text-slate-500">
                Detected username: <span className="font-mono text-slate-800">{detected}</span>
              </p>
            ) : (
              <p className="mt-1 max-w-sm text-xs text-slate-500">
                Couldn&apos;t detect a LeetCode URL in this resume. Enter the username manually below.
              </p>
            )}
          </div>
          <div className="mt-1 flex w-full max-w-sm gap-2">
            <Input
              value={override}
              onChange={(e) => setOverride(e.target.value)}
              placeholder={detected ?? "your-leetcode-username"}
              className="h-9 rounded-md border-slate-200 text-sm"
              disabled={scanning}
            />
            <Button
              onClick={runScan}
              disabled={scanning || (!override.trim() && !detected)}
              size="sm"
              className="h-9 gap-1.5 rounded-md bg-violet-600 px-3 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-80"
            >
              {scanning ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Scanning…
                </>
              ) : (
                <>
                  <LeetcodeMark className="h-3.5 w-3.5" /> Scan
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <ScanResult scan={scan} />
      )}
    </div>
  );
}

function ScanResult({ scan }: { scan: LeetcodeScan }) {
  const easy = scan.submitStats.find((d) => d.difficulty === "Easy");
  const medium = scan.submitStats.find((d) => d.difficulty === "Medium");
  const hard = scan.submitStats.find((d) => d.difficulty === "Hard");

  return (
    <div className="mt-4 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        {scan.avatarUrl && (
          <Image
            src={scan.avatarUrl}
            alt={scan.username}
            width={64}
            height={64}
            className="rounded-2xl ring-1 ring-slate-200"
            unoptimized
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <a
              href={`https://leetcode.com/u/${scan.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-base font-semibold text-slate-900 hover:underline"
            >
              {scan.realName ?? scan.username}
            </a>
            <span className="text-xs text-slate-500">@{scan.username}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <Stat
              icon={<Trophy className="h-3 w-3" />}
              label={`${scan.totalSolved} solved`}
            />
            {scan.ranking !== null && scan.ranking > 0 && (
              <Stat
                icon={<Award className="h-3 w-3" />}
                label={`Rank #${scan.ranking.toLocaleString()}`}
              />
            )}
            {scan.country && <Stat icon={<Globe className="h-3 w-3" />} label={scan.country} />}
          </div>
        </div>
      </div>

      {/* Difficulty breakdown */}
      <div className="grid grid-cols-3 gap-3">
        {[easy, medium, hard].map((d) =>
          d ? (
            <div
              key={d.difficulty}
              className={`rounded-xl px-4 py-3 ring-1 ${
                DIFFICULTY_META[d.difficulty as "Easy" | "Medium" | "Hard"].tone
              }`}
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
                {DIFFICULTY_META[d.difficulty as "Easy" | "Medium" | "Hard"].label}
              </div>
              <div className="mt-0.5 text-2xl font-semibold">{d.count}</div>
              <div className="text-[10px] opacity-70">{d.submissions} submissions</div>
            </div>
          ) : null
        )}
      </div>

      {/* Contest */}
      {scan.contestRating !== null && (
        <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-violet-700">
            Contest performance
          </div>
          <div className="mt-1 flex flex-wrap items-baseline gap-4">
            <div>
              <div className="text-2xl font-semibold text-violet-900">{scan.contestRating}</div>
              <div className="text-[10px] text-violet-700/80">rating</div>
            </div>
            {scan.contestGlobalRanking !== null && (
              <div>
                <div className="text-base font-semibold text-violet-900">
                  #{scan.contestGlobalRanking.toLocaleString()}
                </div>
                <div className="text-[10px] text-violet-700/80">global rank</div>
              </div>
            )}
            {scan.contestAttended !== null && (
              <div>
                <div className="text-base font-semibold text-violet-900">{scan.contestAttended}</div>
                <div className="text-[10px] text-violet-700/80">contests</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Languages */}
      {scan.languages.length > 0 && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Languages used
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {scan.languages.map((l) => (
              <span
                key={l.languageName}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200"
              >
                <Code2 className="h-3 w-3" />
                {l.languageName} · {l.problemsSolved}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Badges */}
      {scan.badges.length > 0 && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Badges
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {scan.badges.map((b) => (
              <span
                key={b}
                className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-100"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-slate-400">
        Last scanned · {new Date(scan.scannedAt).toLocaleString()}
      </p>
    </div>
  );
}

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      {icon}
      {label}
    </span>
  );
}

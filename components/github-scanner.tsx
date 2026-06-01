"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  Loader2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Star,
  GitFork,
  Users,
  BookOpen,
  Calendar,
} from "lucide-react";

// Inline GitHub mark — lucide-react dropped brand icons in v1, so we render
// our own. Sized to match the lucide stroke icons we use elsewhere.
function GithubMark({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.92.58.11.79-.25.79-.56v-1.96c-3.2.7-3.87-1.54-3.87-1.54-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.24 3.34.95.1-.74.4-1.24.72-1.53-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.47.11-3.06 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.59.23 2.77.11 3.06.74.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.4-5.27 5.69.41.35.78 1.04.78 2.1v3.11c0 .31.21.67.8.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type RepoSummary = {
  name: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  url: string;
  isFork: boolean;
  updatedAt: string | null;
};

type GithubScan = {
  username: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  location: string | null;
  publicRepos: number;
  followers: number;
  following: number;
  accountCreatedAt: string | null;
  topLanguages: { language: string; count: number }[];
  topRepos: RepoSummary[];
  lastActivity: string | null;
  totalStars: number;
  scannedAt: string;
};

export function GithubScannerPanel({ resumeId }: { resumeId: string }) {
  const [scan, setScan] = useState<GithubScan | null>(null);
  const [detected, setDetected] = useState<string | null>(null);
  const [override, setOverride] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/resumes/${resumeId}/github-scan`);
      const data = await res.json();
      setDetected(data.detectedUsername ?? null);
      setScan(data.scan?.data ?? null);
    } catch {
      setError("Failed to load GitHub scan");
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
      const res = await fetch(`/api/resumes/${resumeId}/github-scan`, {
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
            <GithubMark className="h-4 w-4 text-slate-900" />
            GitHub profile scan
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Pulls your public repos, top languages, and stargazers to validate skills against your resume.
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
                Couldn&apos;t detect a GitHub URL in this resume. Enter the username manually below.
              </p>
            )}
          </div>
          <div className="mt-1 flex w-full max-w-sm gap-2">
            <Input
              value={override}
              onChange={(e) => setOverride(e.target.value)}
              placeholder={detected ?? "your-github-username"}
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
                  <GithubMark className="h-3.5 w-3.5" /> Scan
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

function ScanResult({ scan }: { scan: GithubScan }) {
  const [showAll, setShowAll] = useState(false);
  const visibleRepos = showAll ? scan.topRepos : scan.topRepos.slice(0, 6);
  const accountAgeYears = scan.accountCreatedAt
    ? Math.floor((Date.now() - new Date(scan.accountCreatedAt).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <div className="mt-4 space-y-5">
      {/* Header strip */}
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
              href={`https://github.com/${scan.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-base font-semibold text-slate-900 hover:underline"
            >
              {scan.name ?? scan.username}
            </a>
            <span className="text-xs text-slate-500">@{scan.username}</span>
          </div>
          {scan.bio && <p className="mt-1 line-clamp-2 text-xs text-slate-600">{scan.bio}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <Stat icon={<BookOpen className="h-3 w-3" />} label={`${scan.publicRepos} repos`} />
            <Stat icon={<Star className="h-3 w-3" />} label={`${scan.totalStars} stars`} />
            <Stat icon={<Users className="h-3 w-3" />} label={`${scan.followers} followers`} />
            {accountAgeYears !== null && (
              <Stat
                icon={<Calendar className="h-3 w-3" />}
                label={`${accountAgeYears}y on GitHub`}
              />
            )}
          </div>
        </div>
      </div>

      {/* Languages */}
      {scan.topLanguages.length > 0 && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Top languages
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {scan.topLanguages.map((l) => (
              <span
                key={l.language}
                className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700 ring-1 ring-violet-100"
              >
                {l.language} · {l.count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Repos */}
      {scan.topRepos.length > 0 && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Top repositories
          </div>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {visibleRepos.map((r) => (
              <li key={r.url} className="rounded-lg border border-slate-200 bg-white p-3">
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-slate-900 hover:underline"
                >
                  {r.name}
                </a>
                {r.description && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{r.description}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                  {r.language && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                      {r.language}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3 w-3" /> {r.stars}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <GitFork className="h-3 w-3" /> {r.forks}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          {scan.topRepos.length > 6 && (
            <button
              onClick={() => setShowAll((p) => !p)}
              className="mt-3 text-xs font-medium text-violet-600 hover:underline"
            >
              {showAll ? "Show less" : `Show all ${scan.topRepos.length} repositories`}
            </button>
          )}
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

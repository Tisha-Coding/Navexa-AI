// GitHub public-profile scanner.
//
// Uses the unauthenticated GitHub REST API (60 req/hour from an IP — plenty
// for a single profile scan which costs 2 calls). For higher throughput we'd
// add a server-side token, but this is enough for a per-user assignment demo.
//
// Returns a JSON-serialisable summary that fits in ProfileScan.data.

export type GithubRepoSummary = {
  name: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  url: string;
  isFork: boolean;
  updatedAt: string | null;
};

export type GithubScan = {
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
  topRepos: GithubRepoSummary[];
  lastActivity: string | null;
  totalStars: number;
  scannedAt: string;
};

const GH_BASE = "https://api.github.com";
const TIMEOUT_MS = 8_000;

async function ghFetch<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${GH_BASE}${path}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "NavexaAI-GithubScanner/1.0",
        // X-GitHub-Api-Version pins us to a stable schema.
        "X-GitHub-Api-Version": "2022-11-28",
      },
      signal: controller.signal,
      // Don't cache profile scans in Next's data cache — user expects fresh data
      cache: "no-store",
    });

    if (res.status === 404) {
      throw new Error("GitHub user not found");
    }
    if (res.status === 403) {
      throw new Error("GitHub rate-limited — try again in a few minutes");
    }
    if (!res.ok) {
      throw new Error(`GitHub responded ${res.status}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

type GhUser = {
  login: string;
  name: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
};

type GhRepo = {
  name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  html_url: string;
  fork: boolean;
  updated_at: string;
  pushed_at: string;
};

export async function scanGithubProfile(usernameRaw: string): Promise<GithubScan> {
  // Defensive — strip any whitespace / trailing slash users may have included.
  const username = usernameRaw.trim().replace(/^@/, "").replace(/\/+$/, "");
  if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38}[a-zA-Z0-9])?$/.test(username)) {
    throw new Error("Invalid GitHub username");
  }

  // 1) user profile
  const user = await ghFetch<GhUser>(`/users/${encodeURIComponent(username)}`);

  // 2) repos — sorted by recently pushed, up to 100 (page cap without auth)
  const repos = await ghFetch<GhRepo[]>(
    `/users/${encodeURIComponent(username)}/repos?per_page=100&sort=pushed&type=owner`
  );

  // Exclude forks from "top repos" listing — they don't represent original work,
  // but we still count their languages (the user did write code in them).
  const original = repos.filter((r) => !r.fork);

  const topRepos: GithubRepoSummary[] = original
    .slice()
    .sort((a, b) => b.stargazers_count - a.stargazers_count || +new Date(b.pushed_at) - +new Date(a.pushed_at))
    .map((r) => ({
      name: r.name,
      description: r.description,
      stars: r.stargazers_count,
      forks: r.forks_count,
      language: r.language,
      url: r.html_url,
      isFork: r.fork,
      updatedAt: r.pushed_at,
    }));

  const languageCounts = new Map<string, number>();
  for (const r of repos) {
    if (!r.language) continue;
    languageCounts.set(r.language, (languageCounts.get(r.language) ?? 0) + 1);
  }
  const topLanguages = Array.from(languageCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([language, count]) => ({ language, count }));

  const totalStars = original.reduce((sum, r) => sum + r.stargazers_count, 0);
  const lastActivity =
    repos.length > 0
      ? repos.reduce((latest, r) => (r.pushed_at > latest ? r.pushed_at : latest), repos[0].pushed_at)
      : null;

  return {
    username: user.login,
    name: user.name,
    bio: user.bio,
    avatarUrl: user.avatar_url,
    location: user.location,
    publicRepos: user.public_repos,
    followers: user.followers,
    following: user.following,
    accountCreatedAt: user.created_at,
    topLanguages,
    topRepos,
    lastActivity,
    totalStars,
    scannedAt: new Date().toISOString(),
  };
}

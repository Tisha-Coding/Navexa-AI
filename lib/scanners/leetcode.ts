// LeetCode public-profile scanner.
//
// LeetCode doesn't ship an official REST API — their site is powered by a
// public GraphQL endpoint that anyone can hit anonymously. We compose two
// queries: profile stats (ranking, solved counts) and language stats.
//
// Notes:
//  - The endpoint is finicky: it sometimes returns 200 with an `errors` field
//    instead of HTTP 4xx. We branch on that.
//  - No rate-limit headers exposed, but anecdotally ~1 req/sec is fine.
//  - Anything sensitive (Origin/Referer headers) is not required for public
//    profiles, so we keep the request minimal.

export type LeetcodeDifficultyCount = {
  difficulty: "All" | "Easy" | "Medium" | "Hard";
  count: number;
  submissions: number;
};

export type LeetcodeLanguageStat = { languageName: string; problemsSolved: number };

export type LeetcodeScan = {
  username: string;
  realName: string | null;
  avatarUrl: string | null;
  country: string | null;
  ranking: number | null;
  reputation: number | null;
  starRating: number | null;
  submitStats: LeetcodeDifficultyCount[]; // includes All + Easy/Medium/Hard
  totalSolved: number;
  contestRating: number | null;
  contestGlobalRanking: number | null;
  contestAttended: number | null;
  languages: LeetcodeLanguageStat[];
  badges: string[];
  scannedAt: string;
};

const LC_GRAPHQL = "https://leetcode.com/graphql";
const TIMEOUT_MS = 10_000;

async function getLCCsrfToken(): Promise<string | null> {
  try {
    const res = await fetch("https://leetcode.com/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html",
      },
      cache: "no-store",
    });
    const cookies = res.headers.getSetCookie?.() ?? [];
    const raw = cookies.join("; ");
    const match = raw.match(/csrftoken=([^;,\s]+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

const PROFILE_QUERY = `
query userPublicProfile($username: String!) {
  matchedUser(username: $username) {
    username
    profile {
      realName
      userAvatar
      countryName
      ranking
      reputation
      starRating
    }
    submitStats: submitStatsGlobal {
      acSubmissionNum {
        difficulty
        count
        submissions
      }
    }
    languageProblemCount { languageName problemsSolved }
    badges { displayName }
  }
}`;

const CONTEST_QUERY = `
query userContestRankingInfo($username: String!) {
  userContestRanking(username: $username) {
    attendedContestsCount
    rating
    globalRanking
    topPercentage
  }
}`;

async function lcQuery<T>(query: string, variables: Record<string, unknown>, csrfToken?: string | null): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(LC_GRAPHQL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "application/json",
        Referer: "https://leetcode.com",
        Origin: "https://leetcode.com",
        ...(csrfToken ? {
          "x-csrftoken": csrfToken,
          Cookie: `csrftoken=${csrfToken}`,
        } : {}),
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`LeetCode responded ${res.status}`);
    }

    const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
    if (json.errors?.length) {
      throw new Error(json.errors[0]?.message ?? "LeetCode GraphQL error");
    }
    if (!json.data) {
      throw new Error("LeetCode returned no data");
    }
    return json.data;
  } finally {
    clearTimeout(timer);
  }
}

type ProfileResp = {
  matchedUser: {
    username: string;
    profile: {
      realName: string | null;
      userAvatar: string | null;
      countryName: string | null;
      ranking: number | null;
      reputation: number | null;
      starRating: number | null;
    };
    submitStats: {
      acSubmissionNum: LeetcodeDifficultyCount[];
    };
    languageProblemCount: LeetcodeLanguageStat[];
    badges: { displayName: string }[];
  } | null;
};

type ContestResp = {
  userContestRanking: {
    attendedContestsCount: number;
    rating: number;
    globalRanking: number;
    topPercentage: number;
  } | null;
};

export async function scanLeetcodeProfile(usernameRaw: string): Promise<LeetcodeScan> {
  const username = usernameRaw.trim().replace(/^@/, "").replace(/\/+$/, "");
  if (!/^[a-zA-Z0-9_-]{1,40}$/.test(username)) {
    throw new Error("Invalid LeetCode username");
  }

  const csrfToken = await getLCCsrfToken();

  // Profile is required; contest data is optional (newer users won't have it).
  const profileData = await lcQuery<ProfileResp>(PROFILE_QUERY, { username }, csrfToken);
  if (!profileData.matchedUser) {
    throw new Error("LeetCode user not found");
  }

  // Contest query may legitimately return null — don't fail the scan over it.
  let contestData: ContestResp | null = null;
  try {
    contestData = await lcQuery<ContestResp>(CONTEST_QUERY, { username }, csrfToken);
  } catch {
    contestData = null;
  }

  const u = profileData.matchedUser;
  const allBucket = u.submitStats.acSubmissionNum.find((d) => d.difficulty === "All");

  return {
    username: u.username,
    realName: u.profile.realName,
    avatarUrl: u.profile.userAvatar,
    country: u.profile.countryName,
    ranking: u.profile.ranking,
    reputation: u.profile.reputation,
    starRating: u.profile.starRating,
    submitStats: u.submitStats.acSubmissionNum,
    totalSolved: allBucket?.count ?? 0,
    contestRating: contestData?.userContestRanking?.rating
      ? Math.round(contestData.userContestRanking.rating)
      : null,
    contestGlobalRanking: contestData?.userContestRanking?.globalRanking ?? null,
    contestAttended: contestData?.userContestRanking?.attendedContestsCount ?? null,
    languages: u.languageProblemCount
      .slice()
      .sort((a, b) => b.problemsSolved - a.problemsSolved)
      .slice(0, 8),
    badges: u.badges.map((b) => b.displayName).slice(0, 8),
    scannedAt: new Date().toISOString(),
  };
}

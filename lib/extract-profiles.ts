// Detect public profile usernames inside a resume's raw text.
//
// Resumes often include profile links in the header:
//   github.com/Tisha-Coding   |   leetcode.com/u/Tisha_Leetcodeee
//   https://github.com/foo
// We extract the *username* (not the URL), so the scanner can hit the official
// API directly. Only public, no-auth platforms supported here.

const GITHUB_HANDLE = /[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38}[a-zA-Z0-9])?/;
const LEETCODE_HANDLE = /[a-zA-Z0-9_-]{1,40}/;

function pickFirst(re: RegExp, text: string): string | null {
  const m = text.match(re);
  return m ? m[1] : null;
}

export function findGithubUsername(text: string): string | null {
  if (!text) return null;
  // Match any of:
  //   github.com/<user>
  //   github.com/<user>/...
  //   https://github.com/<user>
  // Avoid catching reserved paths like /orgs/, /sponsors/, /settings/
  const re = new RegExp(
    `github\\.com/(?!(?:orgs|sponsors|settings|features|enterprise|marketplace)(?:[/?#]|$))(${GITHUB_HANDLE.source})`,
    "i"
  );
  return pickFirst(re, text);
}

export function findLeetcodeUsername(text: string): string | null {
  if (!text) return null;
  // LeetCode patterns:
  //   leetcode.com/u/<user>
  //   leetcode.com/<user>     (legacy)
  const reA = new RegExp(`leetcode\\.com/u/(${LEETCODE_HANDLE.source})`, "i");
  const mA = reA.exec(text);
  if (mA) {
    // PDF extraction sometimes converts underscores to spaces — if the char
    // immediately after the match is a space followed by more word chars,
    // it was almost certainly an underscore in the original URL.
    const after = text.slice(mA.index + mA[0].length);
    const cont = after.match(/^ ([a-zA-Z0-9_-]+)/);
    return cont ? mA[1] + "_" + cont[1] : mA[1];
  }

  const reB = new RegExp(
    `leetcode\\.com/(?!(?:problems|contest|discuss|tag|company|explore)(?:[/?#]|$))(${LEETCODE_HANDLE.source})`,
    "i"
  );
  return pickFirst(reB, text);
}

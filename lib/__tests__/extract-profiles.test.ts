import { describe, it, expect } from "vitest";
import { findGithubUsername, findLeetcodeUsername } from "../extract-profiles";

describe("findGithubUsername", () => {
  it("returns null for empty string", () => {
    expect(findGithubUsername("")).toBeNull();
  });

  it("extracts username from github.com/username", () => {
    expect(findGithubUsername("github.com/Tisha-Coding")).toBe("Tisha-Coding");
  });

  it("extracts username from https://github.com/username", () => {
    expect(findGithubUsername("https://github.com/Tisha-Coding")).toBe("Tisha-Coding");
  });

  it("extracts username when URL is embedded in text", () => {
    const text = "Find me at github.com/Tisha-Coding | LinkedIn: linkedin.com/in/tisha";
    expect(findGithubUsername(text)).toBe("Tisha-Coding");
  });

  it("returns null for reserved GitHub paths", () => {
    expect(findGithubUsername("github.com/orgs/my-company")).toBeNull();
    expect(findGithubUsername("github.com/sponsors/someone")).toBeNull();
  });

  it("returns null when no GitHub URL is present", () => {
    expect(findGithubUsername("My portfolio is at mysite.com")).toBeNull();
  });
});

describe("findLeetcodeUsername", () => {
  it("returns null for empty string", () => {
    expect(findLeetcodeUsername("")).toBeNull();
  });

  it("extracts username from leetcode.com/u/username", () => {
    expect(findLeetcodeUsername("leetcode.com/u/Tisha_Leetcodeee")).toBe("Tisha_Leetcodeee");
  });

  it("extracts username from https://leetcode.com/u/username", () => {
    expect(findLeetcodeUsername("https://leetcode.com/u/Tisha_Leetcodeee")).toBe("Tisha_Leetcodeee");
  });

  it("handles PDF underscore-to-space conversion", () => {
    // PDF extraction converts Tisha_Leetcodeee → Tisha Leetcodeee
    const text = "leetcode.com/u/Tisha Leetcodeee Professional Summary";
    expect(findLeetcodeUsername(text)).toBe("Tisha_Leetcodeee");
  });

  it("extracts username from legacy leetcode.com/username", () => {
    expect(findLeetcodeUsername("leetcode.com/myusername")).toBe("myusername");
  });

  it("returns null when no LeetCode URL is present", () => {
    expect(findLeetcodeUsername("Check my GitHub at github.com/Tisha-Coding")).toBeNull();
  });

  it("returns null for reserved LeetCode paths", () => {
    expect(findLeetcodeUsername("leetcode.com/problems/two-sum")).toBeNull();
    expect(findLeetcodeUsername("leetcode.com/contest/weekly-contest-123")).toBeNull();
  });
});

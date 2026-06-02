import { describe, it, expect } from "vitest";
import { keywordScore } from "../keyword-score";

describe("keywordScore", () => {
  it("returns score 0 when both arrays are empty", () => {
    const result = keywordScore([], []);
    expect(result.score).toBe(0);
    expect(result.matched).toEqual([]);
    expect(result.missing).toEqual([]);
  });

  it("returns score 0 when JD has no skills", () => {
    const result = keywordScore(["React", "Node.js"], []);
    expect(result.score).toBe(0);
    expect(result.jdSkillCount).toBe(0);
  });

  it("returns score 100 when all JD skills are in resume", () => {
    const result = keywordScore(["React", "Node.js", "TypeScript"], ["React", "Node.js", "TypeScript"]);
    expect(result.score).toBe(100);
    expect(result.missing).toEqual([]);
  });

  it("returns score 0 when no JD skills match resume", () => {
    const result = keywordScore(["Python", "Django"], ["React", "Node.js"]);
    expect(result.score).toBe(0);
    expect(result.matched).toEqual([]);
    expect(result.missing).toEqual(["Node.js", "React"]);
  });

  it("calculates partial match score correctly", () => {
    const result = keywordScore(["React", "Python"], ["React", "Node.js", "TypeScript", "Python"]);
    expect(result.score).toBe(50); // 2 matched out of 4 JD skills
    expect(result.matched).toEqual(["Python", "React"]);
    expect(result.missing).toEqual(["Node.js", "TypeScript"]);
  });

  it("matches case-insensitively", () => {
    const result = keywordScore(["react", "NODE.JS"], ["React", "Node.js"]);
    expect(result.score).toBe(100);
    expect(result.matched.length).toBe(2);
  });

  it("identifies extra skills in resume that JD does not require", () => {
    const result = keywordScore(["React", "Docker", "AWS"], ["React"]);
    expect(result.score).toBe(100);
    expect(result.extra).toContain("Docker");
    expect(result.extra).toContain("AWS");
  });

  it("returns correct jdSkillCount", () => {
    const result = keywordScore(["React"], ["React", "Node.js", "TypeScript"]);
    expect(result.jdSkillCount).toBe(3);
  });
});

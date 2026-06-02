import { describe, it, expect } from "vitest";
import { extractSkills } from "../extract-skills";

describe("extractSkills", () => {
  it("returns empty array for empty string", () => {
    expect(extractSkills("")).toEqual([]);
  });

  it("returns empty array for text with no known skills", () => {
    const result = extractSkills("I enjoy cooking and hiking on weekends.");
    expect(result).toEqual([]);
  });

  it("extracts a single skill from text", () => {
    const result = extractSkills("I have experience with React and Redux");
    expect(result).toContain("React");
  });

  it("extracts multiple skills from a resume-like text", () => {
    const text = "Built REST APIs using Node.js and PostgreSQL, deployed on AWS with Docker";
    const result = extractSkills(text);
    expect(result).toContain("Node.js");
    expect(result).toContain("PostgreSQL");
    expect(result).toContain("AWS");
    expect(result).toContain("Docker");
    expect(result).toContain("REST");
  });

  it("is case-insensitive — detects skill regardless of casing in text", () => {
    const result = extractSkills("Proficient in TYPESCRIPT and worked with MONGODB databases");
    expect(result).toContain("TypeScript");
    expect(result).toContain("MongoDB");
  });

  it("does not match partial words — rust inside trust", () => {
    const result = extractSkills("You should always trust the process.");
    expect(result).not.toContain("Rust");
  });

  it("returns skills sorted alphabetically", () => {
    const result = extractSkills("Used React, Python, and AWS in the project.");
    const sorted = [...result].sort();
    expect(result).toEqual(sorted);
  });
});

import { describe, expect, it } from "vitest";
import { parsePolicy } from "../../src/core";

describe("policy validation", () => {
  it("accepts version 1 and rejects malformed policies", () => {
    expect(parsePolicy("version: 1\nprofiles:\n  docs:\n    allow: [docs/**]\n").version).toBe(1);
    expect(() => parsePolicy("version: 2\nprofiles: {}\n")).toThrow();
    expect(() => parsePolicy("version: 1\nprofiles:\n  docs:\n    allow: [docs/**]\nextra: true\n")).toThrow();
    expect(() => parsePolicy("version: 1\nprofiles:\n  docs:\n    allow: ['docs/[a]']\n")).toThrow();
  });
});

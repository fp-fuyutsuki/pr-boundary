import { describe, expect, it } from "vitest";
import { safeDisplay, summaryMarkdown } from "../../src/github/render";

describe("untrusted output", () => {
  it("removes controls and escapes markdown", () => {
    expect(safeDisplay("evil\n*path*")).toBe("evil \\*path\\*");
  });

  it("shows the selected profile in the summary", () => {
    const summary = summaryMarkdown({ verdict: "PASS", profile: "docs", reasonCodes: [], findings: [] });
    expect(summary).toContain("Profile: docs");
  });
});

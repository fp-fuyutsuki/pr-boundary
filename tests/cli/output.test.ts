import { describe, expect, it } from "vitest";
import { renderJson, renderText } from "../../src/cli/output";

describe("CLI output", () => {
  it("emits stable text and JSON verdicts", () => {
    const result = { verdict: "BLOCKED" as const, reasonCodes: ["OUTSIDE_SCOPE" as const], findings: [{ path: "src/a.ts", reasons: ["OUTSIDE_SCOPE" as const] }] };
    expect(renderText(result)).toContain("BLOCKED");
    expect(JSON.parse(renderJson(result, "base", "head")).schema_version).toBe(1);
  });

  it("escapes control characters in plain text paths", () => {
    const result = {
      verdict: "BLOCKED" as const,
      reasonCodes: ["OUTSIDE_SCOPE" as const],
      findings: [{ path: "evil\nPASS\nfile.ts", reasons: ["OUTSIDE_SCOPE" as const] }],
    };
    const output = renderText(result);
    expect(output).not.toContain("evil\nPASS");
    expect(output).toContain("evil\\nPASS\\nfile.ts");
  });
});

import { describe, expect, it } from "vitest";
import { evaluateChanges, parsePolicy, selectProfile } from "../../src/core";

const policy = parsePolicy("version: 1\nprofiles:\n  docs:\n    allow: [\"docs/**\"]\n  ci:\n    allow: [\".github/workflows/**\"]\n    allow_protected: true\nprotected: [\".github/workflows/**\"]\ndefaults:\n  no_profile: pass\n");

describe("evaluator", () => {
  it("passes allowed and blocks outside paths", () => {
    expect(evaluateChanges(policy, selectProfile(policy, ["scope:docs"]), [{ status: "modified", filename: "docs/a.md" }]).verdict).toBe("PASS");
    expect(evaluateChanges(policy, selectProfile(policy, ["scope:docs"]), [{ status: "modified", filename: "src/a.ts" }]).verdict).toBe("BLOCKED");
  });
  it("checks both rename paths and protected privilege", () => {
    const renamed = evaluateChanges(policy, selectProfile(policy, ["scope:docs"]), [{ status: "renamed", previousFilename: ".github/workflows/a.yml", filename: "docs/a.md" }]);
    expect(renamed.verdict).toBe("BLOCKED");
    expect(renamed.reasonCodes).toContain("PROTECTED_PATH");
    expect(evaluateChanges(policy, selectProfile(policy, ["scope:ci"]), [{ status: "modified", filename: ".github/workflows/a.yml" }]).verdict).toBe("PASS");
  });
  it("handles no profile, multiple profiles, and unknown labels", () => {
    expect(evaluateChanges(policy, selectProfile(policy, []), [{ status: "modified", filename: "README.md" }]).verdict).toBe("PASS");
    expect(evaluateChanges(policy, selectProfile(policy, ["scope:docs", "scope:ci"]), []).reasonCodes).toContain("MULTIPLE_PROFILES");
    expect(evaluateChanges(policy, selectProfile(policy, ["scope:unknown"]), []).reasonCodes).toContain("UNKNOWN_SCOPE_LABEL");
  });
});

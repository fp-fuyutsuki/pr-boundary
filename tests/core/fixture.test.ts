import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { evaluateChanges, parsePolicy, selectProfile } from "../../src/core";

interface Vector {
  id: string;
  profile: string | null;
  no_profile_mode: "review" | "pass";
  profile_allow: string[];
  allow_protected: boolean;
  protected: string[];
  changes: Array<{ status: "added" | "modified" | "removed" | "renamed"; path: string; previous_path?: string }>;
  expected_verdict: "PASS" | "REVIEW_REQUIRED" | "BLOCKED";
  expected_reason_codes: string[];
}

const fixture = JSON.parse(readFileSync(join(process.cwd(), "spec-fixtures/evaluator-vectors.json"), "utf8")) as { cases: Vector[] };

describe("spec evaluator vectors", () => {
  for (const vector of fixture.cases) {
    it(vector.id, () => {
      const policy = parsePolicy([
        "version: 1",
        "profiles:",
        "  selected:",
        "    allow: " + JSON.stringify(vector.profile_allow.length > 0 ? vector.profile_allow : ["__unused__"]),
        "    allow_protected: " + String(vector.allow_protected),
        "protected: " + JSON.stringify(vector.protected),
        "defaults:",
        "  no_profile: " + vector.no_profile_mode
      ].join("\n"));
      const selection = vector.profile ? selectProfile(policy, [], "selected") : selectProfile(policy, []);
      const changes = vector.changes.map((change) => ({
        status: change.status,
        filename: change.path,
        previousFilename: change.previous_path
      }));
      const result = evaluateChanges(policy, selection, changes);
      expect(result.verdict).toBe(vector.expected_verdict);
      expect(result.reasonCodes).toEqual(vector.expected_reason_codes);
    });
  }
});

import { describe, expect, it } from "vitest";
import { evaluateChanges, parsePolicy, selectProfile } from "../../src/core";

const policy = parsePolicy("version: 1\nlabel_prefix: \"scope:\"\nprofiles:\n  deps:\n    allow:\n      - \"package.json\"\n      - \"package-lock.json\"\n      - \"dist/action/**\"\n      - \"dist/cli/**\"\n    allow_protected: true\n  tooling:\n    allow:\n      - \"vitest.config.mjs\"\n      - \"dist/action/**\"\n      - \"dist/cli/**\"\n    allow_protected: true\nprotected:\n  - \"dist/**\"\ndefaults:\n  no_profile: review\n");

describe("self-dogfood policy", () => {
  it("allows dependency changes with both generated bundles", () => {
    const result = evaluateChanges(policy, selectProfile(policy, ["scope:deps"]), [
      { status: "modified", filename: "package.json" },
      { status: "modified", filename: "dist/action/index.js" },
      { status: "modified", filename: "dist/cli/index.js" },
    ]);
    expect(result.verdict).toBe("PASS");
  });

  it("allows tooling changes with both generated bundles", () => {
    const result = evaluateChanges(policy, selectProfile(policy, ["scope:tooling"]), [
      { status: "modified", filename: "vitest.config.mjs" },
      { status: "modified", filename: "dist/action/index.js" },
      { status: "modified", filename: "dist/cli/index.js" },
    ]);
    expect(result.verdict).toBe("PASS");
  });
});

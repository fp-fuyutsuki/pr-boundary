import { describe, expect, it } from "vitest";
import { evaluateChanges, parsePolicy, selectProfile } from "../../src/core";
import { finalSnapshotRequiresReview, getInitialSnapshot, type LabelTransition } from "../../src/github/action";
import { listChangedFiles } from "../../src/github/changed-files";
import { loadPolicyAtBase } from "../../src/github/policy-loader";

describe("GitHub snapshot to evaluation flow", () => {
  it("retries a just-added scope label and passes the docs change", async () => {
    let snapshotCalls = 0;
    const policyContent = Buffer.from("version: 1\nlabel_prefix: \"scope:\"\nprofiles:\n  docs:\n    allow:\n      - \"docs/**\"\ndefaults:\n  no_profile: review\n").toString("base64");
    const api = {
      rest: {
        pulls: {
          get: async () => ({
            data: {
              number: 3,
              head: { sha: "head" },
              base: { sha: "base" },
              changed_files: 1,
              labels: snapshotCalls++ === 0 ? [] : [{ name: "scope:docs" }],
            },
          }),
          listFiles: async () => ({
            data: [{ status: "modified", filename: "docs/acceptance-docs-pass.md" }],
          }),
        },
        repos: {
          getContent: async () => ({
            data: { type: "file", content: policyContent, encoding: "base64" },
          }),
        },
      },
    } as never;
    const snapshot = await getInitialSnapshot(api, "owner", "repo", 3, { name: "scope:docs", shouldBePresent: true });
    const policy = await loadPolicyAtBase(api, "owner", "repo", snapshot.baseSha);
    const selection = selectProfile(policy, snapshot.labels);
    const changes = await listChangedFiles(api, "owner", "repo", snapshot.number, snapshot.changedFiles);
    const result = evaluateChanges(policy, selection, changes);
    expect(selection.profile).toBe("docs");
    expect(result.verdict).toBe("PASS");
  });

  it("retries an unlabeled transition and returns NO_PROFILE", async () => {
    let snapshotCalls = 0;
    const api = {
      rest: {
        pulls: {
          get: async () => ({
            data: {
              number: 3,
              head: { sha: "head" },
              base: { sha: "base" },
              changed_files: 1,
              labels: snapshotCalls++ === 0 ? [{ name: "scope:docs" }] : [],
            },
          }),
        },
      },
    } as never;
    const snapshot = await getInitialSnapshot(api, "owner", "repo", 3, { name: "scope:docs", shouldBePresent: false });
    const policy = parsePolicy("version: 1\nlabel_prefix: \"scope:\"\nprofiles:\n  docs:\n    allow: [\"docs/**\"]\ndefaults:\n  no_profile: review\n");
    const result = evaluateChanges(policy, selectProfile(policy, snapshot.labels), []);
    expect(snapshot.labels).toEqual([]);
    expect(result.verdict).toBe("REVIEW_REQUIRED");
    expect(result.reasonCodes).toEqual(["NO_PROFILE"]);
  });

  it("does not pass when an unlabeled final snapshot still has the scope label", () => {
    const transition: LabelTransition = { name: "scope:docs", shouldBePresent: false };
    const snapshot = (labels: string[]) => ({ number: 3, headSha: "head", baseSha: "base", labels, changedFiles: 1 });
    expect(finalSnapshotRequiresReview(snapshot(["scope:docs"]), snapshot(["scope:docs"]), "scope:", transition)).toBe(true);
  });

  it("keeps an empty label set as NO_PROFILE", async () => {
    const policy = parsePolicy("version: 1\nlabel_prefix: \"scope:\"\nprofiles:\n  docs:\n    allow: [\"docs/**\"]\ndefaults:\n  no_profile: review\n");
    const selection = selectProfile(policy, []);
    expect(evaluateChanges(policy, selection, []).reasonCodes).toEqual(["NO_PROFILE"]);
  });
});

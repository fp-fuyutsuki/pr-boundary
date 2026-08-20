import { describe, expect, it } from "vitest";
import { getPrSnapshot } from "../../src/github/snapshot";

describe("PR snapshot", () => {
  it("captures the current head, base, labels, and file count", async () => {
    const api = {
      rest: {
        pulls: {
          get: async () => ({
            data: {
              number: 7,
              head: { sha: "head" },
              base: { sha: "base" },
              changed_files: 3,
              labels: [{ name: "scope:docs" }, { name: "triage" }]
            }
          })
        }
      }
    } as never;
    await expect(getPrSnapshot(api, "owner", "repo", 7)).resolves.toEqual({
      number: 7,
      headSha: "head",
      baseSha: "base",
      changedFiles: 3,
      labels: ["scope:docs", "triage"]
    });
  });

  it("rejects malformed label elements", async () => {
    const api = {
      rest: {
        pulls: {
          get: async () => ({
            data: {
              number: 7,
              head: { sha: "head" },
              base: { sha: "base" },
              changed_files: 0,
              labels: [{ name: "scope:docs" }, { name: null }]
            }
          })
        }
      }
    } as never;
    await expect(getPrSnapshot(api, "owner", "repo", 7)).rejects.toThrow();
  });
});

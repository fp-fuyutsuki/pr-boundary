import { describe, expect, it } from "vitest";
import { loadPolicyAtBase } from "../../src/github/policy-loader";

describe("GitHub policy loader", () => {
  it("loads policy from the exact supplied base SHA", async () => {
    let request: unknown;
    const policy = Buffer.from("version: 1\nlabel_prefix: \"scope:\"\nprofiles:\n  docs:\n    allow:\n      - \"docs/**\"\ndefaults:\n  no_profile: review\n").toString("base64");
    const api = {
      rest: {
        repos: {
          getContent: async (input: unknown) => {
            request = input;
            return { data: { type: "file", content: policy, encoding: "base64" } };
          },
        },
      },
    } as never;
    const loaded = await loadPolicyAtBase(api, "owner", "repo", "exact-base-sha");
    expect(request).toEqual({
      owner: "owner",
      repo: "repo",
      path: ".github/pr-scope.yml",
      ref: "exact-base-sha",
    });
    expect(loaded.version).toBe(1);
  });
});

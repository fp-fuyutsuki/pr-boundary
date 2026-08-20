import { describe, expect, it } from "vitest";
import { publishStatus, STATUS_CONTEXT } from "../../src/github/status";

describe("commit status", () => {
  it("uses the fixed context and supplied exact SHA", async () => {
    const calls: unknown[] = [];
    const api = { rest: { repos: { createCommitStatus: async (input: unknown) => { calls.push(input); } } } } as never;
    await publishStatus(api, "owner", "repo", "head-sha", "success", "PASS");
    expect(calls[0]).toEqual({ owner: "owner", repo: "repo", sha: "head-sha", state: "success", context: STATUS_CONTEXT, description: "PASS" });
  });
});

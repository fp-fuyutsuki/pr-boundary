import { describe, expect, it } from "vitest";
import { parseArgs } from "../../src/cli/args";

describe("CLI arguments", () => {
  it("parses explicit base, head, profile, and format", () => {
    expect(parseArgs(["check", "--base", "main", "--head", "feature", "--profile", "docs", "--format", "json"])).toEqual({
      command: "check",
      base: "main",
      head: "feature",
      profile: "docs",
      format: "json",
      help: false
    });
  });
});

import { describe, expect, it } from "vitest";
import { parseGitDiff } from "../../src/cli/git";

describe("CLI NUL-delimited Git diff parser", () => {
  it("parses added, removed, and renamed records", () => {
    const changes = parseGitDiff("A\0new.txt\0D\0old.txt\0R100\0old.md\0new.md\0");
    expect(changes).toEqual([
      { status: "added", filename: "new.txt" },
      { status: "removed", filename: "old.txt" },
      { status: "renamed", previousFilename: "old.md", filename: "new.md" },
    ]);
  });
});

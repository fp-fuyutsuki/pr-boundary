import { describe, expect, it } from "vitest";
import { validateRepositoryPath } from "../../src/core";

describe("repository paths", () => {
  it("rejects traversal and Windows separators", () => {
    expect(validateRepositoryPath("../secret")).toBe("INVALID_REPOSITORY_PATH");
    expect(validateRepositoryPath("./src/file.ts")).toBe("INVALID_REPOSITORY_PATH");
    expect(validateRepositoryPath("C:\\repo\\file")).toBe("INVALID_REPOSITORY_PATH");
    expect(validateRepositoryPath("src/file.ts")).toBeUndefined();
  });
});

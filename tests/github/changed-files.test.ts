import { describe, expect, it } from "vitest";
import { ChangedFilesIncomplete, listChangedFiles, UnsupportedFileStatus } from "../../src/github/changed-files";

describe("GitHub changed files", () => {
  it("maps deleted to removed and renames", async () => {
    const api = { rest: { pulls: { listFiles: async () => ({ data: [{ status: "deleted", filename: "a" }, { status: "renamed", filename: "b", previous_filename: "a" }] }) } } } as never;
    const files = await listChangedFiles(api, "o", "r", 1, 2);
    expect(files.map((file) => file.status)).toEqual(["removed", "renamed"]);
  });
  it("fails closed above the API limit", async () => {
    let calls = 0;
    const api = { rest: { pulls: { listFiles: async () => { calls += 1; return { data: [] }; } } } } as never;
    await expect(listChangedFiles(api, "o", "r", 1, 3001)).rejects.toBeInstanceOf(ChangedFilesIncomplete);
    expect(calls).toBe(0);
  });

  it("stops after exactly 3000 files without requesting page 31", async () => {
    const pages: number[] = [];
    const api = { rest: { pulls: { listFiles: async ({ page }: { page: number }) => {
      pages.push(page);
      return { data: Array.from({ length: 100 }, (_, index) => ({ status: "modified", filename: page + "-" + index })) };
    } } } } as never;
    const files = await listChangedFiles(api, "o", "r", 1, 3000);
    expect(files).toHaveLength(3000);
    expect(pages).toEqual(Array.from({ length: 30 }, (_, index) => index + 1));
  });

  it("fails closed when the retrieved count does not match", async () => {
    const api = { rest: { pulls: { listFiles: async ({ page }: { page: number }) => ({
      data: page === 1 ? [{ status: "modified", filename: "only-file" }] : [],
    }) } } } as never;
    await expect(listChangedFiles(api, "o", "r", 1, 2)).rejects.toBeInstanceOf(ChangedFilesIncomplete);
  });

  it("reports unsupported statuses separately", async () => {
    const api = { rest: { pulls: { listFiles: async () => ({ data: [{ status: "copied", filename: "a" }] }) } } } as never;
    await expect(listChangedFiles(api, "o", "r", 1, 1)).rejects.toBeInstanceOf(UnsupportedFileStatus);
  });
});

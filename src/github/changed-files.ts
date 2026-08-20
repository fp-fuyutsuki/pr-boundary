import type { FileChange, FileStatus } from "../core/model";
import type { GitHubApi } from "./api";
export class ChangedFilesIncomplete extends Error {}
export class UnsupportedFileStatus extends ChangedFilesIncomplete {}
function status(value: string): FileStatus {
  if (value === "added") return "added";
  if (value === "modified") return "modified";
  if (value === "deleted") return "removed";
  if (value === "removed") return "removed";
  if (value === "renamed") return "renamed";
  throw new UnsupportedFileStatus("unsupported file status");
}
export async function listChangedFiles(api: GitHubApi, owner: string, repo: string, number: number, expected: number): Promise<FileChange[]> {
  if (expected < 0 || expected > 3000) throw new ChangedFilesIncomplete("changed file limit");
  const result: FileChange[] = [];
  for (let page = 1; ; page += 1) {
    let response;
    try {
      response = await api.rest.pulls.listFiles({ owner, repo, pull_number: number, per_page: 100, page });
    } catch {
      throw new ChangedFilesIncomplete("changed files API failure");
    }
    const records = response.data;
    if (!Array.isArray(records)) throw new ChangedFilesIncomplete("invalid file response");
    if (records.length === 0) break;
    for (const record of records) {
      if (typeof record.status !== "string" || typeof record.filename !== "string") throw new ChangedFilesIncomplete("invalid file record");
      const converted = status(record.status);
      if (converted === "renamed" && typeof record.previous_filename !== "string") throw new ChangedFilesIncomplete("missing previous filename");
      result.push({ status: converted, filename: record.filename, previousFilename: converted === "renamed" ? record.previous_filename : undefined });
    }
    if (result.length > expected) throw new ChangedFilesIncomplete("file list exceeds expected count");
    if (result.length === expected) return result;
  }
  throw new ChangedFilesIncomplete("file count mismatch");
}

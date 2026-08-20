import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { normalizeGitPath } from "../core/paths";
import type { FileChange } from "../core/model";

const exec = promisify(execFile);
export class UnsupportedGitStatus extends Error {}
async function git(args: string[]): Promise<string> {
  const result = await exec("git", args, { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 });
  return result.stdout;
}

export function parseGitDiff(output: string): FileChange[] {
  const tokens = output.split("\0").filter(Boolean);
  const changes: FileChange[] = [];
  for (let index = 0; index < tokens.length;) {
    const status = tokens[index++];
    if (status === "A" || status === "M" || status === "D") {
      const path = tokens[index++];
      if (!path) throw new UnsupportedGitStatus("invalid git path record");
      changes.push({ status: status === "A" ? "added" : status === "M" ? "modified" : "removed", filename: normalizeGitPath(path) });
    } else if (status.startsWith("R")) {
      const previous = tokens[index++];
      const next = tokens[index++];
      if (!previous || !next) throw new UnsupportedGitStatus("invalid git rename record");
      changes.push({ status: "renamed", previousFilename: normalizeGitPath(previous), filename: normalizeGitPath(next) });
    } else {
      throw new UnsupportedGitStatus("unsupported git file status");
    }
  }
  return changes;
}
export async function resolveCommit(ref: string): Promise<string> {
  return (await git(["rev-parse", "--verify", "--end-of-options", ref + "^{commit}"])).trim();
}
export async function loadPolicyFromGit(baseSha: string): Promise<string> {
  return git(["show", "--format=", "--no-ext-diff", baseSha + ":.github/pr-scope.yml"]);
}
export async function getChangedFiles(baseSha: string, headSha: string): Promise<FileChange[]> {
  const output = await git(["diff", "--name-status", "-z", "-M", baseSha + "..." + headSha]);
  return parseGitDiff(output);
}

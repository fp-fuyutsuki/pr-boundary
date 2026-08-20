import type { GitHubApi } from "./api";
export interface PrSnapshot {
  number: number;
  headSha: string;
  baseSha: string;
  labels: string[];
  changedFiles: number;
}
export async function getPrSnapshot(api: GitHubApi, owner: string, repo: string, number: number): Promise<PrSnapshot> {
  const response = await api.rest.pulls.get({ owner, repo, pull_number: number });
  const pr = response.data;
  if (!pr.head?.sha || !pr.base?.sha || typeof pr.changed_files !== "number" || !Array.isArray(pr.labels)) throw new Error("invalid PR snapshot");
  const labels = pr.labels.map((label: unknown) => {
    if (label === null || typeof label !== "object" || Array.isArray(label)) throw new Error("invalid PR label");
    const name = (label as { name?: unknown }).name;
    if (typeof name !== "string" || name.length === 0) throw new Error("invalid PR label");
    return name;
  }).sort();
  return {
    number: pr.number,
    headSha: pr.head.sha,
    baseSha: pr.base.sha,
    changedFiles: pr.changed_files,
    labels
  };
}

import type { GitHubApi } from "./api";
export type StatusState = "pending" | "success" | "error" | "failure";
export const STATUS_CONTEXT = "pr-boundary/scope";
export async function publishStatus(api: GitHubApi, owner: string, repo: string, sha: string, state: StatusState, description: string): Promise<void> {
  await api.rest.repos.createCommitStatus({ owner, repo, sha, state, context: STATUS_CONTEXT, description: description.slice(0, 140) });
}

import { getOctokit } from "@actions/github";
export type GitHubApi = ReturnType<typeof getOctokit>;
export function createGitHubApi(token: string): GitHubApi { return getOctokit(token); }

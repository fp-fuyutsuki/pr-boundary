import type { GitHubApi } from "./api";
import { parsePolicy } from "../core/policy";
export class PolicyUnavailable extends Error {}
export class PolicyInvalid extends Error {}
export async function loadPolicyAtBase(api: GitHubApi, owner: string, repo: string, baseSha: string) {
  let response;
  try {
    response = await api.rest.repos.getContent({ owner, repo, path: ".github/pr-scope.yml", ref: baseSha });
  } catch {
    throw new PolicyUnavailable("policy unavailable");
  }
  const data = response.data;
  if (Array.isArray(data) || data.type !== "file" || data.encoding !== "base64" || typeof data.content !== "string") throw new PolicyUnavailable("policy unavailable");
  try {
    return parsePolicy(Buffer.from(data.content.replaceAll("\n", ""), "base64").toString("utf8"));
  } catch {
    throw new PolicyInvalid("policy invalid");
  }
}

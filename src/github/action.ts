import * as core from "@actions/core";
import * as github from "@actions/github";
import { evaluateChanges, selectProfile, type EvaluationResult } from "../core";
import { createGitHubApi } from "./api";
import { ChangedFilesIncomplete, listChangedFiles, UnsupportedFileStatus } from "./changed-files";
import { loadPolicyAtBase, PolicyInvalid, PolicyUnavailable } from "./policy-loader";
import { getPrSnapshot } from "./snapshot";
import { publishStatus } from "./status";
import { statusDescription, summaryMarkdown } from "./render";

const EVENTS = new Set(["opened", "reopened", "synchronize", "labeled", "unlabeled", "edited", "ready_for_review"]);
const LABEL_READ_RETRY_DELAY_MS = 1000;
export interface LabelTransition {
  name: string;
  shouldBePresent: boolean;
}
function review(reasonCodes: EvaluationResult["reasonCodes"]): EvaluationResult {
  return { verdict: "REVIEW_REQUIRED", reasonCodes, findings: [] };
}
export function matchesLabelTransition(snapshot: Awaited<ReturnType<typeof getPrSnapshot>>, transition?: LabelTransition): boolean {
  return !transition || snapshot.labels.includes(transition.name) === transition.shouldBePresent;
}
export async function getInitialSnapshot(api: ReturnType<typeof createGitHubApi>, owner: string, repo: string, number: number, transition?: LabelTransition): Promise<Awaited<ReturnType<typeof getPrSnapshot>>> {
  const first = await getPrSnapshot(api, owner, repo, number);
  if (transition && !matchesLabelTransition(first, transition)) {
    await new Promise<void>((resolve) => setTimeout(resolve, LABEL_READ_RETRY_DELAY_MS));
    return getPrSnapshot(api, owner, repo, number);
  }
  return first;
}
function labelTransition(): LabelTransition | undefined {
  const action = String(github.context.payload.action);
  if (action !== "labeled" && action !== "unlabeled") return undefined;
  const label = github.context.payload.label as { name?: unknown } | undefined;
  if (typeof label?.name !== "string" || label.name.length === 0) return undefined;
  return { name: label.name, shouldBePresent: action === "labeled" };
}
function labelsForPrefix(labels: string[], prefix: string): string[] {
  return labels.filter((label) => label.startsWith(prefix)).sort();
}
function stateChanged(before: Awaited<ReturnType<typeof getPrSnapshot>>, after: Awaited<ReturnType<typeof getPrSnapshot>>, prefix: string): boolean {
  return before.headSha !== after.headSha || before.baseSha !== after.baseSha || labelsForPrefix(before.labels, prefix).join("\n") !== labelsForPrefix(after.labels, prefix).join("\n") || before.changedFiles !== after.changedFiles;
}
export function finalSnapshotRequiresReview(before: Awaited<ReturnType<typeof getPrSnapshot>>, after: Awaited<ReturnType<typeof getPrSnapshot>>, prefix: string, transition?: LabelTransition): boolean {
  return !matchesLabelTransition(after, transition) || stateChanged(before, after, prefix);
}
export async function runAction(): Promise<void> {
  if (github.context.eventName !== "pull_request_target" || !EVENTS.has(String(github.context.payload.action))) {
    core.setFailed("GITHUB_EVENT_UNSUPPORTED");
    return;
  }
  const pr = github.context.payload.pull_request as { number?: number } | undefined;
  const repository = github.context.repo;
  if (!pr?.number) {
    core.setFailed("GITHUB_EVENT_UNSUPPORTED");
    return;
  }
  const token = core.getInput("github-token", { required: true });
  const api = createGitHubApi(token);
  const transition = labelTransition();
  const first = await getInitialSnapshot(api, repository.owner, repository.repo, pr.number, transition);
  await publishStatus(api, repository.owner, repository.repo, first.headSha, "pending", "PR Boundary evaluation started");
  let result: EvaluationResult;
  let prefix = "scope:";
  try {
    const policy = await loadPolicyAtBase(api, repository.owner, repository.repo, first.baseSha);
    prefix = policy.labelPrefix;
    const selection = selectProfile(policy, first.labels);
    const changes = await listChangedFiles(api, repository.owner, repository.repo, first.number, first.changedFiles);
    result = evaluateChanges(policy, selection, changes);
  } catch (error) {
    result = error instanceof UnsupportedFileStatus ? review(["UNSUPPORTED_FILE_STATUS"])
      : error instanceof ChangedFilesIncomplete ? review(["CHANGED_FILES_INCOMPLETE"])
      : error instanceof PolicyInvalid ? review(["POLICY_INVALID"])
      : error instanceof PolicyUnavailable ? review(["POLICY_UNAVAILABLE"])
      : review(["INTERNAL_ERROR"]);
  }
  try {
    const final = await getPrSnapshot(api, repository.owner, repository.repo, first.number);
    if (finalSnapshotRequiresReview(first, final, prefix, transition)) result = { verdict: "REVIEW_REQUIRED", reasonCodes: ["PR_STATE_CHANGED"], findings: [] };
  } catch {
    result = review(["INTERNAL_ERROR"]);
  }
  core.setOutput("verdict", result.verdict);
  core.setOutput("profile", result.profile ?? "");
  core.setOutput("reason-codes", result.reasonCodes.join(","));
  core.setOutput("head-sha", first.headSha);
  await core.summary.addRaw(summaryMarkdown(result)).write();
  const state = result.verdict === "PASS" ? "success" : result.verdict === "BLOCKED" ? "failure" : "error";
  await publishStatus(api, repository.owner, repository.repo, first.headSha, state, statusDescription(result));
}

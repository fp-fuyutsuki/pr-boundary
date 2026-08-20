import { evaluateChanges, parsePolicy, selectProfile, type EvaluationResult } from "../core";
import { getChangedFiles, loadPolicyFromGit, resolveCommit, UnsupportedGitStatus } from "./git";
import { parseArgs } from "./args";
import { renderJson, renderText } from "./output";

export const HELP = "Usage: pr-boundary check --base <ref> --head <ref> [--profile <name>] [--format text|json]";
export async function runCli(argv: string[]): Promise<number> {
  const args = parseArgs(argv);
  if (args.help) {
    process.stdout.write(HELP + "\n");
    return 0;
  }
  if (args.command !== "check" || !args.base || !args.head) {
    process.stderr.write(HELP + "\n");
    return 1;
  }
  let result: EvaluationResult;
  let baseSha = "";
  let headSha = "";
  try {
    baseSha = await resolveCommit(args.base);
    headSha = await resolveCommit(args.head);
  } catch {
    process.stderr.write("Unable to resolve Git ref\n");
    return 1;
  }
  let policyText: string;
  try {
    policyText = await loadPolicyFromGit(baseSha);
  } catch {
    result = { verdict: "REVIEW_REQUIRED", reasonCodes: ["POLICY_UNAVAILABLE"], findings: [] };
    process.stdout.write(args.format === "json" ? renderJson(result, baseSha, headSha) : renderText(result));
    return 2;
  }
  let policy;
  try {
    policy = parsePolicy(policyText);
  } catch {
    result = { verdict: "REVIEW_REQUIRED", reasonCodes: ["POLICY_INVALID"], findings: [] };
    process.stdout.write(args.format === "json" ? renderJson(result, baseSha, headSha) : renderText(result));
    return 2;
  }
  let changes;
  try {
    changes = await getChangedFiles(baseSha, headSha);
  } catch (error) {
    if (error instanceof UnsupportedGitStatus) {
      result = { verdict: "REVIEW_REQUIRED", reasonCodes: ["UNSUPPORTED_FILE_STATUS"], findings: [] };
      process.stdout.write(args.format === "json" ? renderJson(result, baseSha, headSha) : renderText(result));
      return 2;
    }
    process.stderr.write("Unable to read Git diff\n");
    return 1;
  }
  result = evaluateChanges(policy, selectProfile(policy, [], args.profile), changes);
  process.stdout.write(args.format === "json" ? renderJson(result, baseSha, headSha) : renderText(result));
  return result.verdict === "PASS" ? 0 : result.verdict === "BLOCKED" ? 3 : result.reasonCodes.includes("INTERNAL_ERROR") && !baseSha ? 1 : 2;
}

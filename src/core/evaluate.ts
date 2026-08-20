import { compileGlobs } from "./glob";
import { validateRepositoryPath } from "./paths";
import { sortReasons } from "./reasons";
import type { EvaluationResult, FileChange, Policy, ReasonCode } from "./model";
import type { ProfileSelection } from "./profiles";

export function evaluateChanges(policy: Policy, selection: ProfileSelection, changes: FileChange[]): EvaluationResult {
  if (selection.reason && !selection.migration) {
    return { verdict: "REVIEW_REQUIRED", profile: selection.profile, reasonCodes: [selection.reason], findings: [] };
  }
  const profile = selection.profile ? policy.profiles[selection.profile] : undefined;
  const allow = profile ? compileGlobs(profile.allow) : [];
  const protectedPatterns = compileGlobs(policy.protected);
  const findings: EvaluationResult["findings"] = [];
  const globalReasons: ReasonCode[] = selection.reason ? [selection.reason] : [];
  for (const change of changes) {
    const paths = change.status === "renamed" ? [change.previousFilename, change.filename] : [change.filename];
    for (const path of paths) {
      if (path === undefined || validateRepositoryPath(path)) {
        globalReasons.push("INVALID_REPOSITORY_PATH");
        continue;
      }
      const allowed = selection.migration ? true : allow.some((match) => match(path));
      const protectedPath = protectedPatterns.some((match) => match(path));
      const reasons: ReasonCode[] = [];
      if (!allowed) reasons.push("OUTSIDE_SCOPE");
      if (protectedPath && (!profile || !profile.allowProtected)) reasons.push("PROTECTED_PATH");
      if (reasons.length > 0) findings.push({ path, reasons: sortReasons(reasons) });
    }
  }
  const reasonCodes = sortReasons([...globalReasons, ...findings.flatMap((finding) => finding.reasons)]);
  const verdict = findings.length > 0 ? "BLOCKED" : reasonCodes.length > 0 ? "REVIEW_REQUIRED" : "PASS";
  return { verdict, profile: selection.profile, reasonCodes, findings };
}

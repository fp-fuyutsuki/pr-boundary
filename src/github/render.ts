import type { EvaluationResult } from "../core/model";
export function safeDisplay(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/[\\\u0060*_{}[\]()#+\-.!|>]/g, "\\$&").replace(/\s+/g, " ").trim();
}
export function statusDescription(result: EvaluationResult): string {
  const reasons = result.reasonCodes.join(", ");
  return result.verdict + (reasons ? ": " + reasons : "");
}
export function summaryMarkdown(result: EvaluationResult): string {
  const lines = ["## PR Boundary: " + result.verdict, "", "Profile: " + (result.profile ?? "none"), "Reasons: " + (result.reasonCodes.join(", ") || "none"), ""];
  for (const finding of result.findings) lines.push("- " + safeDisplay(finding.path) + ": " + finding.reasons.join(", "));
  return lines.join("\n");
}

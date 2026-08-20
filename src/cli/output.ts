import type { EvaluationResult } from "../core/model";

export function safeText(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, (character) => {
    if (character === "\n") return "\\n";
    if (character === "\r") return "\\r";
    if (character === "\t") return "\\t";
    return "\\x" + character.charCodeAt(0).toString(16).padStart(2, "0").toUpperCase();
  });
}

export function renderText(result: EvaluationResult): string {
  const lines = [result.verdict, "Reasons: " + (result.reasonCodes.join(", ") || "none")];
  for (const finding of result.findings) lines.push(safeText(finding.path) + " [" + finding.reasons.join(", ") + "]");
  return lines.join("\n") + "\n";
}
export function renderJson(result: EvaluationResult, baseSha: string, headSha: string): string {
  return JSON.stringify({
    schema_version: 1,
    verdict: result.verdict,
    profile: result.profile,
    base_sha: baseSha,
    head_sha: headSha,
    reasons: result.reasonCodes.map((code) => ({ code })),
    files: result.findings
  }, null, 2) + "\n";
}

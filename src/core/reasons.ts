import type { ReasonCode } from "./model";

export const REASON_ORDER: ReasonCode[] = [
  "OUTSIDE_SCOPE", "PROTECTED_PATH", "NO_PROFILE", "MULTIPLE_PROFILES",
  "UNKNOWN_SCOPE_LABEL", "POLICY_UNAVAILABLE", "POLICY_INVALID",
  "CHANGED_FILES_INCOMPLETE", "INVALID_REPOSITORY_PATH", "UNSUPPORTED_FILE_STATUS",
  "GITHUB_EVENT_UNSUPPORTED", "PR_STATE_CHANGED", "INTERNAL_ERROR"
];

export function sortReasons(codes: Iterable<ReasonCode>): ReasonCode[] {
  const set = new Set(codes);
  return REASON_ORDER.filter((code) => set.has(code));
}

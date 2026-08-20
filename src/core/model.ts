export type Verdict = "PASS" | "REVIEW_REQUIRED" | "BLOCKED";

export type ReasonCode =
  | "OUTSIDE_SCOPE"
  | "PROTECTED_PATH"
  | "NO_PROFILE"
  | "MULTIPLE_PROFILES"
  | "UNKNOWN_SCOPE_LABEL"
  | "POLICY_UNAVAILABLE"
  | "POLICY_INVALID"
  | "CHANGED_FILES_INCOMPLETE"
  | "INVALID_REPOSITORY_PATH"
  | "UNSUPPORTED_FILE_STATUS"
  | "GITHUB_EVENT_UNSUPPORTED"
  | "PR_STATE_CHANGED"
  | "INTERNAL_ERROR";

export type FileStatus = "added" | "modified" | "removed" | "renamed";

export interface FileChange {
  status: FileStatus;
  filename: string;
  previousFilename?: string;
}

export interface Profile {
  allow: string[];
  allowProtected: boolean;
}

export interface Policy {
  version: 1;
  labelPrefix: string;
  profiles: Record<string, Profile>;
  protected: string[];
  noProfile: "review" | "pass";
}

export interface Finding {
  path: string;
  reasons: ReasonCode[];
}

export interface EvaluationResult {
  verdict: Verdict;
  profile?: string;
  reasonCodes: ReasonCode[];
  findings: Finding[];
}

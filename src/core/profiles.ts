import type { Policy } from "./model";

export interface ProfileSelection {
  profile?: string;
  reason?: "NO_PROFILE" | "MULTIPLE_PROFILES" | "UNKNOWN_SCOPE_LABEL";
  migration: boolean;
}

export function selectProfile(policy: Policy, labels: string[], explicit?: string): ProfileSelection {
  if (explicit !== undefined) {
    if (explicit === "") return { migration: policy.noProfile === "pass", reason: policy.noProfile === "pass" ? undefined : "NO_PROFILE" };
    if (!policy.profiles[explicit]) return { migration: false, reason: "UNKNOWN_SCOPE_LABEL" };
    return { profile: explicit, migration: false };
  }
  const scoped = labels.filter((label) => label.startsWith(policy.labelPrefix));
  if (scoped.length === 0) return { migration: policy.noProfile === "pass", reason: policy.noProfile === "pass" ? undefined : "NO_PROFILE" };
  const names = scoped.map((label) => label.slice(policy.labelPrefix.length));
  if (names.some((name) => !policy.profiles[name])) return { migration: false, reason: "UNKNOWN_SCOPE_LABEL" };
  if (names.length !== 1) return { migration: false, reason: "MULTIPLE_PROFILES" };
  return { profile: names[0], migration: false };
}

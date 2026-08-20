import { parse } from "yaml";
import { compileGlobs } from "./glob";
import type { Policy, Profile } from "./model";

const MAX_POLICY_BYTES = 256 * 1024;
const MAX_PROFILES = 100;
const MAX_PATTERNS = 2000;
const PROFILE_NAME = /^[a-z0-9][a-z0-9_-]{0,63}$/;

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function strings(value: unknown): string[] | undefined {
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : undefined;
}

function rejectUnknownKeys(value: Record<string, unknown>, allowed: string[]): void {
  if (Object.keys(value).some((key) => !allowed.includes(key))) throw new Error("unknown policy key");
}

export function parsePolicy(text: string): Policy {
  if (Buffer.byteLength(text, "utf8") > MAX_POLICY_BYTES) throw new Error("policy too large");
  const root = record(parse(text));
  if (!root || root.version !== 1) throw new Error("invalid policy version");
  rejectUnknownKeys(root, ["version", "label_prefix", "profiles", "protected", "defaults"]);
  const prefix = root.label_prefix === undefined ? "scope:" : root.label_prefix;
  if (typeof prefix !== "string" || prefix.length === 0 || prefix.includes("\0")) throw new Error("invalid label prefix");
  const rawProfiles = record(root.profiles);
  if (!rawProfiles || Object.keys(rawProfiles).length === 0 || Object.keys(rawProfiles).length > MAX_PROFILES) throw new Error("invalid profiles");
  const profiles: Record<string, Profile> = {};
  let patternCount = 0;
  for (const [name, value] of Object.entries(rawProfiles)) {
    if (!PROFILE_NAME.test(name)) throw new Error("invalid profile name");
    const item = record(value);
    if (!item) throw new Error("invalid profile");
    rejectUnknownKeys(item, ["allow", "allow_protected"]);
    const allow = item && strings(item.allow);
    if (!allow || allow.length === 0) throw new Error("invalid allow patterns");
    const allowProtected = item.allow_protected === undefined ? false : item.allow_protected;
    if (typeof allowProtected !== "boolean") throw new Error("invalid allow_protected");
    compileGlobs(allow);
    patternCount += allow.length;
    profiles[name] = { allow, allowProtected };
  }
  const protectedPatterns = root.protected === undefined ? [] : strings(root.protected);
  if (!protectedPatterns) throw new Error("invalid protected patterns");
  compileGlobs(protectedPatterns);
  patternCount += protectedPatterns.length;
  if (patternCount > MAX_PATTERNS) throw new Error("too many patterns");
  const defaults = root.defaults === undefined ? {} : record(root.defaults);
  if (!defaults) throw new Error("invalid defaults");
  rejectUnknownKeys(defaults, ["no_profile"]);
  const noProfile = defaults?.no_profile === undefined ? "review" : defaults.no_profile;
  if (noProfile !== "review" && noProfile !== "pass") throw new Error("invalid no_profile mode");
  return { version: 1, labelPrefix: prefix, profiles, protected: protectedPatterns, noProfile };
}

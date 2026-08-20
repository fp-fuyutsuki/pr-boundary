export function validateRepositoryPath(path: unknown): string | undefined {
  if (typeof path !== "string" || path.length === 0 || path.includes("\0")) return "INVALID_REPOSITORY_PATH";
  if (path.startsWith("/") || /^[A-Za-z]:[\\/]/.test(path) || path.includes("\\")) return "INVALID_REPOSITORY_PATH";
  const segments = path.split("/");
  if (segments.some((segment) => segment.length === 0 || segment === "." || segment === "..")) return "INVALID_REPOSITORY_PATH";
  return undefined;
}

export function normalizeGitPath(path: string): string {
  return path;
}

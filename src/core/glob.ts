type Segment = { recursive: true } | { recursive: false; regex: RegExp };

const unsupported = /[?\[\]{}!\\]/;

function compileSegment(segment: string): Segment {
  if (segment === "**") return { recursive: true };
  if (unsupported.test(segment)) throw new Error("unsupported glob syntax");
  if (segment.includes("**")) throw new Error("unsupported glob syntax");
  let source = "";
  for (const char of segment) source += char === "*" ? ".*" : escapeRegex(char);
  return { recursive: false, regex: new RegExp("^" + source + "$") };
}

function escapeRegex(char: string): string {
  return /[\\^$.*+?()[\]{}|]/.test(char) ? "\\" + char : char;
}

export function compileGlob(pattern: string): (path: string) => boolean {
  if (typeof pattern !== "string" || pattern.length === 0 || pattern.startsWith("/") || pattern.includes("\0")) {
    throw new Error("invalid glob");
  }
  const parts = pattern.split("/");
  if (parts.some((part) => part.length === 0 || part === "." || part === "..")) throw new Error("invalid glob");
  const segments = parts.map(compileSegment);
  return (path) => {
    const pathParts = path.split("/");
    const memo = new Map<string, boolean>();
    const match = (pi: number, xi: number): boolean => {
      const key = pi + ":" + xi;
      const known = memo.get(key);
      if (known !== undefined) return known;
      let result: boolean;
      if (pi === segments.length) result = xi === pathParts.length;
      else if (segments[pi].recursive) {
        result = match(pi + 1, xi) || (xi < pathParts.length && match(pi, xi + 1));
      } else {
        result = xi < pathParts.length && segments[pi].regex.test(pathParts[xi]) && match(pi + 1, xi + 1);
      }
      memo.set(key, result);
      return result;
    };
    return match(0, 0);
  };
}

export function compileGlobs(patterns: string[]): ((path: string) => boolean)[] {
  return patterns.map(compileGlob);
}

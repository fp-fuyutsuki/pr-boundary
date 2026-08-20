import { describe, expect, it } from "vitest";
import { compileGlob } from "../../src/core/glob";

describe("glob subset", () => {
  it("keeps star inside one path segment and lets double star cross directories", () => {
    expect(compileGlob("docs/*.md")("docs/a.md")).toBe(true);
    expect(compileGlob("docs/*.md")("docs/a/b.md")).toBe(false);
    expect(compileGlob("**/*.md")(".hidden/readme.md")).toBe(true);
  });
  it("rejects unsupported syntax", () => {
    for (const pattern of ["docs/?.md", "docs/[a].md", "docs/{a}.md", "!docs/**", "docs\\file.md"]) {
      expect(() => compileGlob(pattern)).toThrow();
    }
  });
  it("treats plus and parentheses as literal characters", () => {
    expect(compileGlob("docs/C++/guide.md")("docs/C++/guide.md")).toBe(true);
    expect(compileGlob("docs/(draft).md")("docs/(draft).md")).toBe(true);
  });
});

import ncc from "@vercel/ncc";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

await mkdir("dist/action", { recursive: true });
await mkdir("dist/cli", { recursive: true });

async function bundle(entry, output) {
  const { code } = await ncc(entry, {
    cache: false,
    minify: false,
    sourceMap: false,
    target: "es2022"
  });
  await writeFile(output, code);
}

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
await bundle(resolve(root, "src/action-entry.ts"), resolve(root, "dist/action/index.js"));
await bundle(resolve(root, "src/cli-entry.ts"), resolve(root, "dist/cli/index.js"));

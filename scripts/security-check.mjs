// Fails the build if the codebase contains dangerous patterns.
// Run with: npm run security:check

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const FORBIDDEN = [
  { pattern: /\bdangerouslySetInnerHTML\b/, reason: "XSS vector — do not use" },
  { pattern: /\.innerHTML\s*=/, reason: "XSS vector — use textContent or React" },
  { pattern: /\bnew Function\b/, reason: "Code injection vector" },
  { pattern: /\beval\s*\(/, reason: "Code injection vector" },
  { pattern: /document\.write\b/, reason: "XSS vector" },
  { pattern: /localStorage\.setItem\([^)]*token/i, reason: "Tokens must not go in localStorage" },
  { pattern: /sessionStorage\.setItem\([^)]*token/i, reason: "Tokens must not go in sessionStorage" },
];

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist") continue;
      yield* walk(full);
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      yield full;
    }
  }
}

let failed = false;
for await (const file of walk("src")) {
  const content = await readFile(file, "utf8");
  for (const { pattern, reason } of FORBIDDEN) {
    if (pattern.test(content)) {
      console.error(`[security] ${file}: ${reason}`);
      failed = true;
    }
  }
}

if (failed) {
  process.exit(1);
}
console.log("[security] OK");
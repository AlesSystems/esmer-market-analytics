import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../../src/ui");
const entries = [join(root, "App.tsx"), join(root, "style.css")];
/** Ambient declarations are never imported. */
const ambient = ["global.d.ts"];
/** Files owned by the expenses workstream that are not reachable yet; shrink this list, never grow it. */
const allowlist: string[] = [];

const specifier = /^[ \t]*(?:import|export)\s[^;"'`]*?from\s*["']([^"']+)["']|^[ \t]*import\s*["']([^"']+)["']|@import\s*["']([^"']+)["']/gm;

function resolveModule(from: string, spec: string): string | null {
  if (!spec.startsWith(".")) return null;
  const base = resolve(dirname(from), spec);
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}.css`, join(base, "index.ts"), join(base, "index.tsx")])
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  return null;
}

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : /\.(tsx?|css)$/.test(entry.name) ? [path] : [];
  });
}

describe("src/ui reachability", () => {
  it("keeps every module reachable from the app entry", () => {
    const seen = new Set<string>();
    const queue = [...entries];
    while (queue.length) {
      const file = queue.pop()!;
      if (seen.has(file)) continue;
      seen.add(file);
      if (/\.(tsx?|css)$/.test(file))
        for (const match of readFileSync(file, "utf8").matchAll(specifier)) {
          const next = resolveModule(file, match[1] ?? match[2] ?? match[3]);
          if (next) queue.push(next);
        }
    }
    const dead = walk(root).map(file => relative(root, file)).filter(file =>
      !seen.has(join(root, file)) && !ambient.includes(file) && !allowlist.includes(file)).sort();
    expect(dead).toEqual([]);
  });
});

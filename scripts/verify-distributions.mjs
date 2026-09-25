import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { inspectRelease } from "../tools/release-inventory.ts";

const root = resolve("release"), version = JSON.parse(await readFile("package.json", "utf8")).version;
const extractor = resolve("node_modules/electron-winstaller/vendor/7z.exe");
const expected = await inspectRelease(join(root, "win-unpacked"));
assert.deepEqual(expected.violations, []);
const directory = await mkdtemp(join(tmpdir(), "esmer-distribution-inspection-"));
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const records = [];
try {
  for (const [kind, name] of [["installer", `Esmer Market Analytics Setup ${version}.exe`], ["portable", `Esmer Market Analytics ${version}.exe`]]) {
    const output = join(directory, kind), payload = join(output, "payload");
    execFileSync(extractor, ["x", join(root, name), `-o${output}`, "-y"], { stdio: "pipe", windowsHide: true });
    const entries = [];
    async function walk(path = "") {
      for (const entry of await readdir(join(output, path), { withFileTypes: true })) {
        const relative = path ? `${path}/${entry.name}` : entry.name;
        if (entry.isDirectory()) await walk(relative);
        else {
          assert.match(relative, /^(?:\$PLUGINSDIR\/(?:System\.dll|StdUtils\.dll|SpiderBanner\.dll|nsExec\.dll|nsis7z\.dll|WinShell\.dll|app-64\.7z)|\$R0\/Uninstall Esmer Market Analytics\.exe)$/);
          const bytes = await readFile(join(output, relative));
          entries.push({ path: relative, bytes: bytes.length, sha256: sha(bytes) });
        }
      }
    }
    await walk();
    execFileSync(extractor, ["x", join(output, "$PLUGINSDIR", "app-64.7z"), `-o${payload}`, "-y"], { stdio: "pipe", windowsHide: true });
    const actual = await inspectRelease(payload);
    assert.deepEqual(actual, expected, `${kind} payload differs from inspected unpacked files`);
    const bytes = await readFile(join(root, name));
    records.push({ kind, name, bytes: bytes.length, sha256: sha(bytes), containerFiles: entries, payloadMatchesUnpacked: true });
  }
  await writeFile(join(root, "distribution-inspection.json"), JSON.stringify({ records, limitations: "Generated NSIS plugin files are inventoried by name/hash. This is not a general detector of identifying data or a signature trust check." }, null, 2));
  console.log("DISTRIBUTIONS_MATCH_INSPECTED_PAYLOAD");
} finally {
  await rm(directory, { recursive: true, force: true });
}

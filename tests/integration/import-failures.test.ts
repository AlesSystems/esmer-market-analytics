import { afterEach, expect, test } from "vitest";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fork } from "node:child_process";
import { once } from "node:events";
import { DatabaseSync } from "node:sqlite";
import { buildSync } from "esbuild";
import { createHash } from "node:crypto";
import { openStore, type FaultBoundary } from "../../src/store/store";
import { canonical, readPackage, writePackage } from "../../src/source/package";
import { sourcePackage } from "../helpers/store-fixtures";
const directories: string[] = [];
afterEach(() => { for (const path of directories.splice(0)) rmSync(path, { recursive: true, force: true }); });
function fixture() { const dir = mkdtempSync(join(tmpdir(), "import-failures-")); directories.push(dir); return { dir, path: join(dir, "analytics.sqlite") }; }

test.each<FaultBoundary>(["reading", "persistence", "validation", "summary", "activation"])("%s failure keeps the last complete snapshot after restart", boundary => {
  const { path } = fixture(); let store = openStore(path); store.importPackage(sourcePackage("a"));
  store.appendRevision({ kind: "expense", entityId: "expense", value: { net: "7.000000000000001", date: "2025-01-01", reason: "Synthetic", evidence: "fixture:expense" } });
  const before = store.readSnapshot(); store.close();
  store = openStore(path, { fault: current => { if (current === boundary) throw new Error("injected"); } });
  expect(store.importPackage(sourcePackage("b"))).toEqual({ status: "failed", code: "IMPORT_FAILED" }); store.close();
  store = openStore(path); expect(store.readSnapshot()).toEqual(before); expect(store.history().at(-1)?.state).toBe("failed"); store.close();
});

test("invalid essential references, corrupt input, failed and cancelled first imports leave empty state", () => {
  const { path } = fixture(); let store = openStore(path);
  const malformed = JSON.parse(sourcePackage("a").toString());
  malformed.payload.lines[0].documentId = "missing";
  malformed.manifest.streams.lines.sha256 = createHash("sha256").update(canonical(malformed.payload.lines)).digest("hex");
  for (const bytes of [Buffer.from("corrupt"), sourcePackage("a").subarray(0, -1), Buffer.from(canonical(malformed))]) {
    expect(store.importPackage(bytes)).toEqual({ status: "failed", code: "INVALID_PACKAGE" });
    expect(store.readSnapshot().pin).toEqual({ datasetId: null, appRevision: 0 });
  }
  const candidate = store.stage(sourcePackage("a")); if (candidate.status !== "validated") throw new Error("stage");
  expect(store.cancel(candidate.id)).toEqual({ status: "cancelled" });
  expect(store.activate(candidate.id)).toEqual({ status: "failed", code: "INVALID_CANDIDATE" });
  expect(store.prune()).toBe(1); store.close(); store = openStore(path);
  expect(store.readSnapshot().records.lines).toEqual([]); store.close();
  store = openStore(path, { fault: boundary => { if (boundary === "activation") throw new Error("first activation"); } });
  expect(store.importPackage(sourcePackage("a")).status).toBe("failed"); expect(store.readSnapshot().metadata).toBeNull(); store.close();
});

test("real SQLite page exhaustion returns storage pressure and rolls back candidate writes", () => {
  const { path } = fixture(); let store = openStore(path); store.importPackage(sourcePackage("a")); const before = store.readSnapshot(); store.close();
  const db = new DatabaseSync(path); const pages = Number(db.prepare("PRAGMA page_count").get()!.page_count); db.close();
  const parsed = readPackage(sourcePackage("b")); if (!parsed.ok) throw new Error("fixture");
  const large = writePackage([
    { stream: "documents", records: parsed.records.documents },
    { stream: "lines", records: Array.from({ length: 4000 }, (_, i) => ({ ...parsed.records.lines[0], id: `large-${String(i).padStart(5, "0")}` })) },
  ], { ...parsed.metadata, extractionId: "disk-full" });
  store = openStore(path, { maxPages: pages });
  expect(store.importPackage(large)).toEqual({ status: "failed", code: "STORAGE_FULL" });
  expect(store.readSnapshot()).toEqual(before); store.close();
  store = openStore(path); expect(store.readSnapshot()).toEqual(before); store.close();
  const check = new DatabaseSync(path); expect(check.prepare("PRAGMA integrity_check").get()?.integrity_check).toBe("ok"); check.close();
});

test.each((["reading", "persistence", "validation", "summary", "activation"] as const).flatMap(boundary => [false, true].map(loaded => ({ boundary, loaded }))))("process killed during $boundary reports interruption with loaded=$loaded", async ({ boundary, loaded }) => {
  const { dir, path } = fixture(); let store = openStore(path);
  if (loaded) store.importPackage(sourcePackage("a"));
  store.appendRevision({ kind: "expense", entityId: "expense", value: { net: "7", date: "2025-01-01", reason: "Synthetic", evidence: "fixture:expense" } });
  const before = store.readSnapshot(); store.close();
  const packagePath = join(dir, "b.json"); writeFileSync(packagePath, sourcePackage("b"));
  const script = join(dir, "crash.cjs");
  buildSync({ stdin: { contents: `import {openStore} from ${JSON.stringify(resolve("src/store/store.ts"))}; import {readFileSync} from 'node:fs'; const store=openStore(process.argv[2],{fault(boundary){if(boundary===${JSON.stringify(boundary)}){process.send(boundary); Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0);}}}); store.importPackage(readFileSync(process.argv[3]));`, resolveDir: process.cwd(), loader: "ts" }, outfile: script, bundle: true, platform: "node", format: "cjs" });
  const child = fork(script, [path, packagePath], { stdio: ["ignore", "ignore", "pipe", "ipc"] });
  try {
    await new Promise<void>((resolveReady, reject) => {
      const timer = setTimeout(() => reject(new Error("CRASH_BOUNDARY_TIMEOUT")), 5000);
      child.once("message", message => { clearTimeout(timer); if (message === boundary) resolveReady(); else reject(new Error("WRONG_BOUNDARY")); });
      child.once("error", error => { clearTimeout(timer); reject(error); });
      child.once("exit", () => { clearTimeout(timer); reject(new Error("EXIT_BEFORE_BOUNDARY")); });
    });
    const exited = once(child, "exit"); child.kill("SIGKILL"); await exited;
    store = openStore(path);
    try {
      expect(store.readSnapshot()).toEqual(before);
      expect(store.availability()).toMatchObject({ lastImportError: "INTERRUPTED" });
      expect(store.history().at(-1)).toMatchObject({ state: "failed", errorCode: "INTERRUPTED" });
      expect(store.prune()).toBe(boundary === "activation" ? 1 : 0);
      expect(store.importPackage(sourcePackage("b")).status).toBe("active");
      expect(store.availability()).not.toHaveProperty("lastImportError");
    } finally { store.close(); }
    expect(readFileSync(path).length).toBeGreaterThan(0);
  } finally { if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL"); }
});

test.each([false, true])("restart exposes interrupted import while retaining the %s prior dataset", loaded => {
  const { path } = fixture(); let store = openStore(path);
  if (loaded) store.importPackage(sourcePackage("a"));
  const before = store.readSnapshot();
  expect(store.stage(sourcePackage("b")).status).toBe("validated"); store.close();
  store = openStore(path);
  expect(store.availability()).toMatchObject({ status: "ready", store: loaded ? "loaded" : "empty", lastImportError: "INTERRUPTED" });
  expect(store.readSnapshot()).toEqual(before);
  expect(store.importPackage(sourcePackage(loaded ? "a" : "b")).status).toBe(loaded ? "unchanged" : "active");
  expect(store.availability()).not.toHaveProperty("lastImportError"); store.close();
  store = openStore(path); expect(store.availability()).not.toHaveProperty("lastImportError"); store.close();
});

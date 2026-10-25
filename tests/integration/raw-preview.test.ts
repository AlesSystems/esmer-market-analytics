import { expect, test } from "vitest";
import { openStore } from "../../src/store/store";
import { readRawPackage, writeRawPackage } from "../../src/source/raw-package";
import { rawSnapshot } from "../helpers/raw-fixture";
import { sourcePackage } from "../helpers/store-fixtures";

test("imports exact raw values without changing the financial dataset or app history", () => {
  const store = openStore(":memory:");
  try {
    store.importPackage(sourcePackage("a"));
    const before = store.readSnapshot();
    const bytes = writeRawPackage(rawSnapshot(), "fixture:raw", "batch-1");
    expect(store.importSourcePreview(bytes).status).toBe("preview-imported");
    expect(store.readSnapshot()).toEqual(before);
    const result = store.readSourcePreview({ stream: "headers", offset: 0 });
    expect(result.status).toBe("source-preview");
    if (result.status !== "source-preview") throw Error("missing preview");
    expect(result.rows[0].GENELTOPLAM).toBe("123.4567890123456789");
    expect(result.metadata.provenance).toBe("isolated-sql-backup");
    expect(store.importSourcePreview(Buffer.from("{}"))).toEqual({status: "failed", code: "INVALID_PACKAGE"});
    expect(store.readSourcePreview({stream: "headers", offset: 0})).toEqual(result);
  } finally { store.close(); }
});

test("rejects private columns, orphan IDs and financial type mismatches", () => {
  for (const mutate of [
    (s: ReturnType<typeof rawSnapshot>) => { s.headers[0].CUSTOMER_NAME = "private"; },
    (s: ReturnType<typeof rawSnapshot>) => { s.lines[0].FIS = "999"; },
    (s: ReturnType<typeof rawSnapshot>) => { s.lines[0].FIS_TURU = "35"; },
  ]) {
    const snapshot = rawSnapshot(); mutate(snapshot);
    expect(() => writeRawPackage(snapshot, "fixture:raw", "batch-1")).toThrow();
  }
  expect(readRawPackage(Buffer.from("{}"))).toBeNull();
});

test("cancellation rolls back replacement, paging is bounded and recovery preserves private preview", async () => {
  const {mkdtemp, mkdir, readFile, rm} = await import("node:fs/promises");
  const {join} = await import("node:path");
  const {tmpdir} = await import("node:os");
  const {Recovery} = await import("../../src/recovery/backup");
  const {generateRecoveryKey} = await import("../../src/recovery/keys");
  const root = await mkdtemp(join(tmpdir(), "raw-recovery-"));
  const destination = join(root,"backups"); await mkdir(destination);
  const key = generateRecoveryKey();
  let recovery = await Recovery.open(join(root,"original.sqlite"), {destination,key});
  try {
    const store = recovery.store!;
    store.importPackage(sourcePackage("a"));
    store.appendRevision({kind: "expense", entityId: "expense-1", value: {net: "50", date: "2025-01-15", reason: "Synthetic original", evidence: "fixture:expense"}});
    const before = store.readSnapshot();
    store.acceptReport({id: "report-1", pin: before.pin, calculationVersion: "synthetic-v1", evidence: ["fixture:a"], output: {net: "150"}});
    const snapshot = rawSnapshot();
    snapshot.lines = Array.from({length: 60}, (_, i) => ({...snapshot.lines[0], ID: String(i+2)}));
    const bytes = writeRawPackage(snapshot,"fixture:raw","batch-1");
    const generation = store.recoveryGeneration().changed;
    expect(store.importSourcePreview(bytes).status).toBe("preview-imported");
    expect(store.recoveryGeneration().changed).toBe(generation+1);
    expect(store.importSourcePreview(bytes).status).toBe("preview-imported");
    expect(store.recoveryGeneration().changed).toBe(generation+1);
    const expected = store.readSourcePreview({stream:"lines",offset:50});
    expect(expected).toMatchObject({status:"source-preview",total:60,rows: expect.any(Array)});
    if (expected.status !== "source-preview") throw Error("missing");
    expect(expected.rows).toHaveLength(10);
    expect(expected.rows[0].ID).toBe("52");
    expect(() => store.readSourcePreview({stream:"lines",offset:-1})).toThrow("INVALID_PAYLOAD");
    let checks = 0;
    expect(store.importSourcePreview(writeRawPackage(rawSnapshot(),"fixture:raw","batch-2"), {checkCancelled: () => {if (++checks === 3) throw Error("CANCELLED");}})).toEqual({status:"cancelled"});
    expect(store.readSourcePreview({stream:"lines",offset:50})).toEqual(expected);
    expect(store.readSnapshot()).toEqual(before);
    const status = await recovery.backupNow();
    expect(status.state).toBe("ready");
    const artifact = join(destination,`${status.backups[0].id}.esmerbackup`);
    expect((await readFile(artifact)).includes(Buffer.from("123.4567890123456789"))).toBe(false);
    await recovery.close();
    recovery = await Recovery.open(join(root,"restored.sqlite"));
    const restore = await recovery.prepareRestore(artifact,key);
    await recovery.confirmRestore(restore.token);
    expect(recovery.store!.readSourcePreview({stream:"lines",offset:50})).toEqual(expected);
    expect(recovery.store!.readSnapshot()).toEqual(before);
    expect(recovery.store!.readReport("report-1").output).toEqual({net:"150"});
  } finally {await recovery.close(); await rm(root,{recursive:true,force:true});}
});

test("strict preview boundary rejects corrupt hashes, invalid dates, duplicate IDs and numeric payloads", async () => {
  const {canonical, MAX_BYTES} = await import("../../src/source/package");
  const bytes = writeRawPackage(rawSnapshot(),"fixture:raw","batch-1");
  const parsed = JSON.parse(bytes.toString());
  parsed.sha256 = "0".repeat(64);
  expect(readRawPackage(Buffer.from(canonical(parsed)))).toBeNull();
  expect(readRawPackage(Buffer.alloc(MAX_BYTES+1))).toBeNull();
  for (const mutate of [
    (s: ReturnType<typeof rawSnapshot>) => {s.headers.push({...s.headers[0]});},
    (s: ReturnType<typeof rawSnapshot>) => {s.headers[0].FIS_TARIHI = "2025-02-30T12:00:00.000";},
    (s: ReturnType<typeof rawSnapshot>) => {s.headers[0].GENELTOPLAM = "customer@example.org";},
    (s: ReturnType<typeof rawSnapshot>) => {s.engineVersion = "private name";},
    (s: ReturnType<typeof rawSnapshot>) => {s.capturedAt = "2026-02-30T12:00:00.000Z";},
  ]) {const snapshot=rawSnapshot(); mutate(snapshot); expect(() => writeRawPackage(snapshot,"fixture:raw","batch-1")).toThrow("INVALID_PACKAGE");}
});

test("reimport repairs corrupted stored bytes even when the retained package hash matches", async () => {
  const {mkdtemp,rm}=await import("node:fs/promises");const {join}=await import("node:path");const {tmpdir}=await import("node:os");const {DatabaseSync}=await import("node:sqlite");
  const directory=await mkdtemp(join(tmpdir(),"preview-repair-")),path=join(directory,"analytics.sqlite");
  const store=openStore(path);
  try {
    const bytes=writeRawPackage(rawSnapshot(),"fixture:repair","batch-1");
    store.importSourcePreview(bytes);
    const expected=store.readSourcePreview({stream:"headers",offset:0});
    const corrupt=new DatabaseSync(path);try{corrupt.prepare("UPDATE source_preview SET package_json='{}'").run();}finally{corrupt.close();}
    expect(()=>store.readSourcePreview({stream:"headers",offset:0})).toThrow("INVALID_PACKAGE");
    const generation=store.recoveryGeneration().changed;
    expect(store.importSourcePreview(bytes).status).toBe("preview-imported");
    expect(store.readSourcePreview({stream:"headers",offset:0})).toEqual(expected);
    expect(store.recoveryGeneration().changed).toBe(generation+1);
    store.importSourcePreview(bytes);
    expect(store.recoveryGeneration().changed).toBe(generation+1);
  } finally {store.close();await rm(directory,{recursive:true,force:true});}
});
